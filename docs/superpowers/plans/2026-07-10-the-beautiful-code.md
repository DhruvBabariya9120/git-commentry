# The Beautiful Code — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Web app where a GitHub username produces FIFA World Cup-style AI commentary of the user's coding year plus a downloadable "dev player card".

**Architecture:** Next.js App Router app, stateless. Two POST route handlers: `/api/stats` (GitHub GraphQL + REST → computed `MatchStats`) and `/api/commentary` (Gemini structured JSON → `Commentary`). Client chains both in one TanStack Query mutation, renders animated commentary feed and player card.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, `motion` (v12), TanStack Query 5, React Hook Form 7 + Zod 4, Sonner 2, lucide-react, `@google/genai` 2, html-to-image, Vitest 4.

## Global Constraints

- Latest stable versions only. **Never** install deprecated `@google/generative-ai` — use `@google/genai`.
- **Never** install `framer-motion` — use `motion` package, import from `"motion/react"`.
- Gemini model from `process.env.GEMINI_MODEL`, default `"gemini-2.5-flash"` (stable GA).
- Secrets server-side only: `GITHUB_TOKEN`, `GEMINI_API_KEY`. Never referenced in client components.
- Tailwind semantic tokens (`bg-background`, `text-muted-foreground`, …); no inline `style={{}}` except dynamic values impossible in classes; dark theme is the only theme (set `class="dark"` on `<html>`).
- All UI states covered: loading, empty, error, success. No blank screens.
- Project name everywhere: **The Beautiful Code**. Tagline: *"Your GitHub year, commentated like a World Cup final."*
- Dev machine is Windows / PowerShell; commands below are PowerShell-safe.
- Working directory: `C:\git-commentry` (repo already initialized, spec committed).

## File Structure

```
src/
  app/
    layout.tsx            — fonts, metadata, dark class, Providers
    providers.tsx         — TanStack QueryClientProvider + Sonner Toaster
    page.tsx              — landing + orchestration (client)
    globals.css           — Tailwind 4 + shadcn tokens (generated)
    api/stats/route.ts    — POST: username → MatchStats
    api/commentary/route.ts — POST: MatchStats → Commentary
  lib/
    types.ts              — MatchStats, CommentarySegment, PlayerCard, Commentary, ApiError
    stats.ts              — pure stat computation (unit-tested)
    github.ts             — GitHub GraphQL/REST client, error mapping
    gemini.ts             — Gemini call with responseJsonSchema
  components/
    username-form.tsx     — RHF + Zod input form
    loading-stadium.tsx   — skeleton + rotating status lines
    commentary-feed.tsx   — staggered match-ticker segments
    player-card.tsx       — card + PNG download + share
    error-state.tsx       — human message + retry
src/lib/__tests__/stats.test.ts
```

---

### Task 1: Scaffold project

**Files:**
- Create: entire Next.js scaffold at repo root, `components.json`, `vitest.config.ts`, `.env.local`, `.env.example`
- Modify: `.gitignore` (scaffold provides; verify `.env*` ignored)

**Interfaces:**
- Produces: running dev server, shadcn components in `src/components/ui/`, `npx vitest run` green (no tests yet → passWithNoTests).

- [ ] **Step 1: Scaffold Next.js in-place**

```powershell
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --yes
```

Expected: scaffold created alongside existing `docs/` (create-next-app allows non-empty dir with only dotfiles/docs — if it refuses, scaffold into `tmp-app` and move contents up, preserving `docs/`).

- [ ] **Step 2: Install runtime deps**

```powershell
npm install @google/genai @tanstack/react-query react-hook-form @hookform/resolvers zod motion sonner html-to-image lucide-react
```

- [ ] **Step 3: Install dev deps + init shadcn**

```powershell
npm install -D vitest
npx shadcn@latest init -d
npx shadcn@latest add button card input skeleton badge separator
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { include: ["src/**/*.test.ts"], passWithNoTests: true },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
```

- [ ] **Step 5: Env files**

`.env.example`:
```
GITHUB_TOKEN=ghp_your_token_here
GEMINI_API_KEY=your_gemini_key_here
GEMINI_MODEL=gemini-2.5-flash
```
Copy to `.env.local`, fill real values (ask user for keys if absent). Verify `.gitignore` contains `.env*`.

- [ ] **Step 6: Verify**

Run: `npm run dev` → 200 on `http://localhost:3000`; `npx vitest run` → passes (no tests).

- [ ] **Step 7: Commit**

```powershell
git add -A; git commit -m "chore: scaffold Next.js 16 app with Tailwind 4, shadcn/ui, deps"
```

---

### Task 2: Types + stat computation (TDD)

**Files:**
- Create: `src/lib/types.ts`, `src/lib/stats.ts`
- Test: `src/lib/__tests__/stats.test.ts`

**Interfaces:**
- Produces:
  - `types.ts`: `MatchStats`, `CommentarySegment`, `PlayerCard`, `Commentary`, `ApiErrorCode`, `ApiError`
  - `stats.ts`: `computeStreaks(days: CalendarDay[]): { longest: number; current: number }`, `busiestDay(days: CalendarDay[]): { date: string; count: number }`, `topLanguages(repos: RepoLang[]): { name: string; percent: number }[]`, `nightOwlPercent(isoTimestamps: string[]): number`, and `CalendarDay`, `RepoLang` types.

- [ ] **Step 1: Write `src/lib/types.ts`**

```ts
export interface MatchStats {
  login: string;
  name: string | null;
  avatarUrl: string;
  accountAgeYears: number;
  followers: number;
  publicRepos: number;
  totalStars: number;
  totalContributions: number;
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  longestStreak: number;
  currentStreak: number;
  busiestDay: { date: string; count: number };
  topLanguages: { name: string; percent: number }[];
  nightOwlPercent: number;
}

export interface CommentarySegment {
  minute: string;
  title: string;
  text: string;
}

export interface PlayerCard {
  position: string;
  rating: number;
  playingStyle: string;
  signatureMove: string;
  topSkills: string[];
}

export interface Commentary {
  segments: CommentarySegment[];
  playerCard: PlayerCard;
}

export type ApiErrorCode =
  | "USER_NOT_FOUND"
  | "RATE_LIMITED"
  | "COMMENTARY_FAILED"
  | "BAD_REQUEST"
  | "UPSTREAM";

export interface ApiError {
  code: ApiErrorCode;
  message: string;
}
```

- [ ] **Step 2: Write failing tests `src/lib/__tests__/stats.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { computeStreaks, busiestDay, topLanguages, nightOwlPercent } from "@/lib/stats";

const day = (date: string, contributionCount: number) => ({ date, contributionCount });

describe("computeStreaks", () => {
  it("finds longest run of consecutive active days", () => {
    const days = [
      day("2026-01-01", 2), day("2026-01-02", 1), day("2026-01-03", 0),
      day("2026-01-04", 5), day("2026-01-05", 1), day("2026-01-06", 3),
    ];
    expect(computeStreaks(days)).toEqual({ longest: 3, current: 3 });
  });
  it("current streak is 0 when last day inactive", () => {
    const days = [day("2026-01-01", 4), day("2026-01-02", 0)];
    expect(computeStreaks(days)).toEqual({ longest: 1, current: 0 });
  });
  it("handles empty and all-zero input", () => {
    expect(computeStreaks([])).toEqual({ longest: 0, current: 0 });
    expect(computeStreaks([day("2026-01-01", 0)])).toEqual({ longest: 0, current: 0 });
  });
});

describe("busiestDay", () => {
  it("returns max day, first wins ties", () => {
    const days = [day("2026-02-01", 3), day("2026-02-02", 9), day("2026-02-03", 9)];
    expect(busiestDay(days)).toEqual({ date: "2026-02-02", count: 9 });
  });
  it("empty input → zero day", () => {
    expect(busiestDay([])).toEqual({ date: "", count: 0 });
  });
});

describe("topLanguages", () => {
  it("aggregates by language, percent of total, top 5, sorted desc", () => {
    const repos = [
      { primaryLanguage: { name: "TypeScript" } },
      { primaryLanguage: { name: "TypeScript" } },
      { primaryLanguage: { name: "Python" } },
      { primaryLanguage: null },
    ];
    expect(topLanguages(repos)).toEqual([
      { name: "TypeScript", percent: 67 },
      { name: "Python", percent: 33 },
    ]);
  });
  it("empty → empty array", () => {
    expect(topLanguages([])).toEqual([]);
  });
});

describe("nightOwlPercent", () => {
  it("percent of timestamps between 22:00 and 03:59 UTC", () => {
    const ts = [
      "2026-07-01T23:30:00Z", // night
      "2026-07-02T02:00:00Z", // night
      "2026-07-02T10:00:00Z",
      "2026-07-02T14:00:00Z",
    ];
    expect(nightOwlPercent(ts)).toBe(50);
  });
  it("empty → 0", () => {
    expect(nightOwlPercent([])).toBe(0);
  });
});
```

- [ ] **Step 3: Run to verify FAIL**

Run: `npx vitest run` — Expected: FAIL, cannot resolve `@/lib/stats`.

- [ ] **Step 4: Implement `src/lib/stats.ts`**

```ts
export interface CalendarDay {
  date: string;
  contributionCount: number;
}

export interface RepoLang {
  primaryLanguage: { name: string } | null;
}

export function computeStreaks(days: CalendarDay[]): { longest: number; current: number } {
  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = d.contributionCount > 0 ? run + 1 : 0;
    if (run > longest) longest = run;
  }
  return { longest, current: run };
}

export function busiestDay(days: CalendarDay[]): { date: string; count: number } {
  let best = { date: "", count: 0 };
  for (const d of days) {
    if (d.contributionCount > best.count) best = { date: d.date, count: d.contributionCount };
  }
  return best;
}

export function topLanguages(repos: RepoLang[]): { name: string; percent: number }[] {
  const counts = new Map<string, number>();
  for (const r of repos) {
    const name = r.primaryLanguage?.name;
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, n]) => ({ name, percent: Math.round((n / total) * 100) }));
}

export function nightOwlPercent(isoTimestamps: string[]): number {
  if (isoTimestamps.length === 0) return 0;
  const night = isoTimestamps.filter((t) => {
    const h = new Date(t).getUTCHours();
    return h >= 22 || h < 4;
  }).length;
  return Math.round((night / isoTimestamps.length) * 100);
}
```

- [ ] **Step 5: Run to verify PASS** — `npx vitest run` → all green.

- [ ] **Step 6: Commit**

```powershell
git add src/lib; git commit -m "feat: match stats domain types and pure stat computation with tests"
```

---

### Task 3: GitHub client + `/api/stats` route

**Files:**
- Create: `src/lib/github.ts`, `src/app/api/stats/route.ts`

**Interfaces:**
- Consumes: `stats.ts` functions, `types.ts` `MatchStats`/`ApiError`.
- Produces: `fetchGitHubStats(username: string): Promise<MatchStats>` (throws `GitHubError` with `code: ApiErrorCode`); `POST /api/stats` body `{ username: string }` → 200 `MatchStats` | 4xx/5xx `ApiError` JSON.

- [ ] **Step 1: Write `src/lib/github.ts`**

```ts
import { computeStreaks, busiestDay, topLanguages, nightOwlPercent, type CalendarDay, type RepoLang } from "@/lib/stats";
import type { ApiErrorCode, MatchStats } from "@/lib/types";

export class GitHubError extends Error {
  constructor(public code: ApiErrorCode, message: string) {
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
      followers { totalCount }
      repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC, orderBy: { field: STARGAZERS, direction: DESC }) {
        totalCount
        nodes {
          stargazerCount
          primaryLanguage { name }
        }
      }
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount } }
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
    accountAgeYears: Math.max(0, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 31557600000)),
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
```

- [ ] **Step 2: Write `src/app/api/stats/route.ts`**

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchGitHubStats, GitHubError } from "@/lib/github";
import type { ApiError } from "@/lib/types";

const Body = z.object({
  username: z
    .string()
    .trim()
    .min(1)
    .max(39)
    .regex(/^[a-zA-Z0-9-]+$/, "Invalid GitHub username"),
});

const STATUS: Record<string, number> = {
  USER_NOT_FOUND: 404,
  RATE_LIMITED: 429,
  BAD_REQUEST: 400,
  UPSTREAM: 502,
};

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      { code: "BAD_REQUEST", message: "That doesn't look like a GitHub username" },
      { status: 400 },
    );
  }
  try {
    const stats = await fetchGitHubStats(parsed.data.username);
    return NextResponse.json(stats);
  } catch (err) {
    if (err instanceof GitHubError) {
      return NextResponse.json<ApiError>(
        { code: err.code, message: err.message },
        { status: STATUS[err.code] ?? 502 },
      );
    }
    return NextResponse.json<ApiError>(
      { code: "UPSTREAM", message: "GitHub is having a moment — retry shortly" },
      { status: 502 },
    );
  }
}
```

- [ ] **Step 3: Manual verify (dev server running)**

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/stats -ContentType "application/json" -Body '{"username":"torvalds"}' | ConvertTo-Json -Depth 5
```
Expected: JSON with `totalCommits`, `topLanguages`, etc. Also verify 404 path with `{"username":"this-user-does-not-exist-xyz-123"}`.

- [ ] **Step 4: Commit**

```powershell
git add src/lib/github.ts src/app/api; git commit -m "feat: GitHub stats API route with GraphQL client and error mapping"
```

---

### Task 4: Gemini commentary + `/api/commentary` route

**Files:**
- Create: `src/lib/gemini.ts`, `src/app/api/commentary/route.ts`

**Interfaces:**
- Consumes: `MatchStats`, `Commentary`, `ApiError` from `types.ts`.
- Produces: `generateCommentary(stats: MatchStats): Promise<Commentary>`; `POST /api/commentary` body = `MatchStats` JSON → 200 `Commentary` | error `ApiError`.

- [ ] **Step 1: Write `src/lib/gemini.ts`**

```ts
import { GoogleGenAI } from "@google/genai";
import type { Commentary, MatchStats } from "@/lib/types";

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    segments: {
      type: "array",
      minItems: 6,
      maxItems: 6,
      items: {
        type: "object",
        properties: {
          minute: { type: "string", description: "Match minute marker like \"1'\", \"45+2'\", \"90'\"" },
          title: { type: "string", description: "Segment title, e.g. KICKOFF, HALFTIME PUNDIT ANALYSIS" },
          text: { type: "string", description: "2-4 sentences of dramatic football commentary" },
        },
        required: ["minute", "title", "text"],
      },
    },
    playerCard: {
      type: "object",
      properties: {
        position: { type: "string", description: "Football/dev hybrid position, e.g. Box-to-Box Fullstack" },
        rating: { type: "integer", minimum: 40, maximum: 99 },
        playingStyle: { type: "string" },
        signatureMove: { type: "string" },
        topSkills: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
      },
      required: ["position", "rating", "playingStyle", "signatureMove", "topSkills"],
    },
  },
  required: ["segments", "playerCard"],
};

const SYSTEM = `You are the world's most passionate football (soccer) commentator, hired to narrate a
developer's GitHub year as if it were a World Cup final. You receive their real GitHub statistics.

Rules:
- Produce EXACTLY 6 segments in order: Kickoff (early minutes), First Half, Halftime Pundit Analysis,
  Second Half, Extra Time, Final Whistle.
- Reference the REAL numbers from the stats (commits, streaks, languages, stars, busiest day,
  night-owl percentage). Never invent statistics.
- Full football drama: GOOOAL calls for big days, VAR checks for force-push energy, crowd noise,
  rivalry tension. Halftime segment is calm tactical pundit analysis of their language choices.
- Playful, celebratory, never mean. A quiet year is an underdog story, not a failure.
- Player card position must fuse football and dev vocabulary (e.g. "Box-to-Box Fullstack",
  "Deep-Lying Backend Playmaker"). Rating reflects activity level honestly but generously.`;

export async function generateCommentary(stats: MatchStats): Promise<Commentary> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    contents: `Here are the player's GitHub stats for the season:\n${JSON.stringify(stats, null, 2)}`,
    config: {
      systemInstruction: SYSTEM,
      temperature: 1.0,
      responseMimeType: "application/json",
      responseJsonSchema: RESPONSE_SCHEMA,
    },
  });
  const text = response.text;
  if (!text) throw new Error("Empty Gemini response");
  return JSON.parse(text) as Commentary;
}
```

- [ ] **Step 2: Write `src/app/api/commentary/route.ts`**

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateCommentary } from "@/lib/gemini";
import type { ApiError, MatchStats } from "@/lib/types";

const Body = z.object({
  login: z.string().min(1),
  name: z.string().nullable(),
  avatarUrl: z.string(),
  accountAgeYears: z.number(),
  followers: z.number(),
  publicRepos: z.number(),
  totalStars: z.number(),
  totalContributions: z.number(),
  totalCommits: z.number(),
  totalPRs: z.number(),
  totalIssues: z.number(),
  longestStreak: z.number(),
  currentStreak: z.number(),
  busiestDay: z.object({ date: z.string(), count: z.number() }),
  topLanguages: z.array(z.object({ name: z.string(), percent: z.number() })),
  nightOwlPercent: z.number(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json<ApiError>(
      { code: "BAD_REQUEST", message: "Invalid stats payload" },
      { status: 400 },
    );
  }
  try {
    const commentary = await generateCommentary(parsed.data as MatchStats);
    return NextResponse.json(commentary);
  } catch {
    return NextResponse.json<ApiError>(
      { code: "COMMENTARY_FAILED", message: "The commentators lost their voice — give it another go" },
      { status: 502 },
    );
  }
}
```

- [ ] **Step 3: Manual verify end-to-end pipeline**

```powershell
$stats = Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/stats -ContentType "application/json" -Body '{"username":"torvalds"}'
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/commentary -ContentType "application/json" -Body ($stats | ConvertTo-Json -Depth 5) | ConvertTo-Json -Depth 5
```
Expected: 6 segments + playerCard JSON referencing real numbers.

- [ ] **Step 4: Commit**

```powershell
git add src/lib/gemini.ts src/app/api/commentary; git commit -m "feat: Gemini commentary generation with structured JSON schema"
```

---

### Task 5: App shell, providers, username form

**Files:**
- Create: `src/app/providers.tsx`, `src/components/username-form.tsx`
- Modify: `src/app/layout.tsx`, `src/app/page.tsx`

**Interfaces:**
- Consumes: shadcn `Button`, `Input`, `Card`; API routes from Tasks 3-4.
- Produces: `<UsernameForm onSubmit={(username: string) => void} disabled?: boolean />`; `page.tsx` holds `useMutation` chaining `/api/stats` → `/api/commentary`, state machine `idle | loading | error | done` exposed to Tasks 6-7 components.

- [ ] **Step 1: `src/app/providers.tsx`**

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { mutations: { retry: 1 } } }));
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster theme="dark" richColors />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Update `src/app/layout.tsx`** — keep scaffold fonts (Geist), set `className="dark"` on `<html>`, wrap `{children}` in `<Providers>`, metadata:

```tsx
export const metadata: Metadata = {
  title: "The Beautiful Code",
  description: "Your GitHub year, commentated like a World Cup final.",
};
```

- [ ] **Step 3: `src/components/username-form.tsx`**

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, Volleyball } from "lucide-react";

const Schema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Enter a GitHub username")
    .max(39, "GitHub usernames are 39 chars max")
    .regex(/^[a-zA-Z0-9-]+$/, "Letters, numbers and dashes only"),
});

type Values = z.infer<typeof Schema>;

export function UsernameForm({ onSubmit, disabled }: { onSubmit: (username: string) => void; disabled?: boolean }) {
  const form = useForm<Values>({ resolver: zodResolver(Schema), defaultValues: { username: "" } });
  return (
    <form
      onSubmit={form.handleSubmit((v) => onSubmit(v.username))}
      className="flex w-full max-w-md flex-col gap-2"
      aria-label="Analyze a GitHub profile"
    >
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Github className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            {...form.register("username")}
            placeholder="github username"
            className="pl-9"
            autoComplete="off"
            aria-invalid={!!form.formState.errors.username}
            disabled={disabled}
          />
        </div>
        <Button type="submit" disabled={disabled}>
          <Volleyball className="size-4" aria-hidden />
          Kick off
        </Button>
      </div>
      {form.formState.errors.username && (
        <p role="alert" className="text-sm text-destructive">
          {form.formState.errors.username.message}
        </p>
      )}
    </form>
  );
}
```
(If `Volleyball` icon absent in installed lucide version, use `CirclePlay`.)

- [ ] **Step 4: `src/app/page.tsx`** — client orchestrator:

```tsx
"use client";

import { useMutation } from "@tanstack/react-query";
import { UsernameForm } from "@/components/username-form";
import { LoadingStadium } from "@/components/loading-stadium";
import { CommentaryFeed } from "@/components/commentary-feed";
import { PlayerCardView } from "@/components/player-card";
import { ErrorState } from "@/components/error-state";
import type { ApiError, Commentary, MatchStats } from "@/lib/types";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw json as ApiError;
  return json as T;
}

export default function Home() {
  const match = useMutation<{ stats: MatchStats; commentary: Commentary }, ApiError, string>({
    mutationFn: async (username) => {
      const stats = await postJson<MatchStats>("/api/stats", { username });
      const commentary = await postJson<Commentary>("/api/commentary", stats);
      return { stats, commentary };
    },
    retry: false,
  });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center gap-8 px-4 py-16">
      <header className="flex flex-col items-center gap-4 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          ⚽ Weekend Challenge · Passion Edition
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">The Beautiful Code</h1>
        <p className="text-lg text-muted-foreground">
          Your GitHub year, commentated like a World Cup final.
        </p>
      </header>

      <UsernameForm onSubmit={(u) => match.mutate(u)} disabled={match.isPending} />

      {match.isPending && <LoadingStadium />}
      {match.isError && <ErrorState error={match.error} onRetry={() => match.reset()} />}
      {match.isSuccess && (
        <>
          <CommentaryFeed segments={match.data.commentary.segments} />
          <PlayerCardView stats={match.data.stats} card={match.data.commentary.playerCard} />
        </>
      )}
    </main>
  );
}
```
Note: Task 5 completes with placeholder-free build only after Tasks 6-7 create the three referenced components — so within this task create minimal versions of `loading-stadium.tsx`, `commentary-feed.tsx`, `player-card.tsx`, `error-state.tsx` that render semantic content without animation (Tasks 6-7 replace internals, same props):

```tsx
// src/components/loading-stadium.tsx (minimal, replaced in Task 6)
"use client";
import { Skeleton } from "@/components/ui/skeleton";
export function LoadingStadium() {
  return (
    <div className="flex w-full flex-col gap-3" role="status" aria-label="Loading match commentary">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}
```
```tsx
// src/components/commentary-feed.tsx (minimal, replaced in Task 6)
"use client";
import type { CommentarySegment } from "@/lib/types";
export function CommentaryFeed({ segments }: { segments: CommentarySegment[] }) {
  return (
    <ol className="flex w-full flex-col gap-4">
      {segments.map((s) => (
        <li key={s.minute + s.title} className="rounded-xl border bg-card p-4">
          <p className="text-sm font-semibold text-primary">{s.minute} — {s.title}</p>
          <p className="mt-1 text-foreground">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}
```
```tsx
// src/components/player-card.tsx (minimal, replaced in Task 7)
"use client";
import type { MatchStats, PlayerCard } from "@/lib/types";
export function PlayerCardView({ stats, card }: { stats: MatchStats; card: PlayerCard }) {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <p className="text-2xl font-bold">{card.rating}</p>
      <p>{stats.name ?? stats.login} — {card.position}</p>
    </div>
  );
}
```
```tsx
// src/components/error-state.tsx (final version, kept)
"use client";
import { Button } from "@/components/ui/button";
import { CircleAlert } from "lucide-react";
import type { ApiError } from "@/lib/types";

export function ErrorState({ error, onRetry }: { error: ApiError; onRetry: () => void }) {
  return (
    <div className="flex w-full flex-col items-center gap-4 rounded-xl border border-destructive/40 bg-card p-8 text-center" role="alert">
      <CircleAlert className="size-8 text-destructive" aria-hidden />
      <div>
        <p className="font-semibold">{error.message ?? "Something went sideways"}</p>
        <p className="text-sm text-muted-foreground">
          {error.code === "RATE_LIMITED" ? "The stadium is packed — wait a minute and retry." : "Check the username and try again."}
        </p>
      </div>
      <Button variant="outline" onClick={onRetry}>Retry</Button>
    </div>
  );
}
```

- [ ] **Step 5: Verify in browser** — full happy path with a real username; error path with junk username. `npm run build` passes.

- [ ] **Step 6: Commit**

```powershell
git add src/app src/components; git commit -m "feat: app shell, username form, end-to-end match flow"
```

---

### Task 6: Animated commentary feed + stadium loading

**Files:**
- Modify: `src/components/commentary-feed.tsx`, `src/components/loading-stadium.tsx`

**Interfaces:**
- Consumes/keeps: same props as Task 5 minimal versions (`{ segments }`, none).

- [ ] **Step 1: Replace `commentary-feed.tsx`** — staggered ticker with `motion`:

```tsx
"use client";

import { motion, useReducedMotion } from "motion/react";
import type { CommentarySegment } from "@/lib/types";

export function CommentaryFeed({ segments }: { segments: CommentarySegment[] }) {
  const reduce = useReducedMotion();
  return (
    <ol className="relative flex w-full flex-col gap-4 border-l-2 border-primary/30 pl-6" aria-label="Match commentary">
      {segments.map((s, i) => (
        <motion.li
          key={s.minute + s.title}
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: reduce ? 0 : i * 0.9 }}
          className="relative rounded-xl border bg-card p-5 shadow-sm"
        >
          <span className="absolute -left-[31px] top-6 size-3 rounded-full bg-primary" aria-hidden />
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-sm font-bold text-primary">{s.minute}</span>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{s.title}</h3>
          </div>
          <p className="mt-2 leading-relaxed">{s.text}</p>
        </motion.li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 2: Replace `loading-stadium.tsx`** — skeletons + rotating status lines:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const LINES = [
  "Commentators warming up…",
  "Checking VAR…",
  "Reading the team sheet…",
  "Crowd finding their seats…",
  "Polishing the match ball…",
];

export function LoadingStadium() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % LINES.length), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex w-full flex-col items-center gap-4" role="status" aria-live="polite">
      <p className="text-sm text-muted-foreground">{LINES[i]}</p>
      <div className="flex w-full flex-col gap-3">
        {Array.from({ length: 4 }).map((_, n) => (
          <Skeleton key={n} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify in browser** — segments cascade in ~1s apart; with OS reduced-motion enabled, no animation. Loading lines rotate.

- [ ] **Step 4: Commit**

```powershell
git add src/components; git commit -m "feat: animated match ticker and stadium loading state"
```

---

### Task 7: Player card + PNG download + share

**Files:**
- Modify: `src/components/player-card.tsx`

**Interfaces:**
- Keeps props: `{ stats: MatchStats; card: PlayerCard }`.

- [ ] **Step 1: Replace `player-card.tsx`**

```tsx
"use client";

import { useRef } from "react";
import { toPng } from "html-to-image";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Share2 } from "lucide-react";
import type { MatchStats, PlayerCard } from "@/lib/types";

export function PlayerCardView({ stats, card }: { stats: MatchStats; card: PlayerCard }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  async function download() {
    if (!ref.current) return;
    try {
      const url = await toPng(ref.current, { pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = url;
      a.download = `${stats.login}-player-card.png`;
      a.click();
      toast.success("Player card saved — share it with the squad!");
    } catch {
      toast.error("Couldn't export the card. Try again.");
    }
  }

  async function share() {
    const text = `⚽ ${stats.name ?? stats.login} rated ${card.rating} as "${card.position}" on The Beautiful Code — your GitHub year, commentated like a World Cup final.`;
    try {
      await navigator.clipboard.writeText(`${text} ${window.location.origin}`);
      toast.success("Copied — paste it anywhere!");
    } catch {
      toast.error("Clipboard unavailable.");
    }
  }

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, rotateY: 90 }}
      animate={{ opacity: 1, rotateY: 0 }}
      transition={{ duration: 0.5, delay: reduce ? 0 : 5.6 }}
      className="flex w-full max-w-sm flex-col gap-4"
      aria-label="Player card"
    >
      <div
        ref={ref}
        className="rounded-2xl border bg-gradient-to-br from-primary/20 via-card to-card p-6 shadow-lg"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-5xl font-bold">{card.rating}</p>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{card.position}</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- html-to-image needs a plain img */}
          <img src={stats.avatarUrl} alt="" className="size-16 rounded-full border-2 border-primary" crossOrigin="anonymous" />
        </div>
        <h3 className="mt-4 text-xl font-semibold">{stats.name ?? stats.login}</h3>
        <p className="text-sm text-muted-foreground">@{stats.login} · {stats.accountAgeYears} seasons</p>
        <Separator className="my-4" />
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div><dt className="text-muted-foreground">Commits</dt><dd className="font-semibold">{stats.totalCommits}</dd></div>
          <div><dt className="text-muted-foreground">Longest streak</dt><dd className="font-semibold">{stats.longestStreak} days</dd></div>
          <div><dt className="text-muted-foreground">Stars</dt><dd className="font-semibold">{stats.totalStars}</dd></div>
          <div><dt className="text-muted-foreground">Night owl</dt><dd className="font-semibold">{stats.nightOwlPercent}%</dd></div>
        </dl>
        <Separator className="my-4" />
        <p className="text-sm"><span className="text-muted-foreground">Style:</span> {card.playingStyle}</p>
        <p className="text-sm"><span className="text-muted-foreground">Signature move:</span> {card.signatureMove}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {card.topSkills.map((s) => (
            <Badge key={s} variant="secondary">{s}</Badge>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={download} className="flex-1">
          <Download className="size-4" aria-hidden /> Download card
        </Button>
        <Button onClick={share} variant="outline" className="flex-1">
          <Share2 className="size-4" aria-hidden /> Share
        </Button>
      </div>
    </motion.section>
  );
}
```

- [ ] **Step 2: Verify** — card flips in after commentary; Download produces a correct PNG (avatar included — if avatar taints canvas, set `crossOrigin="anonymous"`, already done; if still failing, fall back to omitting avatar in export via `filter` option); Share copies text; toasts fire.

- [ ] **Step 3: Commit**

```powershell
git add src/components/player-card.tsx; git commit -m "feat: player card with PNG export and share"
```

---

### Task 8: Polish, README, production build

**Files:**
- Create: `README.md`
- Modify: anything failing checks

- [ ] **Step 1: Responsive + a11y sweep** — verify at 375px, 768px, 1440px: no horizontal scroll, form usable, card fits. Keyboard-only run-through: tab to input → type → Enter → results reachable. Fix regressions found.

- [ ] **Step 2: `README.md`**

```markdown
# ⚽ The Beautiful Code

> Your GitHub year, commentated like a World Cup final.

Enter a GitHub username. Gemini narrates the coding year as passionate
World Cup-style live commentary — kickoff to final whistle — then issues
a downloadable dev player card.

Built for the DEV Weekend Challenge: Passion Edition (July 2026).

## Stack

Next.js 16 · React 19 · Tailwind CSS 4 · shadcn/ui · Motion ·
TanStack Query · React Hook Form + Zod · Google Gemini (`@google/genai`)

## Run locally

1. `npm install`
2. Copy `.env.example` → `.env.local`, add a GitHub token (public_repo read)
   and a Gemini API key (https://aistudio.google.com).
3. `npm run dev`

## How it works

- `/api/stats` — GitHub GraphQL: contribution calendar, streaks, languages,
  stars; REST events for the night-owl ratio.
- `/api/commentary` — Gemini with a strict `responseJsonSchema`: six match
  segments + a player card. The model only dramatizes real numbers.
```

- [ ] **Step 3: Full verification**

```powershell
npx vitest run
npm run lint
npm run build
```
Expected: all pass, zero errors.

- [ ] **Step 4: Commit**

```powershell
git add -A; git commit -m "docs: README and final polish"
```

---

### Task 9 (manual, with user): Deploy + submission

Not agent-executable alone — needs user accounts.

- [ ] Push repo to user's GitHub (public).
- [ ] Deploy on Vercel; set `GITHUB_TOKEN`, `GEMINI_API_KEY`, `GEMINI_MODEL` env vars.
- [ ] Smoke-test production URL with 3 usernames (heavy, sparse, new account).
- [ ] Draft DEV post using official challenge template (What I Built / Demo / Code / How I Built It / Prize Categories — Google AI), tag `#weekendchallenge`, include GIF demo.
- [ ] Submit before **July 13, 6:59 AM UTC**.
