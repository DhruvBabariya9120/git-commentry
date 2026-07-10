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
