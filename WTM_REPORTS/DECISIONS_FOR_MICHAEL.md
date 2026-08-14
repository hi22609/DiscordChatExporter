# DECISIONS FOR MICHAEL

Things I could not decide for you. Ordered by what blocks the most.

---

## 0. The map cannot reach Snap Map parity inside a claude.ai artifact

**Blocks:** the demo's single most-judged screen. **Cost:** zero either way.

Snap Map is **Mapbox vector tiles with a custom Snap style**. They do not draw roads;
they license a tile service and skin it. Every street, building, park and label in the
world arrives as data. A hand-authored canvas map cannot compete with that and never will,
because I am typing coordinates for about forty roads.

The free equivalent of what Snap pays for is **MapLibre GL + OpenFreeMap**: OpenStreetMap
vector tiles, no API key, no signup, no bill, no rate limit. Built and committed as
`beta/map-real.html`, styled to the WTM palette, with the move pins, friend heads, heat
layer and sheet already wired.

**The blocker is not the map, it is where the demo is hosted.** claude.ai artifacts run
under a CSP that blocks every external host, so tiles can never load there. That is why
the shared link still uses the canvas map.

| Option | Result |
|---|---|
| Keep the demo on claude.ai | Canvas map forever. No amount of work changes this. |
| **Host `beta/dist/` on Cloudflare Pages (free)** | **Real vector map, Snap-grade.** Also fixes decision 3, since the page can then POST feedback to you. **Recommended.** |

For RAW, the same answer in native form: `@rnmapbox/maps` or MapLibre React Native
against the same free tile source, replacing `react-native-maps`.

**[UNVERIFIED]** I could not render `map-real.html` here: this container's network policy
blocks every tile host and CDN (only package registries are allowed). I verified the
*failure* path only, which now shows an honest message instead of a blank screen. Open it
on a normal connection to see the map itself.

---

## 1. The database was never deployed. Now it runs. — ANSWERED, nothing for you to decide

This was the biggest open question in the project. It is closed.

I installed Postgres 16 and PostGIS locally and applied the migrations. **Seven of sixteen
failed on a clean database**, each one a hard stop. That settles it: nothing after migration
004 — ban enforcement, squad RSVPs, hot score, activity feed, move chat, waitlist, reactions —
has ever existed in any database, while the client has been calling all of it.

All eighteen now apply with zero errors, and 33 behavioural assertions pass. Full detail in
`07_VERIFICATION.md`. The harness is committed at `wtm/supabase/tests/run.sh`, so you can
re-run it yourself:

```
sudo apt-get install -y postgresql-16 postgresql-16-postgis-3
cd wtm && supabase/tests/run.sh
```

Three bugs surfaced that reading the SQL had not found — including one I had introduced
earlier the same night that broke sign-up for every user, and a revoke in the security
hardening that silently did nothing. Those are described in `07_VERIFICATION.md`.

**What this means for you:** when you do provision a Supabase project, `supabase db push`
should now go green on the first try instead of dying at 004. Nothing here costs money and
nothing here touched a hosted service.

**Cost:** zero.

---

## 2. `profiles` published every user's push token, birthdate and Instagram handle — FIXED

**Was:** the most serious exposure in the product. **Cost:** zero.

`profiles_public_read` was `using (true)` — no role restriction, no column restriction. Anyone
with the anon key (which ships inside the app bundle) could read the whole table. For a 17-25
app that is birthdate + social handle + push token per user.

I left it alone the first night because every safe repair breaks a read the client depends on
and there was no database to verify a fix against. Decision 1 removed that blocker, so it is
now done, in `019_profiles_exposure.sql`:

- `profiles` is own-row-only. Your own `select('*')` still works, which is what the age gate
  in `app/_layout.tsx` routes on.
- `public_profiles` exposes the ten columns another member is allowed to see, and filters
  banned accounts so no caller can forget to. `user/[id].tsx` and `useSearchUsers.ts` point
  at it.
- Chat moved off the `profiles(...)` embed to a `move_chat_page` function. PostgREST resolves
  embeds through RLS, so the embed would have rendered every message but your own with a
  blank author.

Verified as a real member under RLS rather than as superuser: one row of `profiles` visible,
zero rows of anyone else's, all non-banned members through the view, no private column in it,
a banned member gone from it, chat readable by attendees with author names attached and
invisible to everyone else.

**Push tokens were the part that mattered most.** Expo's push endpoint needs no auth for a
token you already hold, so a world-readable token column meant anyone could push a
notification to your entire install base under your icon. That is closed now — but see
decision 4: nothing writes tokens yet either.

---

## 3. Feedback from the demo does not reach you automatically

**Blocks:** knowing what testers think. **Cost:** zero either way.

claude.ai artifacts block all outbound network, so a page hosted there physically cannot send
you anything. Right now a tester writes a report and taps **Email it** or **Text it**, and it
lands in your inbox — but only if they actually tap send.

| Option | Effort | Trade-off |
|---|---|---|
| **Leave as is** | none | Highest-intent testers still reach you. Silent drop-off is invisible. |
| **Google Form** | ~5 min, your account | Every response auto-lands in a Sheet you own. Costs the in-app feel. |
| **Host `dist/wtm-share.html` on Netlify/Cloudflare Pages free tier** | ~15 min | No CSP restriction, so the page can POST to a free form endpoint. You also stop depending on claude.ai links. **My recommendation.** |

I did not create any account, because they would be under your email.

---

## 4. Push notifications are entirely dead code

**Cost:** zero to fix. `expo-notifications` is installed and configured; `profiles.push_token`
exists; two edge functions read it. **Nothing ever writes it** — `getExpoPushTokenAsync`
appears nowhere in the codebase. Every notification in the product is a silent no-op.

**Decide:** wire it up (a ~40-line hook, after decision 2), or remove the dependency, the
plugin, the column and `daily-digest` and stop carrying dead weight. Do not leave it as is.

---

## 5. BETA promises six things RAW cannot deliver — two of the six are now fixed

Detailed in `01_DRIFT.md`. The two that would have bitten in a demo-to-signup conversation
are closed:

- **"Just Us" and "The Scene"** — the categories the entire demo is built around — were not
  in RAW's `move_category` enum. Added in `017_category_parity.sql`, and added to
  `CATEGORY_META`, which the picker and the filter bar both derive from.
- **Trending, crew-going and waitlist** were visible in BETA and dead in RAW. I confirmed the
  cause live: two `nearby_moves` overloads existed at once, and because PostgREST binds RPC
  arguments by name, every call in the app bound the older one, which returns none of those
  three columns. Nothing in the client was wrong. It was calling a function that could not
  answer. Collapsed to one signature in `016`, and the feed now returns `hot_score`,
  `waitlist_count` and the friends row — verified against real data.

The remaining four drift items still stand. **Recommendation:** treat BETA as the spec. It is
the more coherent product.

---

## 6. Every move created in RAW is pinned to downtown Pittsburgh

`app/(tabs)/create.tsx:107` falls back to `40.4406,-79.9959` whenever the coordinates are not
prefilled — which is every time except arriving from a Spot. There is no map picker and no
geocoding, so a move called "Rooftop at 5th & Penn" is stored at the Point, and every
distance and radius filter is wrong for every attendee.

**Options:** geocode the address on blur with `Location.geocodeAsync` (already a dependency,
free), or use the creator's current GPS. Either way, block submit when nothing resolves.
I did not pick because it is a product call about how much friction to add to posting.

**Cost:** zero.

---

## 7. Small things I'd have done with another hour

| Thing | Command / effort |
|---|---|
| Commit a lockfile | `cd wtm && npm install && git add package-lock.json`. Without it, installs are not reproducible — this bit me in the clean-clone check tonight. |
| Delete orphaned code | `git rm wtm/src/components/ui/Button.tsx wtm/src/hooks/useSearchUsers.ts` — 131 lines nothing imports. `Button.tsx` cannot work anyway. |
| Fill the EAS placeholders | `app.json` and `eas.json` still say `YOUR_EAS_PROJECT_ID`, `YOUR_APPLE_ID`. Every build/submit script fails immediately. |
| Rename `crew`/`squad` → `friends` | You rejected "crew" for BETA, but `crew_going`, `squad_with` and `squad_confirmed` are still in RAW's schema and UI. |
| Rate-limit `validate-invite` | Currently an unauthenticated oracle over a 1M keyspace; ~90 minutes to enumerate every live code, which is also 1M+ edge invocations. |

---

## 8. Nothing was spent, and nothing can start spending

No account was created, no service enabled, no key issued, no deploy made. The only key that
was reaching clients (`EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`) was unused and is removed.

The three clearest paths to an unattended bill are closed: the unauthenticated push function
that held the service-role key is deleted, the invite generator no longer admits
`Bearer undefined` or unbounded batch sizes, and the 60-second per-user poll is gone.
