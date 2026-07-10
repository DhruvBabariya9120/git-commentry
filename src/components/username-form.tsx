"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AtSign, Volleyball } from "lucide-react";

const Schema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Enter a GitHub username")
    .max(39, "GitHub usernames are 39 chars max")
    .regex(/^[a-zA-Z0-9-]+$/, "Letters, numbers and dashes only"),
});

type Values = z.infer<typeof Schema>;

export function UsernameForm({
  onSubmit,
  disabled,
}: {
  onSubmit: (username: string) => void;
  disabled?: boolean;
}) {
  const form = useForm<Values>({ resolver: zodResolver(Schema), defaultValues: { username: "" } });
  return (
    <form
      onSubmit={form.handleSubmit((v) => onSubmit(v.username))}
      className="flex w-full max-w-md flex-col gap-2"
      aria-label="Analyze a GitHub profile"
    >
      <div className="flex gap-2">
        <div className="relative flex-1">
          <AtSign
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            {...form.register("username")}
            placeholder="github username"
            className="pl-9"
            autoComplete="off"
            aria-invalid={!!form.formState.errors.username}
            disabled={disabled}
          />
        </div>
        <Button type="submit" disabled={disabled}>
          <Volleyball className="size-4" aria-hidden />
          Kick off
        </Button>
      </div>
      {form.formState.errors.username && (
        <p role="alert" className="text-sm text-destructive">
          {form.formState.errors.username.message}
        </p>
      )}
    </form>
  );
}
