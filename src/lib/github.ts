import {
  computeStreaks,
  busiestDay,
  topLanguages,
  nightOwlPercent,
  type CalendarDay,
  type RepoLang,
} from "@/lib/stats";
import type { ApiErrorCode, MatchStats } from "@/lib/types";

export class GitHubError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
  ) {
    super(message);
  }
}

const QUERY = /* GraphQL */ `
  query ($login: String!) {
    user(login: $login) {
      name
      login
      avatarUrl
      createdAt
      followers {
        totalCount
      }
      repositories(
        first: 100
        ownerAffiliations: OWNER
        privacy: PUBLIC
        orderBy: { field: STARGAZERS, direction: DESC }
      ) {
        totalCount
        nodes {
          stargazerCount
          primaryLanguage {
            name
          }
        }
      }
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`;

async function fetchEventTimestamps(username: string, token: string): Promise<string[]> {
  const res = await fetch(
    `https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=100`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } },
  );
  if (!res.ok) return []; // night-owl stat is best-effort; never fail the request over it
  const events: { type: string; created_at: string }[] = await res.json();
  return events.filter((e) => e.type === "PushEvent").map((e) => e.created_at);
}

export async function fetchGitHubStats(username: string): Promise<MatchStats> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new GitHubError("UPSTREAM", "Server missing GITHUB_TOKEN");

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { login: username } }),
  });

  if (res.status === 401 || res.status === 403 || res.status === 429) {
    throw new GitHubError("RATE_LIMITED", "GitHub rate limit hit — try again in a minute");
  }
  if (!res.ok) throw new GitHubError("UPSTREAM", `GitHub responded ${res.status}`);

  const json = await res.json();
  const user = json.data?.user;
  if (!user) throw new GitHubError("USER_NOT_FOUND", "Player not found in the squad list");

  const days: CalendarDay[] = user.contributionsCollection.contributionCalendar.weeks.flatMap(
    (w: { contributionDays: CalendarDay[] }) => w.contributionDays,
  );
  const repos: (RepoLang & { stargazerCount: number })[] = user.repositories.nodes ?? [];
  const streaks = computeStreaks(days);
  const eventTimes = await fetchEventTimestamps(username, token);

  return {
    login: user.login,
    name: user.name,
    avatarUrl: user.avatarUrl,
    accountAgeYears: Math.max(
      0,
      Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 31557600000),
    ),
    followers: user.followers.totalCount,
    publicRepos: user.repositories.totalCount,
    totalStars: repos.reduce((sum, r) => sum + r.stargazerCount, 0),
    totalContributions: user.contributionsCollection.contributionCalendar.totalContributions,
    totalCommits: user.contributionsCollection.totalCommitContributions,
    totalPRs: user.contributionsCollection.totalPullRequestContributions,
    totalIssues: user.contributionsCollection.totalIssueContributions,
    longestStreak: streaks.longest,
    currentStreak: streaks.current,
    busiestDay: busiestDay(days),
    topLanguages: topLanguages(repos),
    nightOwlPercent: nightOwlPercent(eventTimes),
  };
}
