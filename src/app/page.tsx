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
