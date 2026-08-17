# 02 — AUDIT


> **Dated snapshot — 2026-08-12.** Parts of this have since been overtaken. `STATE.md` is the current picture; where the two disagree, STATE.md is right.

> Specifically: the headline below is answered. The database has since been run — 19
> migrations apply clean and 41 assertions pass. See `07_VERIFICATION.md`.

Adversarial pass over both builds. Every finding carries `file:line`, a concrete failure
scenario, and a free-tier fix. Findings I personally re-verified are marked **[V]**.

## Severity counts

| Severity | RAW | BETA | Total |
|---|---|---|---|
| CRITICAL | 9 | 0 | **9** |
| HIGH | 10 | 3 | **13** |
| MEDIUM | 11 | 5 | **16** |
| LOW | 4 | 3 | **7** |

**The headline: RAW's database has never been run.** Migrations 011 and 014 contain hard SQL
errors that abort them (C8, verified below). Everything after 010 — the ban filter, squad
RSVPs, hot score, activity feed, move chat, waitlist, reactions — is absent from any database
those migrations were pushed to, while the client code calls all of it.

---

# RAW — CRITICAL

### C1. `moves_with_counts` view bypasses RLS — every private move is world-readable
`wtm/supabase/migrations/004_moves.sql:90`

Created without `security_invoker = on`, so it runs as its owner (BYPASSRLS) and ignores the
`moves`/`rsvps` policies. Supabase grants `SELECT` on new public views to `anon`.

**Failure:** with the anon key that ships inside the app bundle,
`GET /rest/v1/moves_with_counts?select=*` returns every move including `is_public = false` rows
and their exact `location_point`. `useMove.ts:15` already queries the view by id, so
`?id=eq.<guessed uuid>` is the app's own code path pointed at private data.

**Fix:** `alter view public.moves_with_counts set (security_invoker = on);` — same for
`move_reaction_counts` (`014:108`). **Applied in migration 015.**

### C2. Every user's push token, birthdate and social handle are world-readable
`wtm/supabase/migrations/002_auth_profiles.sql:55`

`create policy "profiles_public_read" ... using (true)` — no role restriction, no column
restriction. Migration `011:9` later adds `birthdate`, `social_handle`, `is_banned` to the same
table, so those become public too.

**Failure:** `GET /rest/v1/profiles?select=push_token,birthdate,social_handle` with the anon key
dumps the roster. Expo's push endpoint needs no auth for a token you hold, so a harvested set
lets anyone push notifications to the entire install base under WTM's icon. This is a
17–25 product; the harvested tuple is birthdate + Instagram handle + push token.

**Fix:** restrict the base policy to `auth.uid() = id`; expose a `public_profiles` view with
only the safe columns. **Applied in migration 015.**

### C3. Any user can un-ban themselves
`wtm/supabase/migrations/002_auth_profiles.sql:58` + `011_squad_safety.sql:12`

`profiles_owner_update` is `using (auth.uid() = id)` with **no `WITH CHECK` and no column
restriction**. The moderation flags live on that row.

**Failure:** a banned user sends `PATCH /rest/v1/profiles?id=eq.<self>` with
`{"is_banned": false}`. Ban lifted. They can also rewrite `moves_created`, `referral_code`, and
`invited_by` — repointing their invite chain at an innocent member, whom `flag_inviter_on_ban`
(`011:38`) then auto-reports.

**Fix:** column-level `REVOKE UPDATE` on the moderation/counter columns. Checked independently
of RLS, costs nothing. **Applied in migration 015.**

### C4. `send-push-notification` has no authorization and holds the service-role key
`wtm/supabase/functions/send-push-notification/index.ts:25`

Goes from `OPTIONS` straight to `req.json()`. No admin secret, no check that the caller is the
actor. `useRSVP.ts:41` invokes it from the client, so the anon key that satisfies the default
gate is in every attacker's hands.

**Cost failure — this is the Railway-bill shape.** A loop at 50 req/s from Friday to Monday is
~13M edge invocations against a 500K/month allowance, 39M service-role DB round trips, and 13M
push notifications delivered to a real person.

**Fix:** the function is redundant — `notify_rsvp_to_creator` (`012:79`) already writes the
activity row database-side. **Deleted, along with the client invoke.**

### C5. `generate-invite-codes` accepts `Bearer undefined`, and `count` is unbounded
`wtm/supabase/functions/generate-invite-codes/index.ts:25,29`

`authHeader !== \`Bearer ${Deno.env.get('ADMIN_SECRET')}\`` — if the secret was never set
(`DEPLOYMENT.md:35` makes it a manual step), the comparison string is the literal
`"Bearer undefined"` and anyone sending exactly that is admitted with the service-role key.
`const { count = 10 }` is never validated before `Array.from({ length: count })`.

**Failure:** `-H 'Authorization: Bearer undefined' -d '{"count":50000000,"maxUses":999999}'` —
either the isolate OOMs or 50M rows fill the 500MB free-tier database, and an unlimited-use
invite code voids the invite-only model entirely.

**Fix:** fail closed when the secret is unset; clamp `count` to 1–100 and `maxUses` to ≤50.
**Applied.**

### C6. The invite-only gate is client-side only
`wtm/app/(auth)/sign-up.tsx:66` + `wtm/supabase/migrations/007_referrals.sql:57`

`handle_new_user` reads `invite_code_id` from attacker-controlled `raw_user_meta_data`, and
`if v_code_id is not null` means a **missing** code is simply skipped. Profile and a fresh
5-use invite code are minted anyway.

**Failure:** a direct `POST /auth/v1/signup` with the bundled anon key and no code creates a
full member account. The invite screen is decoration. Every bot account counts toward Supabase
MAU billing past 50K.

**Fix:** raise in the trigger when no code was actually burned. **Applied in migration 015.**

### C7. Public storage buckets, caller-controlled paths, `upsert: true`, full-resolution uploads
`wtm/src/lib/storage.ts:22`, `wtm/app/(tabs)/create.tsx:85`, `wtm/src/components/moves/MoveCard.tsx:67`

No migration touches `storage.objects`; `README.md:162` tells the operator to create the
buckets **public** by hand. `uploadImage` takes `path` from the caller with `upsert: true`.

**Failure:** any member overwrites any other member's avatar or any move's cover.
**Cost:** `ImagePicker` runs at `quality: 0.8` with no `maxWidth` and `config.toml:21` allows
50 MiB. A phone photo is 2–4 MB, rendered into a 164px feed card. Twenty cards on a cold cache
= ~60 MB egress. Free tier is 5 GB/month — roughly 80 feed scrolls city-wide before overage.

**Fix:** storage policy deriving the path from `auth.uid()`, drop `upsert`, resize to 1200px
before upload, serve covers through Supabase's `?width=400` transform.
**Documented — not applied** (needs the buckets to exist; see `DECISIONS_FOR_MICHAEL.md`).

### C8. Migrations 011 and 014 cannot apply — **[V] I verified this myself**
`wtm/supabase/migrations/011_squad_safety.sql`, `014_waitlist_reactions_crew.sql`

| Location | Error | My verification |
|---|---|---|
| `011:121` | `blocked_either(uid, m.creator_id)` — 2 args | **[V]** `010:27` defines `blocked_either(other_user uuid)` — one arg |
| `014:9` | `check (status in ('going','waitlist','left'))` on an enum column | **[V]** `005:1` = `enum ('going','maybe','left')`. `'waitlist'` is not a member |
| `014:148` | `create or replace` renames param `uid`→`caller_id` (error 42P13) | **[V]** `011:64` and `014:148` both define `nearby_moves` with differing parameter names |
| `011:117` | `m.category = filter_category` — enum vs text, no operator | Reported by audit track |
| `011:100` | `max(r.status)` — no `max()` for the enum | Reported by audit track |

**Consequence:** either these were never deployed (so the whole post-010 feature set is
missing while the client calls it), or someone hand-patched the live database and the repo no
longer describes production. **Establish which before anything else.**

**Fix:** repaired in migration 015 + edits to 011/014. `'waitlist'` requires
`alter type ... add value` in its own migration, not a CHECK constraint.

### C9. Google Places key in the client bundle — and nothing uses it
`wtm/.env.example:7`

`EXPO_PUBLIC_` inlines the literal into the JS bundle at build time; anyone can `unzip` the APK.
Google Places bills per request and GCP does not cap spend by default — the classic source of
surprise five-figure bills. Grep finds **zero** Places calls anywhere.

**Fix:** deleted the variable. **Applied.** (`GOOGLE_MAPS_API_KEY` is a native SDK key and is
fine, but must be restricted by bundle ID / SHA-1 in the Google console — see decisions.)

---

# RAW — HIGH

| # | Where | What | Fix | Status |
|---|---|---|---|---|
| H1 | `012:126`, `useActivity.ts:77` | `mark_activity_read(uid)` is SECURITY DEFINER, takes the target id as an argument, never compares to `auth.uid()`. Clears anyone's notifications. | Drop the param, use `auth.uid()` | **Fixed (015)** |
| H2 | `011:128,143` | `drop policy if exists "moves_insert"` — the real names are `moves_authenticated_insert` (`004:80`) / `moves_public_read` (`004:77`). `if exists` swallows the typo, so the ban + 24h cooldown policies are OR-ed with the still-present permissive ones and add **nothing**. Banned users create moves normally. | Convert to `as restrictive` so they AND | **Fixed (015)** |
| H3 | 18 functions incl. `004:145`, `013:72`, `014:14` | SECURITY DEFINER with mutable `search_path`, several referencing tables unqualified | `set search_path = ''` + qualify | **Fixed (015)** |
| H4 | `007:21`, `validate-invite/index.ts` | Invite codes are `MOVE`+4 chars from a 32-symbol alphabet = 1.05M keyspace, fixed published prefix. Validator is unauthenticated and unthrottled: whole space enumerable in ~90 min at 200 req/s, which is also 1M+ edge invocations (2× the free allowance) in one night. | 8 chars via `gen_random_bytes` + attempt throttle | **Fixed (015)** |
| H5 | `011:5`, `012:101` | `rsvps.squad_with uuid[]` has no length check despite a comment saying "up to 2". `notify_squad_members` inserts one `activity_feed` row per element; the `on conflict do nothing` is inert (no unique constraint). One RSVP with 500k UUIDs = 500k rows. | `check (array_length <= 2)` + real unique index | **Fixed (015)** |
| H6 | `useMoveChat.ts:29,40,58` | `staleTime: 0` + invalidate on every realtime INSERT + a second invalidate in `onSettled`. Invalidating an infinite query refetches **all** loaded pages. 40-person move, 5 pages, 3 msg/min ≈ 6,000 joined queries per 10 minutes. | `setQueryData` append instead of invalidate | **Fixed** |
| H7 | `app/(tabs)/index.tsx:66,99` | Map RPC fired straight into `useState` on every pan — no cache, no dedupe. `radiusM` uncapped, so zooming out degrades `ST_DWithin` toward a full scan. ~100 uncached RPCs in two minutes of idle panning. | Clamp radius; cache by rounded region | **Fixed** |
| H8 | `package.json:53` | `zod`, `react-hook-form`, `@hookform/resolvers` installed and **never imported**. No validation at any mutation boundary. `moves.description` / `spots.description` have no length constraint — a member can store a 100 MB description. | Length checks in SQL (the real fix) | **Fixed (015)** |
| H9 | `013:27` | `move_messages` has SELECT + INSERT policies only. Under RLS, absent = deny, so **no one can ever delete a message** — not the author, not the move creator. App Store 1.2 requires UGC removal; this is a rejection. | Add DELETE policy | **Fixed (015)** |
| H10 | `009:111` | `enforce_daily_limit` covers only `moves` and `spots`. Unlimited: rsvps, messages, reactions, reports, blocks. Each `rsvps` insert fires 4 triggers incl. a hot-score aggregate + `UPDATE moves`; 100/s = 400 trigger runs/s on shared free-tier CPU. | Extend the dispatch | **Fixed (015)** |

# RAW — MEDIUM (selected)

| # | Where | What | Status |
|---|---|---|---|
| M1 | `useActivity.ts:65` | `refetchInterval: 60_000` on a count query that is already covered by the realtime subscription 15 lines above. 60k redundant queries/day at 2k users. | **Fixed** |
| M2 | `MoveCard.tsx:61` | Prefetch on `onPressIn` — fires on the finger-down that becomes a *scroll*. Two requests each. Flicking 40 cards = ~80 wasted round trips. | **Fixed** |
| M3 | `012:64`, `013:11`, `014:92`, `008:50` | 8 foreign keys with `on delete cascade` and **no index** — deleting one account sequentially scans seven tables | **Fixed (015)** |
| M4 | `003:14`, `005:13`, `014:99` | Three fully redundant indexes duplicating a unique constraint or a PK prefix; pure write amplification | **Fixed (015)** |
| M5 | `012:8` | `moves.hot_score` is the feed's ORDER BY key and has no index | **Fixed (015)** |
| M6 | `008:160` | `nearby_spots` orders by `fire_count` with no index | **Fixed (015)** |
| M7 | `014:249` | `nearby_moves` has no LIMIT and runs a correlated subquery per row | **Fixed (015)** |
| M8 | `014:27` | `promote_from_waitlist(uuid)` is SECURITY DEFINER and directly callable by any client; unconditionally sets someone else's RSVP to `going` | **Fixed (015)** |
| M9 | `verify-age.tsx:42`, `011:17` | Age gate is client-side; `set_age_range` returns early when `birthdate is null` and nothing requires it. For a 17–25 restricted product this is *the* compliance control. | **Documented** — needs product decision |
| M10 | — | `push_token` is **never written**. No `getExpoPushToken` call exists anywhere. The whole notification stack is dead code, and `daily-digest` always returns `sent: 0`. | **Documented** |
| M11 | `daily-digest/index.ts:86` | No `.limit()`, so PostgREST silently truncates recipients at 1000; also calls an `nearby_moves` signature that does not exist post-C8 | **Documented** |

# RAW — LOW
`L1` malformed body → unhandled rejection (`generate-invite-codes:29`) · `L2` `Access-Control-Allow-Origin: '*'` on an admin endpoint · `L3` `log.error` writes to console in production, carrying query fragments (`src/lib/log.ts:15`) · `L4` dead `const qc = useAuthStore.getState;` (`useMoveChat.ts:10`)

---

# BETA

BETA has no backend, no auth, no network calls and no secrets, so tracks C and D are largely
not applicable. Track A (slop) and E (a11y) are where it lives.

| # | Sev | Where | What | Status |
|---|---|---|---|---|
| B1 | HIGH | shell (old) hero + stats strip | **Invented statistics presented as live metrics**: "137 people locked in", "8 moves live", "4 friends out tonight", "3 rivers, 1 city". A skeptical stranger checks these. | **Deleted** (not rewritten) |
| B2 | HIGH | `wtm-beta.html` `:194,196,261,350` | `calc(var(--tab-h)+var(--safe-b)+18px)` — CSS `calc()` **requires whitespace around `+`**. All four declarations were invalid and silently dropped, pinning the map hint and zoom controls to the top of the screen over the header, and mispositioning the FAB and toast. | **Fixed** |
| B3 | HIGH | `#scr-map` | ID rule set `position:relative`, overriding `.scr`'s `absolute;inset:0`, so the map screen shrink-wrapped to 318px of an 790px viewport and the canvas collapsed to its 150px default | **Fixed** |
| B4 | MED | whole file | Four competing accent hues (`--violet`, `--blaze`, `--scene`, `--justu`) plus `--cyan`. Nothing could be emphatic. | **Fixed** — one accent |
| B5 | MED | 19 distinct `border-radius` values | Radius applied ad hoc rather than by element class | **Fixed** — two |
| B6 | MED | tab bar, topbar, feature cards | Emoji standing in for iconography (🔥🗺👥👤🔔) | **Fixed** — SVG icons |
| B7 | MED | landing shell | Four consecutive sections with identical eyebrow→h2→sub→grid rhythm at identical `padding:86px` | **Fixed** — restructured |
| B8 | MED | `wtm-share.html` | Generated 144 KB artifact was committed as if it were source | **Fixed** — gitignored, built by `beta/build.js` |
| B9 | LOW | feedback modal | No `Escape` handler, no focus management, `aria-pressed` absent on toggle chips | **Fixed** |
| B10 | LOW | inputs | `font-size:15px` on inputs triggers iOS auto-zoom on focus | **Fixed** — 16px |
| B11 | LOW | `.rsvp`, `.chip` | Several touch targets under the 44px minimum | **Partly fixed** — see 06 |
