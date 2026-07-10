"use client";

import type { MatchStats, PlayerCard } from "@/lib/types";

export function PlayerCardView({ stats, card }: { stats: MatchStats; card: PlayerCard }) {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <p className="text-2xl font-bold">{card.rating}</p>
      <p>
        {stats.name ?? stats.login} — {card.position}
      </p>
    </div>
  );
}
