# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PerfConnect — a Next.js 14 (App Router) mobile-first web app in French for finding sports activity partners. Users authenticate with Strava, browse/create activities ("sorties"), request to join, and message other participants. Backend is Supabase (Postgres).

## Commands

```bash
npm run dev     # start dev server (localhost:3000)
npm run build   # production build
npm run start   # run production build
npm run lint    # next lint (eslint-config-next core-web-vitals)
```

There is no test suite configured in this repo (no test script, no test runner installed).

## Environment setup

Copy `exampleOfenv.txt` to `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_SECRET`, `AUTH_URL` (NextAuth)
- `AUTH_STRAVA_ID`, `AUTH_STRAVA_SECRET` (Strava OAuth app)

`lib/supabase.ts` throws at import time if the public Supabase env vars are missing, and `lib/supabase-admin.ts` throws when `createAdminClient()` is called without the service role key.

## Architecture

**Auth**: NextAuth v5 (beta) configured in [auth.ts](auth.ts) with a single Strava OAuth provider. The Strava athlete ID (`account.providerAccountId`) is used directly as the user's primary key — there is no separate internal user ID. On sign-in, the `signIn` callback upserts a row into Supabase `profiles` keyed by that Strava ID. The `authorized` callback in the same file is Next.js middleware's route gate: `/`, `/login`, `/api/auth/*`, and `/activities/[uuid]` are public; everything else requires a session. [middleware.ts](middleware.ts) just re-exports `auth` from `auth.ts` and matches all non-static/non-API routes.

**Data access layers** (all server-only, use `createAdminClient()` from [lib/supabase-admin.ts](lib/supabase-admin.ts) which uses the service-role key and bypasses RLS):
- [lib/session.ts](lib/session.ts) — `getCurrentUser()` / `requireAuth()`: resolves the NextAuth session into an `AppUser` by reading the matching `profiles` row.
- [lib/users.ts](lib/users.ts), [lib/activities.ts](lib/activities.ts) — read helpers for profiles/activities.
- [app/actions.ts](app/actions.ts) — the bulk of the app's business logic lives here as Next.js Server Actions (`'use server'`): creating activities, requesting/approving/rejecting participation, sending/reading messages, building conversation previews. Every action re-checks `getCurrentUser()`/`requireAuth()` itself (no shared middleware-level auth for actions) and returns a `{ success, data? , error? }` shape rather than throwing.

**Database** ([supabase/migrations/001_profiles_and_auth.sql](supabase/migrations/001_profiles_and_auth.sql)): tables `profiles`, `activities`, `participations`, `messages`. `profiles.id` is text (the Strava athlete ID) and is the FK target for `organizer_id`/`user_id`/`sender_id`/`receiver_id`. RLS is enabled on all tables; `profiles`/`activities`/`participations` have public SELECT policies, `messages` has none (readable/writable only via the service-role client, i.e. only through server actions — never query `messages` from the client with the anon key). Run migrations manually in the Supabase SQL editor; there is no CLI-driven migration workflow in this repo.

**Routing** ([app/](app/)): `/` (activity feed), `/activities`, `/activities/[id]`, `/create`, `/messages`, `/messages/[id]`, `/profile`, `/login`. [app/layout.tsx](app/layout.tsx) renders a fixed mobile-width shell (top bar + bottom tab nav) around every page and calls `getCurrentUser()` server-side; it has `export const dynamic = 'force-dynamic'` so the whole app is rendered per-request (no static caching of the shell).

**Path alias**: `@/*` maps to the repo root (see [tsconfig.json](tsconfig.json)), e.g. `@/lib/session`, `@/auth`.

**Dead/stub components**: [components/UserSwitcher.tsx](components/UserSwitcher.tsx), [components/UserSwitcherWrapper.tsx](components/UserSwitcherWrapper.tsx), [context/UserContext.tsx](context/UserContext.tsx), and [app/client-layout.tsx](app/client-layout.tsx) are no-op stubs (return `null` or are empty) — leftovers from a mock multi-user switcher that predates real Strava auth. `UserSwitcher` is still imported and rendered in `app/layout.tsx` but renders nothing; the real sign-in/sign-out UI is [components/AuthButton.tsx](components/AuthButton.tsx), which is not currently wired into the layout. Don't build on top of these stubs without checking whether they're meant to be restored or removed.

**UI components**: [components/ui/](components/ui/) holds small shadcn-style primitives (button, card, input, label, textarea) built on `class-variance-authority` + `tailwind-merge` via the `cn()` helper in [lib/utils.ts](lib/utils.ts). Feature components (`ActivityCard`, `ActivityDetailClient`, `ChatClient`, `PropositionForm`) live directly under `components/`.

**Language**: UI copy, code comments, and error messages throughout the codebase are in French; keep new user-facing strings consistent with that.
