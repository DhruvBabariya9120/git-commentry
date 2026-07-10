"use client";

import { motion, useReducedMotion } from "motion/react";
import type { CommentarySegment } from "@/lib/types";

export function CommentaryFeed({ segments }: { segments: CommentarySegment[] }) {
  const reduce = useReducedMotion();
  return (
    <ol
      className="relative flex w-full flex-col gap-4 border-l-2 border-primary/30 pl-6"
      aria-label="Match commentary"
    >
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
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {s.title}
            </h3>
          </div>
          <p className="mt-2 leading-relaxed">{s.text}</p>
        </motion.li>
      ))}
    </ol>
  );
}
