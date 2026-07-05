# What's The Move (WTM) 🔥

> Find what's happening today. Set the move for tonight.

WTM is a social discovery app where users post and find user-generated "moves" — spontaneous or planned events happening nearby. Launching in Pittsburgh, scaling globally.

---

## Tech Stack

| | |
|---|---|
| **Framework** | React Native + Expo SDK 51 |
| **Navigation** | Expo Router v3 (file-based) |
| **Backend** | Supabase (PostgreSQL + PostGIS + Auth + Realtime + Storage) |
| **Data** | TanStack Query v5 |
| **State** | Zustand |
| **Maps** | react-native-maps |
| **Styling** | NativeWind v4 (Tailwind) |
| **Build** | EAS Build |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Supabase CLI (`npm install -g supabase`)
- EAS CLI (`npm install -g eas-cli`)

### 1. Clone & install
```bash
cd wtm
npm install
```

### 2. Set up Supabase
```bash
# Start local Supabase
supabase start

# Run migrations
supabase db reset

# Generate TypeScript types
npm run supabase:types
```

### 3. Configure environment
```bash
cp .env.example .env
# Fill in your Supabase URL, anon key, and Google Maps API key
```

### 4. Run the app
```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Expo Go (limited)
npm start
```

---

## Project Structure

```
wtm/
├── app/                    # Expo Router screens
│   ├── (auth)/             # Onboarding, invite, sign-up, sign-in
│   ├── (tabs)/             # Feed, Map, Create, Activity, Profile
│   ├── move/[id].tsx       # Move detail
│   └── user/[id].tsx       # User profile
├── src/
│   ├── components/         # UI components
│   ├── hooks/              # TanStack Query hooks
│   ├── store/              # Zustand stores
│   ├── lib/                # Supabase client, query client
│   ├── types/              # TypeScript types
│   └── utils/              # Time, distance helpers
└── supabase/
    ├── migrations/         # 6 migration files
    ├── functions/          # Edge functions
    └── seed.sql            # Dev seed data
```

---

## Key Features (MVP)

- **Map-first** — the home screen is a live dark map of moves happening around you; pins are placed by real coordinates returned from the geo query
- **Fire Spots layer** — toggle the map from Moves (time-bound events, circular pins) to Spots (permanent gems, diamond pins): urbex, skate spots, sunsets, fire views, swim holes. Long-press anywhere on the map to drop one. Members 🔥 spots and save them; hot spots (10+ fires) glow on the map
- **Know-someone entry** — invite-only, but frictionless: every member gets 5 personal invites to hand out. Using someone's code links you to them (referral graph)
- **Create a Move** — title, category, location (name + coordinates), time, max capacity, cover photo
- **List view** — secondary tab: infinite scroll, filter by category and distance radius
- **RSVP System** — optimistic updates, max capacity enforcement at DB level
- **Realtime** — live attendee count via Supabase Realtime subscriptions
- **Push Notifications** — notify move creator when someone joins (Expo push)
- **Profiles** — avatar, bio, stats, move history, and your invite code

---

## Database Schema

```
profiles          ← extends auth.users (+ referral_code, invited_by)
invite_codes      ← beta access control + member referral codes
moves             ← PostGIS geography(Point,4326) for geo queries
rsvps             ← capacity enforced via DB trigger
moves_with_counts ← view with attendee_count, spots_left, is_full
spots             ← permanent map gems (urbex, skate, sunset, view...)
spot_fires        ← 🔥 votes (one per member; counts synced by trigger)
spot_saves        ← bookmarks
```

Key SQL functions:
- `nearby_moves(lat, lng, radius_m, filter_cat)` — PostGIS ST_DWithin query
- `nearby_spots(lat, lng, radius_m, filter_cat)` — spots layer, hottest-first, includes the caller's 🔥/save state
- `get_spot(spot_id)` — spot detail with creator info
- `get_move_attendees(move_id, limit)` — attendee list with profiles
- `my_rsvp_status(move_id)` — current user's RSVP status
- `get_my_upcoming_moves()` — activity feed
- `get_my_invite()` / `get_my_referrals()` — referral graph

---

## Edge Functions

| Function | Purpose |
|---|---|
| `validate-invite` | Check invite code validity (no direct DB exposure) |
| `send-push-notification` | Expo push when someone joins a move |
| `generate-invite-codes` | Admin batch code generation (auth required) |

---

## Deploying

### EAS Build (iOS + Android)
```bash
# Development build (installs to device, faster iteration)
eas build --profile development --platform all

# TestFlight + Internal Android
eas build --profile preview --platform all

# Production App Store + Play Store
eas build --profile production --platform all
eas submit --profile production
```

### Supabase (Production)
1. Create project at [supabase.com](https://supabase.com)
2. Run migrations: `supabase db push`
3. Deploy Edge Functions: `supabase functions deploy`
4. Enable PostGIS extension in dashboard
5. Create storage buckets: `avatars`, `move-images`, and `spot-images` (set public)
6. Set Edge Function secrets: `ADMIN_SECRET`

---

## Know-Someone Entry (Referral Graph)

The "you gotta know someone" mechanic — exclusive in feel, easy if you actually
know a member:

1. User opens app → `/welcome`
2. Taps "I have an invite code" → `/invite`
3. Code validated via `validate-invite` Edge Function
4. `codeId` stored in Zustand (in-memory) → proceed to `/sign-up`
5. On account creation, the `handle_new_user` trigger (migration `007_referrals.sql`):
   - burns one use of the invite code and records `invited_by` (the referral link)
   - mints the new member their **own** personal code (`MOVExxxx`) with 5 invites
6. New member sees their code + invites-left on Profile → `/invite-friends`, and can
   see everyone they've brought in

Because each personal code lives in the same `invite_codes` table, the existing
`validate-invite` function works for member codes with no changes.

**Bootstrapping:** the very first members need founder codes (nobody invited them).
`seed.sql` ships a handful (`PITTSB01`, `STEEL412`, …). Generate more:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/generate-invite-codes \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"count": 100, "maxUses": 1}'
```

---

## Deep-Link Invites

Sharing an invite from `/invite-friends` produces a link like
`https://whatsthemove.app/i/MOVE7K2Q`. Tapping it:

1. Opens the app to `app/i/[code].tsx` (custom scheme `wtm://i/CODE` works too)
2. Validates the code via the `validate-invite` Edge Function
3. On success → routes straight to `/sign-up` with the code applied and an
   "Invited with code" banner (skips manual entry entirely)
4. On failure → routes to `/invite` with the code prefilled and an error
5. If the tapper is already a member → sends them into the app

The `i` route is whitelisted in the root auth gate so a signed-out friend can
reach it without being bounced to the welcome screen.

**Required server-side files** (host on `whatsthemove.app`) for the links to open
the app directly instead of the browser:

`/.well-known/apple-app-site-association` (no extension, `Content-Type: application/json`):
```json
{
  "applinks": {
    "apps": [],
    "details": [
      { "appID": "YOUR_TEAM_ID.com.wtm.app", "paths": ["/i/*", "/move/*", "/spot/*"] }
    ]
  }
}
```

`/.well-known/assetlinks.json`:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.wtm.app",
    "sha256_cert_fingerprints": ["YOUR_APP_SIGNING_SHA256"]
  }
}]
```

The matching client config already lives in `app.json`
(`ios.associatedDomains` + `android.intentFilters`).

## Performance & Security Notes

**Feed latency:** `nearby_moves` returns the caller's own RSVP status inline
(migration 009), so the feed renders join-state with **one** round-trip
instead of one-per-card. Detail + attendee queries are prefetched on card
press-in, and the RSVP mutation optimistically patches both the detail and
every cached feed page.

**Rendering:** `MoveCard` is memoized with an explicit comparator; the feed
FlatList uses `removeClippedSubviews`, tuned batch/window sizes, and
`keepPreviousData` so filter changes crossfade instead of collapsing to
skeletons. All remote images go through `expo-image` (memory+disk cache,
fade-in transitions, recycling keys).

**Security:**
- `invite_codes` SELECT is restricted to rows you created — the previous
  policy allowed authenticated enumeration of valid codes. Validation goes
  exclusively through the `validate-invite` Edge Function (service role).
- DB-level rate limits: 10 moves and 20 spots per user per 24h (migration 009).
- Capacity, username format, title lengths, and RSVP uniqueness are all
  enforced by constraints/triggers, not just client code.
- `reports` table (insert-only for members) for community moderation.

**Crash safety:** a root `ErrorBoundary` renders a branded recovery screen and
routes render crashes through `src/lib/log.ts` (the hook point for Sentry).

**Tests:** `npm test` runs Jest (jest-expo) unit tests for the pure utils.

## Scaling Beyond Pittsburgh

The architecture is already global-ready:
- `moves.city` column for city-scoped queries
- PostGIS geography type handles spherical distance globally
- `nearby_moves()` function works anywhere — just pass different coords
- Add city selector to onboarding for non-Pittsburgh users

---

## Design System

**Brand color:** `#FF6B35` (orange)
**Background:** `#0A0A0A` (near-black)
**Surface:** `#1E1E1E` / `#252525` (elevated cards)
**Text:** `#FAFAFA` (primary) / `#A0A0A0` (muted) / `#606060` (subtle)

---

## License

Private — all rights reserved.
