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
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {card.position}
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- html-to-image needs a plain img */}
          <img
            src={stats.avatarUrl}
            alt=""
            className="size-16 rounded-full border-2 border-primary"
            crossOrigin="anonymous"
          />
        </div>
        <h3 className="mt-4 text-xl font-semibold">{stats.name ?? stats.login}</h3>
        <p className="text-sm text-muted-foreground">
          @{stats.login} · {stats.accountAgeYears} seasons
        </p>
        <Separator className="my-4" />
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Commits</dt>
            <dd className="font-semibold">{stats.totalCommits}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Longest streak</dt>
            <dd className="font-semibold">{stats.longestStreak} days</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Stars</dt>
            <dd className="font-semibold">{stats.totalStars}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Night owl</dt>
            <dd className="font-semibold">{stats.nightOwlPercent}%</dd>
          </div>
        </dl>
        <Separator className="my-4" />
        <p className="text-sm">
          <span className="text-muted-foreground">Style:</span> {card.playingStyle}
        </p>
        <p className="text-sm">
          <span className="text-muted-foreground">Signature move:</span> {card.signatureMove}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {card.topSkills.map((s) => (
            <Badge key={s} variant="secondary">
              {s}
            </Badge>
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
