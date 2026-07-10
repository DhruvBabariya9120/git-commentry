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
