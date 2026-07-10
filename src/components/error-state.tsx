"use client";

import { Button } from "@/components/ui/button";
import { CircleAlert } from "lucide-react";
import type { ApiError } from "@/lib/types";

export function ErrorState({ error, onRetry }: { error: ApiError; onRetry: () => void }) {
  return (
    <div
      className="flex w-full flex-col items-center gap-4 rounded-xl border border-destructive/40 bg-card p-8 text-center"
      role="alert"
    >
      <CircleAlert className="size-8 text-destructive" aria-hidden />
      <div>
        <p className="font-semibold">{error.message ?? "Something went sideways"}</p>
        <p className="text-sm text-muted-foreground">
          {error.code === "RATE_LIMITED"
            ? "The stadium is packed — wait a minute and retry."
            : "Check the username and try again."}
        </p>
      </div>
      <Button variant="outline" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
