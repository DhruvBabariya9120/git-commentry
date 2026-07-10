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
