# ⚽ The Beautiful Code

> Your GitHub year, commentated like a World Cup final.

Enter a GitHub username. Gemini narrates the coding year as passionate
World Cup-style live commentary — kickoff to final whistle — then issues
a downloadable dev player card.

Built for the DEV Weekend Challenge: Passion Edition (July 2026).

## Stack

Next.js 16 · React 19 · Tailwind CSS 4 · shadcn/ui · Motion ·
TanStack Query · React Hook Form + Zod · Google Gemini (`@google/genai`)

## Run locally

1. `npm install`
2. Copy `.env.example` → `.env.local`, add a GitHub token (public repo read)
   and a Gemini API key (https://aistudio.google.com).
3. `npm run dev`

## How it works

- `/api/stats` — GitHub GraphQL: contribution calendar, streaks, languages,
  stars; REST events for the night-owl ratio.
- `/api/commentary` — Gemini with a strict `responseJsonSchema`: six match
  segments + a player card. The model only dramatizes real numbers.
