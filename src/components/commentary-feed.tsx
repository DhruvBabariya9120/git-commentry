"use client";

import type { CommentarySegment } from "@/lib/types";

export function CommentaryFeed({ segments }: { segments: CommentarySegment[] }) {
  return (
    <ol className="flex w-full flex-col gap-4">
      {segments.map((s) => (
        <li key={s.minute + s.title} className="rounded-xl border bg-card p-4">
          <p className="text-sm font-semibold text-primary">
            {s.minute} — {s.title}
          </p>
          <p className="mt-1 text-foreground">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}
