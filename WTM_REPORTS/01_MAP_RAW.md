# 01 — CARTOGRAPHY: RAW (`wtm/`)

Expo Router file-based routing. Every claim below is from reading the files.

> **Scope limit, stated up front:** RAW is a native mobile app with no Supabase
> project provisioned and no simulator in this container. **It was never run.**
> Everything here is static analysis, typechecking and SQL review. Nothing in
> this document is runtime-observed.

## Surface — 24 routes

| Route | Purpose | Reachable from UI? |
|---|---|---|
| `_layout.tsx` | Auth gate + splash. Routes to auth / age gate / tabs | entry |
| `(auth)/welcome` | Landing | yes |
| `(auth)/sign-in` | Email + password | yes |
| `(auth)/sign-up` | 4-field signup | yes |
| `(auth)/invite` | Invite code entry | yes |
| `(auth)/verify-age` | Age gate (17–25) | forced after signup |
| `(tabs)/index` | **Map** — moves + spots layers | tab 1 |
| `(tabs)/list` | Feed (delegates to `FeedList`) | tab 2 |
| `(tabs)/create` | Create a move | tab 3 |
| `(tabs)/activity` | Notifications | tab 4 |
| `(tabs)/profile/index` | Own profile | tab 5 |
| `(tabs)/profile/edit` | Edit profile | from profile |
| `move/[id]` | Move detail + chat + RSVP | from feed/map |
| `move/[id]/attendees` | Full attendee list | **gated on `attendees.length > 6`, which the prefetch cache-key bug makes unreachable** |
| `spot/[id]` | Spot detail | from map spots layer |
| `add-spot` | Create a spot | from map |
| `user/[id]` | Another member's profile | from attendees |
| `invite-friends` | Share your invite code | from profile |
| `i/[code]` | Deep-link invite handler | external link |

## Features — honest classification

| Feature | State | Why |
|---|---|---|
| Auth (email/password) | **WORKING** | Supabase Auth, session in SecureStore |
| Invite-gated signup | **FAKE** (now fixed) | The gate was client-side; the trigger skipped a missing code. Enforced in 015 |
| Age gate | **PARTIAL** (improved) | Was computable-around and admitted 16-year-olds; fixed client-side. Still not enforced server-side |
| Map (moves layer) | **PARTIAL** | Renders, but errors surface as "no moves in view" and the spinner can hang |
| Map (spots layer) | **PARTIAL** | Same, plus an unhandled throw path |
| Feed | **PARTIAL** | No error state — a dead network reads as "No moves yet" |
| Create a move | **PARTIAL** | Works, but every move is pinned to downtown Pittsburgh — there is no map picker and no geocoding |
| RSVP | **WORKING** | Optimistic with rollback; rollback hardcodes `is_full:false` |
| Waitlist | **DEAD** | Migration 014 could not apply, so the tables/functions never existed |
| Hype reactions | **DEAD** | Same |
| Crew-going social proof | **DEAD** | Two `nearby_moves` overloads; the client binds the old one, which returns no `crew_going` |
| Trending badge | **DEAD** | Same — `hot_score` is undefined client-side, so the badge never renders |
| Move chat | **BROKEN** (now fixed) | `.catch()` on a thenable threw on every mount |
| Activity feed | **PARTIAL** | Works; `waitlist_promoted` had no copy |
| Push notifications | **DEAD** | No token is ever registered. `getExpoPushTokenAsync` appears nowhere |
| Spots ("Fire Spots") | **WORKING** | Full CRUD + fire/save |
| Block / report | **WORKING** | Block had a silent-failure path |
| Daily digest | **DEAD** | Calls an RPC signature that does not exist; capped at 1000 users silently |
| Design tokens (`tailwind.config`) | **DEAD** (now fixed) | NativeWind was never wired into Metro, so every `className` was inert |

## Data

13 tables + 2 views. Full RLS inventory is in `02_AUDIT.md`. Schema drift found:
`src/types/database.ts` was missing 4 tables, 1 view and 3 RPCs added by migrations
012–014, and `ProfileRow` lacked the 5 columns migration 011 added. All reconciled.

## Backend

4 Supabase Edge Functions (Deno):

| Function | Auth | Verdict |
|---|---|---|
| `send-push-notification` | **none** | **Deleted** — unauthenticated, held the service-role key, invoked from the client |
| `generate-invite-codes` | admin secret, **failed open** | Fixed: fails closed, batch clamped |
| `validate-invite` | none | Unthrottled enumeration oracle. Documented |
| `daily-digest` | cron | Calls a nonexistent signature; silently capped at 1000 |

## Identity

Signup → invite code → age gate → tabs. Logged-out users reach only `(auth)/*` and
`i/[code]`. **What a logged-in user could reach that belongs to someone else** (before 015):
every move including private ones via `moves_with_counts`; every user's push token,
birthdate and social handle; anyone's notifications via `mark_activity_read`; anyone's
RSVP promotion via `promote_from_waitlist`.

## Flow

TanStack Query with a 2-minute `staleTime`. Cache invalidation is broadly correct, with
three exceptions found: chat invalidated every loaded page on every message; `prefetchMove`
and the detail screen shared a cache key that ignored the row limit; and three
`queryKeys.moves.myUpcoming()` invalidations fire against a key no query registers.

## Dependencies and bill risk

| Service | Plan | Bill risk |
|---|---|---|
| **Supabase** | Free (500 MB DB, 1 GB storage, 5 GB egress, 500k edge invocations, 50k MAU) | **HIGH before tonight** — see C4/C5/C7/H4 |
| **Expo EAS** | Free tier | Build minutes only; not wired up (placeholder IDs) |
| **Google Maps SDK** | Native key | Restrict by bundle ID / SHA-1 |
| **Google Places** | — | **Key was in the bundle and unused. Removed.** |
| Expo Push | Free | Unmetered |

**Nothing metered is currently live**, because no Supabase project exists.

---

# THE JOURNEY

The brief asks for this walked in a real browser. **I could not.** RAW is a native app
needing a simulator and a database that does not exist. Walking it in a browser would have
produced a fabricated account, so instead this is traced through the code, and every step is
marked with how it was established.

1. **Launch** → `_layout.tsx` splash. *If the profile fetch fails (offline cold start with a
   cached session), `profile` stays null forever, the age gate is skipped and the profile tab
   renders a blank black screen with no spinner, error or retry.* **[code-traced]**
2. **Welcome → Sign up** → 4 fields. Good error handling — the best in the app. **[code-traced]**
3. **Invite code** → *before 015, could be skipped entirely by calling the API directly.*
4. **Age gate** → *admitted 16-year-olds; fixed tonight.*
5. **Land on the Map** → *header reads "📍 Pittsburgh" regardless of where the user actually is;
   `setCity` exists and is never called.* **[grep-verified: 0 call sites]**
6. **Tap a card** → *press-in fired a prefetch, including on the press-in that becomes a scroll.
   Fixed. The prefetch also poisoned the detail screen's attendee cache, so a 40-person move
   showed 5 faces and the "See all" link never appeared.*
7. **Move detail** → *`MoveChat` mounted and threw a TypeError, dropping the screen into the
   ErrorBoundary for exactly the users who had RSVP'd. Fixed.* **[tsc-verified]**
8. **RSVP** → works. *A full move's "Join waitlist" wrote an enum value that does not exist.*
9. **Create a move** → *lands at 40.4406,-79.9959 — downtown — no matter what address was typed.*
10. **Network dies at any point** → *8 of 14 data-driven screens report "nothing exists"
    rather than "something failed."*

**The single worst thing about this journey is step 10.** The app is confident and wrong
whenever the network is bad, which for a going-out app is exactly when it is being used.
