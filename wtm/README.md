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

- **Invite-only beta** — validate codes via Edge Function before sign-up
- **Create a Move** — title, category, location (name + coordinates), time, max capacity, cover photo
- **Browse Feed** — infinite scroll, filter by category and distance radius
- **Map View** — custom dark map, tap pins to preview moves
- **RSVP System** — optimistic updates, max capacity enforcement at DB level
- **Realtime** — live attendee count via Supabase Realtime subscriptions
- **Push Notifications** — notify move creator when someone joins (Expo push)
- **Profiles** — avatar, bio, stats, move history

---

## Database Schema

```
profiles          ← extends auth.users
invite_codes      ← beta access control
moves             ← PostGIS geography(Point,4326) for geo queries
rsvps             ← capacity enforced via DB trigger
moves_with_counts ← view with attendee_count, spots_left, is_full
```

Key SQL functions:
- `nearby_moves(lat, lng, radius_m, filter_cat)` — PostGIS ST_DWithin query
- `get_move_attendees(move_id, limit)` — attendee list with profiles
- `my_rsvp_status(move_id)` — current user's RSVP status
- `get_my_upcoming_moves()` — activity feed

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
5. Create storage buckets: `avatars` and `move-images` (set public)
6. Set Edge Function secrets: `ADMIN_SECRET`

---

## Invite Code Beta Flow

1. User opens app → `/welcome`
2. Taps "I have an invite code" → `/invite`
3. Code validated via `validate-invite` Edge Function
4. `codeId` stored in Zustand (in-memory) → proceed to `/sign-up`
5. On account creation → Supabase trigger auto-creates profile
6. Edge Function atomically marks code as used

Generate codes for launch:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/generate-invite-codes \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"count": 500, "maxUses": 1}'
```

---

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
