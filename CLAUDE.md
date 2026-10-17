# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PerfConnect — a Next.js 15 (App Router, React 19) mobile-first web app in French for finding sports activity partners. Users authenticate with Strava, browse/create activities ("sorties"), request to join, and message other participants. Backend is Supabase (Postgres).

### Product vision

SaaS that lets athletes propose sports outings (**trail**, **running**, **road cycling** or **MTB**) and **match** them with other users based on their sports performance (data pulled from Strava). Hosted on Vercel (production: https://app.perfconnect.fr — the old https://rmoehg1e-e16dgqra.vercel.app 308-redirects there; the marketing site https://perfconnect.fr is a separate site hosted at o2switch, whose DNS zone also holds the `app` CNAME to Vercel), database on the Supabase project "PerfConnect" (ref `cbvetcddlbibkvzqzbup`, eu-west-1).

Target user flow (zero friction):
1. **Onboarding** — one-click Strava sign-in, nothing else: no email/password, no profile to fill in. The user's performance profile is computed in the background right after sign-in (`after()`), then refreshed at most once a day.
2. **Proposing an outing** — "Proposer une sortie" button → simple form: sport, date/time, start place = a free-text name ("Fontaine au Lion") + a precise GPS point placed on a map, stats (km / D+), optional title (auto-generated when empty). Submit, done. Each organizer's start places are saved: retyping a known name (case/accents/spaces/punctuation ignored) fills the GPS point automatically.
3. **Browsing** — first-time anonymous visitors land on the full-screen welcome/login screen (`/login`, "Voir les sorties d'abord" sets the `pc_apercu` cookie and opens the public feed without %). The home feed is a social-network-style list of blocks, filterable by sport, date and max distance from the viewer (URL params `sport`, `quand`, `rayon`; reference point = `pc_pos` GPS cookie, else the profile city). Each block shows: place, km and D+ (with a map image of the route as background), meeting date, sport, proposer's profile photo, and a **match percentage** between the proposer and the viewer. The match % is the killer feature and must be visible at first glance. Tapping a block opens the detail view (map, proposer's profile). (Age is no longer shown — see product decisions.)
4. **Conversion** — "Participer" / "Matcher" button → the proposer gets a notification and accepts or refuses the participant.

Stack: Next.js (React + TypeScript) front, Next.js Server Actions back, Auth.js (NextAuth) + Strava API, Supabase (PostgreSQL), Vercel hosting. The matching engine lives in `lib/matching.ts` (see below); see the matching roadmap section for where it is heading.

### Product decisions (answered by the owner)

- **Launch area**: Grenoble. **Business model**: free for now (growth first).
- **Participants**: no cap per outing; the organizer manually accepts/refuses each participant.
- **Sports**: exactly 4 — `trail`, `course-a-pied`, `velo-route`, `vtt` (the generic `velo` was removed; Strava `Ride` maps to `velo-route`).
- **Feed**: sorted by **match percentage** (desc), then date; outings without a % go last; anonymous visitors see date order. Past and cancelled outings never appear in the feed.
- **Editing / cancelling**: the organizer can edit everything or cancel an outing until **1 h before** its start (enforced server-side, also in the SQL `WHERE`); a new date must itself be ≥ 1 h in the future. Cancelling is a soft delete (`activities.status = 'cancelled'`, kept for stats/ML). Approved and pending participants get an in-app notification on edit and on cancel; approvals stay valid after an edit.
- **Saved start places** (`saved_places`): private to each organizer, manageable (rename/delete) in Paramètres.
- **Timezone**: every date is entered and displayed in **Europe/Paris** (`lib/dates.ts`) — never rely on the server (UTC on Vercel) or browser timezone.
- **Block design**: immersive card (`components/ActivityCard.tsx`): start-point map, organizer avatar inside a **match ring** with the % in large type, relative date ("Demain · 8h30"), km / D+ / estimated duration, participant avatars, effort level (`lib/effort.ts`, from km and D+ only, never Strava data).
- **Block content**: the proposer's **age is removed** from the outing block (do not add a birth date to `profiles`).
- **Map**: the block's background image shows the **starting point** of the outing (not the full route), built from raw OpenStreetMap tiles (`components/maps/StaticMap.tsx`, no key, no JS). Interactive maps (detail page, start-point picker) use Leaflet + OSM tiles; geocoding uses Photon (OSM, no key). No paid Mapbox/Google. OSM's tile usage policy only tolerates light traffic: switch to a dedicated tile provider before significant growth.
- **Notifications**: in-app now (`notifications` table). Push notifications later, once the site becomes a real mobile app.
- **Compute engine**: stays inside the Next.js app (simple, no separate service).
- **Priorities (in order)**: 1) app stability, 2) decent UI (map, notifications), 3) turn the website into a real Android/iPhone app. Chosen path: **PWA first** (done: installable, service worker, offline page, Web Push), then an Android TWA on the Play Store, then possibly an iOS Capacitor shell. Every wrapper loads the live site, so a Vercel deploy updates every user instantly — the app can never be bundled offline (SSR + Server Actions).

### Security notes

- Strava tokens are **encrypted at rest** (AES-256-GCM, `lib/crypto.ts`, key in `STRAVA_TOKEN_ENCRYPTION_KEY`, stored as `v1.<iv>.<tag>.<data>`). Rows written before encryption are still read as plain text and re-encrypted on the next login/refresh. Losing or changing the key makes stored tokens unreadable (users just need to sign in again).
- Since July 2026 Strava marks an API app **"Inactive"** (403 on every API call, even though OAuth still works) when its owner has no paid Strava subscription. Production uses app `283677` (owned by the co-founder's account). `auth.ts` refuses the sign-in when Strava returns no athlete profile instead of creating a ghost profile.
- Every Server Action is a public HTTP endpoint: validate all arguments with `lib/validation.ts` (zod) — user IDs must match `isValidUserId` (digits only) before being used in a PostgREST filter such as `.or()`.
- Legacy hand-made RLS policies that opened `messages`/`activities`/`participations` to the anon key were dropped (migration `012`). Never add write policies or policies on private tables.

### Matching roadmap: from hand-made formula to learned model

Current state: **v2** hand-made formula (`lib/matching.ts`, `MATCHING_VERSION = 'v2-pace-style-feasibility'`): person ↔ person affinity (terrain-adjusted pace in km-effort/h, D+ per km, usual duration, pauses; Gaussian closeness per sport) × feasibility of the outing for the viewer (outing km-effort and D+ vs the viewer's 90th percentile — a 2 000 m D+ outing can never show 90 % to someone who never exceeds 800 m). **Strava's API Policy (June 2026) forbids using Strava data, even derived, to develop, train or evaluate an AI application, and caps the cache of derived data**: no learned model on Strava-derived features without written approval from Strava; learning, if ever, only on PerfConnect-own data (accept/refuse, feedback). Derived profiles live 48 h max (`PROFILE_TTL_MS`, purged in the background). Also: a Standard Strava app serves **10 athletes until Strava reviews it** (official "Connect with Strava" button and "Powered by Strava" required). Target vision: **do not run an AI for every match**. Instead, analyze the app's results (accepted/refused participations, `match_feedback.accurate`, whether the outing actually happened) and use an offline model trained on this data to **learn the parameters/weights** of the matching function; the app then simply loads those learned parameters and computes the % with a cheap formula. Therefore:
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
npm test        # Vitest (tests/*.test.ts): dates/timezone, 1 h rule, validation, crypto, feed sort, matching, static map
```

Run a single test file with `npx vitest run tests/dates.test.ts`.

## Environment setup

Copy `exampleOfenv.txt` to `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_SECRET`, `AUTH_URL` (NextAuth)
- `AUTH_STRAVA_ID`, `AUTH_STRAVA_SECRET` (Strava OAuth app — the same app works locally: Strava always accepts `localhost` callbacks)
- `STRAVA_TOKEN_ENCRYPTION_KEY` (`openssl rand -base64 32`, one per environment; must also be set on Vercel)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (Web Push; `npx web-push generate-vapid-keys`, one pair per environment — without them push is simply disabled)

On Vercel, `AUTH_URL` (Production) is `https://app.perfconnect.fr` and the Strava app's callback domain is `app.perfconnect.fr`: Strava accepts a single callback domain (plus `localhost`), so Strava sign-in cannot work on Vercel preview URLs.

Do not run `vercel env pull .env.local`: the Vercel variables are marked "Sensitive" and come back empty, overwriting the local file. `lib/supabase-admin.ts` throws when `createAdminClient()` is called without the service role key.

## Architecture

**Auth**: NextAuth v5 (beta) with a single Strava OAuth provider, split in two files: [auth.config.ts](auth.config.ts) is Edge-safe (provider, pages, `jwt`/`session` callbacks, and the `authorized` route gate used by [middleware.ts](middleware.ts): `/`, `/login`, `/legal`, `/api/auth/*`, PWA icons/manifest and `/activities/[uuid]` are public; everything else requires a session); [auth.ts](auth.ts) adds the Node-only `signIn` callback (profile upsert, encrypted token storage, background performance refresh). The Strava athlete ID (`account.providerAccountId`) is used directly as the user's primary key — there is no separate internal user ID. Auth errors redirect to `/login?error=…`, which shows a French message.

**Data access layers** (all server-only, use `createAdminClient()` from [lib/supabase-admin.ts](lib/supabase-admin.ts) which uses the service-role key and bypasses RLS):
- [lib/session.ts](lib/session.ts) — `getCurrentUser()` (wrapped in React `cache()`: one session+profile read per request) / `requireAuth()`. A session whose ID is not a Strava ID, or whose profile no longer exists, counts as logged out.
- Read helpers used while rendering server pages: [lib/users.ts](lib/users.ts), [lib/activities.ts](lib/activities.ts), [lib/participations.ts](lib/participations.ts), [lib/feed.ts](lib/feed.ts) (match %, distances, feed sort), [lib/conversations.ts](lib/conversations.ts), [lib/saved-places.ts](lib/saved-places.ts), [lib/notifications.ts](lib/notifications.ts), [lib/messages.ts](lib/messages.ts).
- [app/actions.ts](app/actions.ts) — Server Actions (`'use server'`) called from client components only (mutations + chat polling): create/update/cancel activity, request/approve/reject participation, chat, match feedback, reports, profile location, saved places, account. Every action re-checks `getCurrentUser()` itself, validates its arguments (zod) and returns `{ success, data?, error? }` instead of throwing. Basic per-user rate limits live in [lib/rate-limit.ts](lib/rate-limit.ts).
- Pure rules/helpers (unit-tested): [lib/activity-rules.ts](lib/activity-rules.ts) (1 h cutoff), [lib/dates.ts](lib/dates.ts) (Europe/Paris), [lib/places.ts](lib/places.ts) (place-name normalization, directions links), [lib/validation.ts](lib/validation.ts) + [lib/constraints.ts](lib/constraints.ts) (client-safe limits), [lib/sports.ts](lib/sports.ts), [lib/static-map.ts](lib/static-map.ts), [lib/crypto.ts](lib/crypto.ts).
- [lib/background.ts](lib/background.ts) — `runInBackground()` wraps Next's `after()` for post-response work.

**Matching & performance** (server-only):
- [lib/strava.ts](lib/strava.ts) — Strava API calls (`fetchStravaActivities`, `refreshStravaAccessToken`, `deauthorizeStrava`). [lib/strava-tokens.ts](lib/strava-tokens.ts) — encrypted token storage and `getValidStravaAccessToken()` (auto-refresh).
- [lib/performance.ts](lib/performance.ts) — fetches up to 200 activities of the last 120 days (one request), drops e-bikes, virtual rides, trainer/commute/manual activities and walks, and computes per-family indices (median terrain-adjusted pace, D+/km, moving time, pause ratio, P90 effort and D+) stored in `performance_profiles` (`refreshPerformanceProfileIfStale` — atomic claim on `strava_tokens.last_profile_refresh_at`/`profile_version`, at most once per 24 h, retry after 1 h on failure; called from the main layout for the viewer and from the feed, in the background, for organizers without a fresh profile).
- [lib/matching.ts](lib/matching.ts) — `computeMatch(viewer, organizer, viewerGeo, organizerGeo, outing?)` → `{ percentage, hint? }` (see the matching roadmap above; weights in `WEIGHTS`, tolerances and feasibility parameters next to it) plus a geo **bonus only** (+5 same city, +2 same country). Returns `null` when either side has no profile for the sport. The `hint` only uses the viewer's own data. The % shown when a participation is requested is logged in `participations.match_percentage` / `matching_version`; it is **never shown to the organizer** (another user's Strava-derived data).
- [lib/notifications.ts](lib/notifications.ts), [lib/messages.ts](lib/messages.ts) — notification creation/reading and unread counters.

**Database** (migrations in [supabase/migrations/](supabase/migrations/), `001`–`014`): `profiles.id` is text (the Strava athlete ID) and is the FK target for every user reference. RLS is enabled on **all** tables. Verified against the live Supabase project (schema `public`):

| Table | Purpose / key columns |
|---|---|
| `profiles` | PK `id` (Strava ID), `name`, `avatar_url`, `email`, `bio`, `strava_username`, `city`, `country`, `latitude`, `longitude` |
| `activities` | the outings: `title`, `type` (CHECK: 4 sports), `start_date`, `location` (start place name), `latitude`/`longitude` (start point), `distance`, `elevation`, `description`, `organizer_id` (FK profiles) + denormalized `organizer_name`/`organizer_avatar`, `status` (`active`/`cancelled`), `cancelled_at`, `updated_at` |
| `participations` | `activity_id`, `user_id`, `status` (`pending`/`approved`/`rejected`, default `pending`), `match_percentage`, `matching_version` |
| `push_subscriptions` | Web Push subscriptions: `user_id`, `endpoint` (unique), `p256dh`, `auth`, `vapid_public_key`, `user_agent`, `last_used_at` — service-role only |
| `saved_places` | organizers' saved start places: `user_id`, `name`, `name_normalized` (unique per user), `latitude`, `longitude` — private, service-role only |
| `messages` | `sender_id`, `receiver_id`, denormalized `sender_name`/`sender_avatar`, `content`, `is_read` |
| `notifications` | `user_id`, `type` (`message`/`participation_request`/`participation_approved`/`participation_rejected`/`activity_updated`/`activity_cancelled`), `title`, `body`, `link`, `is_read`, `related_id` |
| `strava_tokens` | PK `user_id`, `access_token`, `refresh_token` (both AES-GCM encrypted), `expires_at`, `scope`, `last_profile_refresh_at`, `profile_version` — **sensitive**, service-role only |
| `performance_profiles` | PK (`user_id`, `sport_family`), v2 columns `effort_speed_kmh`, `climb_m_per_km`, `p90_effort_km`, `p90_elevation_gain_m` (+ v1 columns kept for compatibility: `avg_speed_mps`, `avg_moving_time_s`, `avg_elevation_gain_m`, `avg_chill_index`), `sample_size`, `computed_at` (rows older than 48 h are ignored and purged). `sport_family` ∈ trail, course-a-pied, velo-route, vtt |
| `match_feedback` | per-activity feedback on match quality: `activity_id`, `rater_id`, `rated_id`, `accurate` (bool) — service-role only |
| `user_reports` | moderation reports: `activity_id`, `reporter_id`, `reported_id`, `reason`, `description` — strictly confidential, service-role only |

Access policy: `profiles`/`activities`/`participations` have public SELECT policies only; `messages`, `notifications`, `strava_tokens`, `performance_profiles`, `saved_places`, `push_subscriptions`, `match_feedback` and `user_reports` have no policy (service-role client only, i.e. only through server code — never query them from the client with the anon key; the app has no anon/browser Supabase client at all). Apply migrations via the Supabase MCP in Claude Code (the owner authorized applying them directly) or the Supabase SQL editor; there is no CLI-driven migration workflow in this repo. Note: the local dev environment and production share this single Supabase project. Always add a new numbered migration file in `supabase/migrations/` for any schema change so the repo stays the source of truth.

**Routing** ([app/](app/)): two route groups — `app/(main)/` (layout with top bar, bottom nav, unread counters, background profile refresh) and `app/(immersive)/` (full-screen, no chrome: `/login`). Every main page has a `loading.tsx` skeleton (`components/Skeletons.tsx`) so a tap gives instant feedback. `/` (activity feed), `/activities` (my outings, tabs), `/activities/[id]`, `/activities/[id]/edit`, `/create`, `/users/[id]` (public profile: sports + match %, never raw Strava data), `/messages`, `/messages/[id]` (polls every 5 s while visible), `/notifications`, `/profile`, `/settings`, `/legal`, `/login`; API routes `/api/auth/[...nextauth]` and `/api/version`; PWA route `/manifest.webmanifest`, static `/sw.js`, `/offline.html` and icons (`/favicon.ico`, `/apple-touch-icon.png`, `/icons/*.png`). Next 15: page `params`/`searchParams` are Promises (`await params`). [app/layout.tsx](app/layout.tsx) only holds `<html>`/`<body>`/font/`PwaManager`; [app/(main)/layout.tsx](app/(main)/layout.tsx) renders the mobile-width shell (top bar + [components/BottomNav.tsx](components/BottomNav.tsx)), calls `getCurrentUser()` server-side and has `export const dynamic = 'force-dynamic'`. `app/error.tsx`, `app/global-error.tsx` and `app/not-found.tsx` handle failures.

**Mobile**: `viewport-fit=cover` + utilities in [app/globals.css](app/globals.css) — `pt-safe`/`pb-safe` (notch/home indicator), `pb-nav` (space for the bottom nav), `top-header` (sticky sub-headers under the top bar), `bottom-nav-offset` (sticky CTA above the nav). Inputs are forced to 16 px on phones (prevents the iOS focus zoom); use `min-h-dvh`/`dvh`, never `100vh`; keep tap targets ≥ 44 px. Leaflet maps must sit in a `relative z-0` wrapper so their panes don't cover sticky headers/modals.

**Performance**: Vercel functions run in `dub1` (Dublin, `vercel.json` + project settings), next to Supabase eu-west-1 — from Washington each DB round trip cost ~300 ms. Keep queries parallel (`Promise.all`), join profiles with PostgREST embedding (`profiles(name, avatar_url)`), make create/update actions `redirect()` instead of `router.push` + `router.refresh`, and avoid `revalidatePath('/', 'layout')` in actions. `experimental.staleTimes.dynamic = 30` reuses visited tabs for 30 s; the middleware skips prefetches and Server Action requests.

**Security headers** are set in [next.config.mjs](next.config.mjs) (frame-ancestors none, nosniff, referrer policy, permissions policy allowing geolocation for self, HSTS).

**PWA**: [public/sw.js](public/sw.js) (hand-written service worker, registered in production only by [components/PwaManager.tsx](components/PwaManager.tsx); set `NEXT_PUBLIC_ENABLE_SW=true` to test it in dev): pages are always fetched from the network (never cached — personal data) with [public/offline.html](public/offline.html) as offline fallback; hashed `/_next/static` files are cache-first; the offline page's logo and the 192 icon are precached (network first, cache when offline); bump `CACHE_VERSION` to drop the static cache (also after regenerating the brand assets). `PwaManager` also compares the build's `NEXT_PUBLIC_APP_VERSION` (commit SHA, injected in `next.config.mjs`) with `/api/version` and shows a "Mettre à jour" banner after a deploy. Install UI: [components/InstallAppPrompt.tsx](components/InstallAppPrompt.tsx) (Android `beforeinstallprompt`, iOS "Partager → Sur l'écran d'accueil"). **Web Push**: [lib/push.ts](lib/push.ts) (`web-push`, VAPID) sends a push for every row created by `createNotifications()` and for each new chat message; subscriptions live in `push_subscriptions` (stored with the VAPID public key used, because local dev and production share the database) and only browser push services are accepted as endpoints (SSRF guard). On iPhone, push only works once the app is installed on the home screen (iOS 16.4+). The Claude app's built-in browser cannot register service workers: test them in a real Chrome.

**Path alias**: `@/*` maps to the repo root (see [tsconfig.json](tsconfig.json)), e.g. `@/lib/session`, `@/auth`.

**UI components**: [components/ui/](components/ui/) holds small shadcn-style primitives (button, card, input, label, textarea) built on `class-variance-authority` + `tailwind-merge` via the `cn()` helper in [lib/utils.ts](lib/utils.ts). Feature components (`ActivityCard`, `ActivityDetailClient`, `ChatClient`, `PropositionForm` (create + edit), `StartPlacePicker`, `PlaceAutocomplete`, `CityPicker`, `SavedPlacesManager`, `MyActivitiesTabs`, `MatchFeedbackPrompt`, `ReportUserButton`, `MessagesList`, `ProfileTabs`, …) live directly under `components/`; map components under [components/maps/](components/maps/) (`StaticMap`, `LeafletMap`, `MapPickerModal`, `MapPin`). Client components must import limits from `lib/constraints.ts` (not `lib/validation.ts`, which pulls zod into the bundle).

**Brand**: the brand guidelines (logo usage, palette with roles and contrasts, typography, key components, Strava brand rules) live in [docs/charte-graphique.md](docs/charte-graphique.md) — read them before any UI work. Colors come from the official logo (orange `#FE5820`, navy `#022354`) and are defined once in [lib/brand.ts](lib/brand.ts), imported by Tailwind (`brand-*` orange, `navy-*` navy), the manifest, the viewport and inline SVG/styles: never hardcode a hex. Buttons and orange text use `brand-600` (`primary`, AA), never `brand-500`; titles and main text use `navy-900`. Three logo versions: the symbol alone (`public/brand/logo-mark.png`, from `logo-source.png`) is the only one used for app icons (favicon, apple-touch-icon, manifest, maskable); the full logo with the name (`public/brand/logo-wordmark.png`, from `logo-wordmark-source.webp`, "Perf" navy + "Connect" orange; screens use `logo-wordmark-480.png`) is for the login screen (136 px wide), the offline page (160 px), documents and the marketing site — never an app icon, never below 120 px wide; the horizontal logotype (symbol + the official lettering cut from the full logo, never a font) is `public/logo.png` in the 28 px header (`public/brand/logo-horizontal.png` in high resolution). All of these are generated by `python3 scripts/brand-assets.py` (Pillow + numpy; outputs are committed).

**Language**: UI copy, code comments, and error messages throughout the codebase are in French; keep new user-facing strings consistent with that.
