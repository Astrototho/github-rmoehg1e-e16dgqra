# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PerfConnect — a Next.js 14 (App Router) mobile-first web app in French for finding sports activity partners. Users authenticate with Strava, browse/create activities ("sorties"), request to join, and message other participants. Backend is Supabase (Postgres).

### Product vision

SaaS that lets athletes propose sports outings (**trail** or **road cycling**) and **match** them with other users based on their sports performance (data pulled from Strava). Hosted on Vercel (production: https://rmoehg1e-e16dgqra.vercel.app/), database on the Supabase project "PerfConnect" (ref `cbvetcddlbibkvzqzbup`, eu-west-1).

Target user flow (zero friction):
1. **Onboarding** — one-click Strava sign-in, nothing else: no email/password, no profile to fill in. The user's performance profile is computed in the background right after sign-in.
2. **Proposing an outing** — "Proposer une sortie" button → simple form: sport (trail/vélo), date/time, place (autocomplete via Mapbox/Google), stats (km / D+). Submit, done.
3. **Browsing** — the home feed is a social-network-style list of blocks. Each block shows: place, km and D+ (with a map image of the route as background), meeting date, sport, proposer's profile photo, and a **match percentage** between the proposer and the viewer. The match % is the killer feature and must be visible at first glance. Tapping a block opens the detail view (map, proposer's profile). (Age is no longer shown — see product decisions.)
4. **Conversion** — "Participer" / "Matcher" button → the proposer gets a notification and accepts or refuses the participant.

Stack: Next.js (React + TypeScript) front, Next.js Server Actions back, Auth.js (NextAuth) + Strava API, Supabase (PostgreSQL), Vercel hosting. The matching engine lives in `lib/matching.ts` (see below); see the matching roadmap section for where it is heading.

### Product decisions (answered by the owner)

- **Launch area**: Grenoble. **Business model**: free for now (growth first).
- **Participants**: no cap per outing; the organizer manually accepts/refuses each participant.
- **Feed**: filtered/sorted by **match percentage**; past outings (`start_date` in the past) must disappear from the feed.
- **Block content**: the proposer's **age is removed** from the outing block (do not add a birth date to `profiles`).
- **Map**: the block's background image shows the **starting point** of the outing (not the full route). Provider: the easiest and free option. Geocoding/autocomplete already uses Photon (OpenStreetMap, no key) in `PlaceAutocomplete`/`CityPicker`, so prefer an OSM-based solution (no paid Mapbox/Google) unless a keyless/free static image proves impractical.
- **Notifications**: in-app now (`notifications` table). Push notifications later, once the site becomes a real mobile app.
- **Compute engine**: stays inside the Next.js app (simple, no separate service).
- **Priorities (in order)**: 1) app stability, 2) decent UI (map, notifications), 3) turn the website into a real Android/iPhone app (PWA or native wrapper — approach still to be chosen).

### Security TODO (later)

`strava_tokens.access_token` / `refresh_token` are stored in **clear text**. Encrypt them at rest later (e.g. app-level AES-GCM with a key in an env var, or Supabase Vault). Not done on purpose for now — do not forget it before opening to the public.

### Matching roadmap: from hand-made formula to learned model

Current state: hand-weighted formula (`lib/matching.ts`, 4 indices, equal weights). Target vision: **do not run an AI for every match**. Instead, analyze the app's results (accepted/refused participations, `match_feedback.accurate`, whether the outing actually happened) and use an offline model trained on this data to **learn the parameters/weights** of the matching function; the app then simply loads those learned parameters and computes the % with a cheap formula. Therefore:
- keep matching parameters isolated/configurable (like `WEIGHTS`), ideally versioned, so learned values can be dropped in;
- log enough outcome data (feedback, accept/refuse) to build a training set;
- avoid heavy per-request computation.

Candidate Strava signals for richer features (not all implemented — today only speed, moving time, elevation gain and chill index are used):
- **Athlete profile** (`/athlete`): sex, weight, athlete_type, ftp, bikes/shoes (road vs gravel vs trail), city/country, follower/friend counts, clubs.
- **Aggregated stats** (`/athletes/{id}/stats`): recent (4 weeks) / YTD / all-time totals — current level vs historical level, similar progression.
- **Activities** (`/athlete/activities`, the richest source): sport_type, workout_type, average/max speed, heart rate, watts, suffer_score, distance, moving_time, elevation gain/high/low, local start time (habitual time slot, weekday, seasonality), commute/trainer, device, kudos/comments, athlete_count (group rides), start/end lat-lng and polyline (usual zones, territory overlap).
- **Zones** (`/athlete/zones`): heart-rate/power zones and time per zone — objective physiological level.
- **Segments**: shared segments (same territory), kom/pr rank, starred segments, climb category.
- **Clubs**, **Routes** (ambitions: 100 km vs 10 km habits), **Streams** (HR/power/cadence/altitude/grade time series, for the most engaged users).
Check Strava API scopes and rate limits before depending on any of these.

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

**Matching & performance** (server-only):
- [lib/strava.ts](lib/strava.ts) — Strava API calls (`fetchStravaActivities`, `refreshStravaAccessToken`).
- [lib/performance.ts](lib/performance.ts) — maps Strava sport types to families, computes per-family indices (avg speed, moving time, elevation gain, "chill index") and stores them in `performance_profiles` (`refreshPerformanceProfile`, `getPerformanceProfilesForUsers`, `hasActivityScopeConnected`).
- [lib/matching.ts](lib/matching.ts) — `computeMatchPercentage(viewer, organizer, viewerGeo, organizerGeo)`: weighted closeness of the 4 indices (equal weights 0.25 each, isolated in `WEIGHTS`) plus a geo **bonus only** (+5 same city, +2 same country, never a penalty). Returns `null` when either side has no performance profile for the sport.
- [lib/notifications.ts](lib/notifications.ts), [lib/messages.ts](lib/messages.ts) — notification creation/reading and unread counters.

**Database** (migrations in [supabase/migrations/](supabase/migrations/), `001`–`008`): `profiles.id` is text (the Strava athlete ID) and is the FK target for every user reference. RLS is enabled on **all** tables. Verified against the live Supabase project (schema `public`):

| Table | Purpose / key columns |
|---|---|
| `profiles` | PK `id` (Strava ID), `name`, `avatar_url`, `email`, `bio`, `strava_username`, `city`, `country`, `latitude`, `longitude` |
| `activities` | the outings: `title`, `type`, `start_date`, `location`, `distance`, `elevation`, `description`, `organizer_id` (FK profiles) + denormalized `organizer_name`/`organizer_avatar`, `latitude`, `longitude` |
| `participations` | `activity_id`, `user_id`, `status` (`pending`/`approved`/`rejected`, default `pending`) |
| `messages` | `sender_id`, `receiver_id`, denormalized `sender_name`/`sender_avatar`, `content`, `is_read` |
| `notifications` | `user_id`, `type` (`message`/`participation_request`/`participation_approved`/`participation_rejected`), `title`, `body`, `link`, `is_read`, `related_id` |
| `strava_tokens` | PK `user_id`, `access_token`, `refresh_token`, `expires_at`, `scope` — **sensitive**, service-role only |
| `performance_profiles` | PK (`user_id`, `sport_family`), `avg_speed_mps`, `avg_moving_time_s`, `avg_elevation_gain_m`, `avg_chill_index`, `sample_size`, `computed_at`. `sport_family` ∈ trail, course-a-pied, velo-route, velo, vtt |
| `match_feedback` | per-activity feedback on match quality: `activity_id`, `rater_id`, `rated_id`, `accurate` (bool) — service-role only |
| `user_reports` | moderation reports: `activity_id`, `reporter_id`, `reported_id`, `reason`, `description` — strictly confidential, service-role only |

Access policy: `profiles`/`activities`/`participations` have public SELECT policies; `messages`, `notifications`, `strava_tokens`, `performance_profiles`, `match_feedback` and `user_reports` have no policy (service-role client only, i.e. only through server code — never query them from the client with the anon key). Run migrations manually in the Supabase SQL editor (or via the Supabase MCP in Claude Code, after showing the SQL to the owner); there is no CLI-driven migration workflow in this repo. Always add a new numbered migration file in `supabase/migrations/` for any schema change so the repo stays the source of truth.

**Routing** ([app/](app/)): `/` (activity feed), `/activities`, `/activities/[id]`, `/create`, `/messages`, `/messages/[id]`, `/notifications`, `/profile`, `/settings`, `/legal`, `/login`; API routes `/api/auth/[...nextauth]` and `/api/set-user`. [app/layout.tsx](app/layout.tsx) renders a fixed mobile-width shell (top bar + bottom tab nav) around every page and calls `getCurrentUser()` server-side; it has `export const dynamic = 'force-dynamic'` so the whole app is rendered per-request (no static caching of the shell).

**Path alias**: `@/*` maps to the repo root (see [tsconfig.json](tsconfig.json)), e.g. `@/lib/session`, `@/auth`.

**Dead/stub components**: [components/UserSwitcher.tsx](components/UserSwitcher.tsx), [components/UserSwitcherWrapper.tsx](components/UserSwitcherWrapper.tsx), [context/UserContext.tsx](context/UserContext.tsx), and [app/client-layout.tsx](app/client-layout.tsx) are no-op stubs (return `null` or are empty) — leftovers from a mock multi-user switcher that predates real Strava auth. `UserSwitcher` is still imported and rendered in `app/layout.tsx` but renders nothing; the real sign-in/sign-out UI is [components/AuthButton.tsx](components/AuthButton.tsx), which is not currently wired into the layout. Don't build on top of these stubs without checking whether they're meant to be restored or removed.

**UI components**: [components/ui/](components/ui/) holds small shadcn-style primitives (button, card, input, label, textarea) built on `class-variance-authority` + `tailwind-merge` via the `cn()` helper in [lib/utils.ts](lib/utils.ts). Feature components (`ActivityCard`, `ActivityDetailClient`, `ChatClient`, `PropositionForm`, `PlaceAutocomplete`, `CityPicker`, `MatchFeedbackPrompt`, `ReportUserButton`, `MessagesList`, `ProfileTabs`, …) live directly under `components/`.

**Language**: UI copy, code comments, and error messages throughout the codebase are in French; keep new user-facing strings consistent with that.
