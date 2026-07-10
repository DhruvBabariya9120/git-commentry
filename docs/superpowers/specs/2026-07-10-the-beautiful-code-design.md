# The Beautiful Code — Design Spec

**Date:** 2026-07-10
**Target:** DEV Weekend Challenge: Passion Edition (deadline July 13, 2026, 6:59 AM UTC)
**Prize tracks:** Main prize + Google AI (Gemini) category

## One-liner

Enter a GitHub username and get your coding year narrated as passionate FIFA World Cup-style live commentary, ending with a shareable "dev player card".

## Why this idea

- Theme fit: fuses two authentic passions — coding and football — during the actual 2026 World Cup.
- Originality: no existing tool narrates GitHub activity as sports commentary.
- Engagement loop: every reader can try their own username, driving reactions/comments on the DEV post.
- Google AI category: Gemini *is* the commentator — the integration is the product, not a bolt-on.

## Architecture

- **Framework:** Next.js (App Router), TypeScript, deployed on Vercel.
- **UI:** Tailwind CSS + shadcn/ui components, lucide-react icons, Framer Motion animations, dark mode by default.
- **State/data:** TanStack Query on the client for the two API calls. No database, no auth — fully stateless.
- **Secrets:** `GITHUB_TOKEN` (server-side GraphQL, 5000 req/hr) and `GEMINI_API_KEY` in Vercel env vars. Never exposed to the client.

### API routes

1. **`POST /api/stats`** — input `{ username }`.
   - Calls GitHub GraphQL API server-side.
   - Returns computed match stats: total commits (last 12 months), contribution calendar highlights, longest streak, busiest day, top languages with percentages, total stars, repo count, night-owl ratio (commits 10pm–4am), account age.
   - Errors: 404 → `USER_NOT_FOUND`; GitHub rate limit → `RATE_LIMITED`.

2. **`POST /api/commentary`** — input: the stats object.
   - Calls Gemini Flash with structured JSON output (response schema enforced).
   - Returns:
     - `segments[]`: six commentary segments — Kickoff, First Half, Halftime Pundit Analysis, Second Half, Extra Time, Final Whistle — each with `minute`, `title`, `text` (dramatic football commentary referencing real stats).
     - `playerCard`: `{ name, position, rating (0–100), playingStyle, signatureMove, topSkills[] }` — position is a football/dev hybrid (e.g. "Box-to-Box Fullstack").
   - Errors: Gemini failure → `COMMENTARY_FAILED` with retry guidance.

## User flow

1. Landing page: stadium-themed hero, single username input, CTA.
2. Loading: skeleton stadium + rotating status lines ("Commentators warming up…", "Checking VAR…"). Never a blank screen.
3. Commentary feed: segments reveal one-by-one (staggered Framer Motion entrance) styled like a live match ticker with minute markers.
4. Player card: animated flip-in at the end. Buttons: **Download PNG** (html-to-image) and **Share** (copy link / X intent with pre-filled text).
5. "Run it back" button to try another username.

## Error / empty / success states

- Empty input: inline validation (React Hook Form + Zod), disabled CTA.
- `USER_NOT_FOUND`: "Player not found in the squad list" + retry.
- `RATE_LIMITED` / `COMMENTARY_FAILED`: human-readable message + Retry button (TanStack Query retry).
- Success: Sonner toast on card download/copy.

## Accessibility & responsiveness

- Mobile-first; works sm→2xl. Semantic HTML, keyboard-operable input/buttons, focus states, `prefers-reduced-motion` respected (skip stagger animations).

## Out of scope (YAGNI)

No auth, no database, no history, no user accounts, no voting, no i18n. Stretch goal only if all else done: team-color theme picker.

## Testing

- Unit tests for stat computation (streaks, night-owl ratio) — the only nontrivial pure logic.
- Manual end-to-end verification with 3+ real usernames (heavy, sparse, and brand-new accounts) before submission.

## Delivery plan

- **Jul 10:** scaffold, GitHub pipeline, Gemini prompt, end-to-end happy path.
- **Jul 11:** stadium UI, animations, player card, share/download, error states.
- **Jul 12:** deploy to Vercel, polish, DEV submission post (template sections: What I Built / Demo / Code / How I Built It / Prize Categories) with GIF demo, submit. Full-day buffer before deadline.

## Submission requirements checklist

- [ ] Public GitHub repo
- [ ] Live Vercel URL
- [ ] DEV post with `#weekendchallenge` tag using official template
- [ ] Google AI prize category section explaining Gemini's role
