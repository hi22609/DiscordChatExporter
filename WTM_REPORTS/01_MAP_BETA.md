# 01 — CARTOGRAPHY: BETA (`beta/`)

Single-file app, zero runtime dependencies, plus a landing shell. Unlike RAW, **this one was
actually driven in a browser** — headless Chromium via `beta/tools/`.

## Surface

`beta/wtm-beta.html` is a 5-screen SPA switched by `goScreen()`; `beta/wtm-share-shell.html`
is the landing page that embeds it.

| Screen | Purpose | Verified in browser |
|---|---|---|
| `#scr-welcome` | Wordmark, tagline, vibe picker, entry | yes |
| `#scr-moves` | Live ticker, stories, search, category chips, feed | yes — 8 cards render |
| `#scr-map` | Full-bleed canvas map of the Pittsburgh metro | yes — pan/zoom/tap |
| `#scr-friends` | Online strip + friend list | yes |
| `#scr-profile` | Streak, badges, stats, your moves, activity | yes |
| Bottom sheet | Move detail, host, vibe meter, who's going, chat | yes — opens, 8 attendee avatars |
| Story viewer | Full-screen, auto-advancing progress | yes |
| Notification panel | Slide-down list | yes |
| Create panel | Drop a move | yes — feed goes 8 → 9 cards |

## Features

| Feature | State |
|---|---|
| Live simulation engine | **WORKING** — ~5s tick: people join, chats land, reactions climb, push banners |
| Canvas map | **WORKING** — real geography, LOD zoom, collision-declutter, ~25× zoom range |
| RSVP (4 states) | **WORKING** — open / going / full→waitlist / waitlisted |
| Stories | **WORKING** — progress bars, tap navigation, deep-link to the move |
| Group chat | **WORKING** — send, plus simulated inbound |
| Search + category filter | **WORKING** — verified: "rooftop" → 2 cards |
| Create a move | **WORKING** — verified: appends and confetti fires |
| Feedback capture | **WORKING** — rating, tags, notes, report generation |
| Founder log | **WORKING** — `#log` or 5 taps on the footer wordmark |
| Reports reaching Michael | **BY DESIGN, NOT AUTOMATIC** — see below |

## Data

All in-memory constants: `MOVES` (8), `FRIENDS_LIST` (5), `STORIES` (4), `NOTIFS`, `MSGS`,
plus hand-authored Pittsburgh geography (rivers, 13 bridges, road classes, parks,
neighbourhoods, metro towns). No persistence except `localStorage['wtm-feedback']`.

## Backend

**None.** No network calls of any kind. This is why the FAQ's "does it track me" answer is
truthful rather than reassuring.

## Flow

Direct DOM re-render on state change (`buildFeed()`, `openSheet()`). The map runs a
single-flight `requestAnimationFrame` loop. No cache, so no staleness.

## Dependencies and bill risk

**Zero.** One dev-only dependency (`playwright-core`) that never ships. Fonts are inlined.
**Nothing here can generate a bill.**

---

# THE JOURNEY — walked in a browser

Driven end-to-end at 1440 / 768 / 375 in both themes. Screenshots in `screenshots/`.

1. **Land on the share page.** Left-aligned hero, no fake metrics, one CTA. **Fixed tonight:**
   the page previously opened with "137 people locked in · 8 moves live · 4 friends out
   tonight" — invented numbers a skeptical stranger checks first.
2. **"Open the demo"** → on a phone this now goes fullscreen rather than into a
   thumbnail-sized phone mock. Desktop keeps the mock.
3. **Welcome → "See what's up"** → feed. Simulation starts.
4. **Feed.** Trending / Tonight sections, friends-going row on each card, working reactions.
5. **Tap a card** → sheet with host, address, vibe meter, who's going, live chat.
6. **Map tab.** Full-bleed. Real rivers meeting at the Point, real bridges, street names,
   neighbourhoods, friend avatars, heat over the actual nightlife strips.
   **Three bugs fixed tonight:** `calc()` missing whitespace made four rules invalid (the
   hint and zoom controls were pinned to the top, over the header); an ID rule collapsed the
   map screen to 318px of an 790px viewport; and every zoom tap spawned another 60fps render
   loop (209 concurrent loops after 8 taps).
7. **Zoom out** → the whole metro, Cranberry to McKeesport, with the airport and county parks.
8. **Feedback** → rating, tags, note, name → a written report with one-tap email or text.

**Where it still falls short:** the report reaches Michael only if the tester actually taps
send. There is no server, and claude.ai artifacts block outbound network, so this cannot be
automatic. That is a genuine limitation, stated in `DECISIONS_FOR_MICHAEL.md` with the two
free options for fixing it.
