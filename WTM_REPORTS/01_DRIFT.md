# 01 — DRIFT: BETA vs RAW


> **Dated snapshot — 2026-08-12.** Parts of this have since been overtaken. `STATE.md` is the current picture; where the two disagree, STATE.md is right.

> Specifically: items 2 and 4 below are fixed. Trending, crew-going and waitlist now reach
> the feed, and both categories exist in RAW's enum.

The two builds have diverged into different products. This is the reconciliation list.

## In BETA, absent from RAW

| Thing | Reconcile toward | Why |
|---|---|---|
| **"Just Us" and "The Scene" categories** | **RAW** | These are BETA's strongest product idea. RAW's `move_category` enum is `bars/sports/food/music/outdoor/gaming/art/social/other` — the two categories the demo is built around do not exist in the database. A stranger who likes the demo and then gets into RAW finds neither. |
| **Stories** | Decide | Meaningful build. Not in RAW at all. |
| **Live activity simulation** | Neither | BETA-only by nature. |
| **The canvas map** | Neither | RAW correctly uses `react-native-maps`. BETA's hand-drawn map is a demo artifact, not a component to port. |
| **Vibe meter, streaks, badges** | Decide | Cheap to add, good retention hooks, no backend cost. |
| **Address on the move sheet, hidden until you join** | **RAW** | RAW has `location_name` but no street address and no reveal-on-join. Good safety property for a 17–25 app. |

## In RAW, absent from BETA

| Thing | Reconcile toward | Why |
|---|---|---|
| Auth, invites, age gate | Neither | BETA is deliberately anonymous. |
| Spots ("Fire Spots") — a whole second map layer | **BETA** | A shipped RAW feature the demo never shows, so it is invisible in the pitch. |
| Blocking and reporting | Neither | Right to keep out of the demo. |
| Waitlist, reactions, crew-going | Already in BETA | RAW has them written but **dead** (migration 014 never applied). BETA is the honest preview of code RAW cannot yet run. |

## Where the same concept diverged

| Concept | BETA | RAW | Reconcile |
|---|---|---|---|
| **Accent colour** | Sodium amber `#FF9E3D`, one accent | `#FF6B35` orange hardcoded across 18 screens | **BETA** — port the token set |
| **Design tokens** | Full token system, both themes | `tailwind.config.js` has a token palette that **was never active** (NativeWind unwired). 18 screens hand-roll `#FF6B35`, `#1A1A1A`, `borderRadius: 28` | **BETA** |
| **RSVP states** | going / waitlisted / full / open | Same four, plus `maybe` in the enum which no UI exposes | Drop `maybe` |
| **Category colour** | Removed — icon + label only | Per-category colour | **BETA** |
| **Typography** | 3 real faces, modular scale | System sans, weights 700–900 throughout | **BETA** |
| **Radii** | 2, by element class | 18, 24, 28, 29 ad hoc | **BETA** |
| **"crew" vs "friends"** | "friends" everywhere | `crew_going`, `squad_with`, `squad_confirmed` in the schema and UI | **BETA** — the word was explicitly rejected. Rename in a migration. |

## What BETA promises that RAW cannot deliver

This is the important section: it is the gap between the pitch and the product.

1. **A live, populated city.** BETA shows a Friday night mid-flow. RAW launches empty. The
   cold-start problem is not addressed anywhere in RAW.
2. **Trending, crew-going, waitlist.** All three are visible in BETA and all three are dead in
   RAW — two because migration 014 never applied, one because the client binds an old
   `nearby_moves` overload that does not return `crew_going` or `hot_score`.
3. **Push notifications.** BETA shows iOS-style push banners. RAW registers no push token
   anywhere, so every notification in the product is a no-op.
4. **"Just Us" and "The Scene".** Front and centre in the demo; not in RAW's category enum.
5. **Real addresses.** BETA shows a street address per move and hides it for private ones.
   RAW pins every created move to downtown Pittsburgh regardless of the address typed.
6. **Friends on the map.** BETA shows friend avatars at real positions. RAW has no
   friend-location feature and no follow graph beyond counters on `profiles`.

**Recommendation:** treat BETA as the spec. It is the more coherent product and it is the one
being shown to people. The reconciliation order that buys the most is:
(1) apply the token system to RAW, (2) add the two categories, (3) make 014 actually apply and
collapse the `nearby_moves` overloads, (4) decide about push.
