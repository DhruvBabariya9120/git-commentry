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
