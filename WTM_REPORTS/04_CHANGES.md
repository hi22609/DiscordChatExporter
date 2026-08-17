# 04 — CHANGES


> **Dated snapshot — 2026-08-12.** Parts of this have since been overtaken. `STATE.md` is the current picture; where the two disagree, STATE.md is right.

Every change, what it fixes, how it was verified, and what it might have broken.
Five commits on `overnight/2026-08-12`.

## `022e9d9` — Rescue BETA into version control

| | |
|---|---|
| **What** | Copied `wtm-beta.html` + `wtm-share-shell.html` out of an ephemeral `/tmp` scratchpad into `beta/`. Added `build.js`, `package.json`, README, and the Playwright tools. |
| **Why** | The demo was not in git. A container reclaim would have destroyed it permanently. |
| **Verified** | `node beta/build.js` → "round-trip verified". The build re-parses the embedded copy and exits non-zero if it does not match byte-for-byte. |
| **Risk** | None. Additive. |

## `186e8f7` — Typecheck to zero, and the bugs it was hiding

| Change | Verified | Risk |
|---|---|---|
| All row types in `database.ts` `interface` → `type` | `tsc` 72 → 0 | None. Type-level only. |
| Added `Relationships` to `moves_with_counts` | `tsc` | None |
| Added 4 tables, 1 view, 3 RPCs (migrations 012–014 drift) | `tsc` | None |
| Reconciled `ProfileRow` with migration 011 | `tsc` | None |
| `tsconfig` excludes `supabase/functions` (Deno) | `tsc` | Edge functions are no longer typechecked at all — acceptable, they need a Deno toolchain |
| **`useMoveChat` `.catch()` on a thenable** | `tsc` TS2551 before, clean after | **Behaviour change**: errors now log instead of throwing. Previously it crashed the screen, so this is strictly better. |
| **`MoveCard` duplicate `style` prop** | `tsc` TS17001 before, clean after | Venue name changes from black-on-black to grey. Intended. |
| Added `waitlist_promoted` copy | `tsc` exhaustiveness | None |
| Unread badge effect now depends on `unread` | reasoned | Marks read on the first non-zero count instead of never. Guarded by a ref so it fires once. |
| `onEndReached` wrapped | `tsc` | Stops forwarding `{distanceFromEnd}` as query options |
| **NativeWind wired into Metro** | `tsc` (10 `className` errors gone) | **[UNVERIFIED-RUNTIME]** Cannot confirm styles actually apply without running the app. If it misbehaves, delete `metro.config.js` and the 3 `className` components revert to unstyled — which is where they already were. |
| **Age gate computes real age** | reasoned + arithmetic | **Behaviour change**: signup now asks one extra question. Deliberate — the old flow admitted 16-year-olds. |

## `7805f84` — Migrations repaired, cost and exposure closed

| Change | Verified | Risk |
|---|---|---|
| `blocked_either` 2 args → 1 | **[V]** read `010:27` — one arg | None |
| `'waitlist'` moved from CHECK to `014a` enum addition | **[V]** read `005:1` enum members | Ordering: `014a` must run before `014` |
| `nearby_moves` param rename reverted to `uid` | **[V]** compared `011:64` / `014:148` | None |
| enum-vs-text and `max(enum)` fixes | reasoned from `010:98`'s working version | None |
| 011's ban policies → `RESTRICTIVE` | reasoned | **Caught during review**: as first written, the restrictive SELECT repeated `is_public = true`, which would have locked creators out of their own private moves. Narrowed to carry only the ban check. |
| `security_invoker` on both views | reasoned | **Possible** — anything relying on the views bypassing RLS will now see fewer rows. That is the point. |
| Column-level UPDATE grants on `profiles` | reasoned | UPDATE-only, cannot affect reads. `birthdate` included so the age gate still writes. |
| `handle_new_user` requires an invite | reasoned | **Behaviour change**: signup without a valid code now fails. Intended. |
| `mark_activity_read()` drops its argument | `tsc` + call site updated | Signature change — the one caller was updated |
| `promote_from_waitlist` revoked from clients | reasoned | Only ever called from its trigger |
| `search_path` pinned on all definer functions | reasoned | None |
| `squad_with` capped at 2 | reasoned | Any existing row with >2 would block the constraint. No live DB, so no data to conflict. |
| Description length caps | reasoned | Same |
| `move_messages` DELETE policy | reasoned | Adds capability only |
| 8 FK indexes + 2 sort indexes added, 3 redundant dropped | reasoned | Slightly more write cost, much less read cost |
| **Deleted `send-push-notification`** | grep — one call site, removed | **[UNVERIFIED-RUNTIME]** The trigger at `012:79` already writes the activity row. Push was dead anyway (no token is ever registered). |
| `generate-invite-codes` fails closed + clamps | reasoned | If `ADMIN_SECRET` is unset the function now returns 401 instead of admitting anyone |
| Removed unused Places key from `.env.example` | grep — zero usages | None |
| Removed the 60s unread poll | reasoned | Relies on the realtime subscription 15 lines above |
| Chat: `setQueryData` append instead of invalidate | `tsc` | **[UNVERIFIED-RUNTIME]** If the realtime payload shape differs from `ChatMessage`, a message could render without its profile join until the next refetch. Guarded against duplicates by id. |
| Map radius capped at 50 km | reasoned | Zooming out past 50 km stops widening the query — it was returning nothing actionable anyway |
| Card prefetch moved to `onPress` | reasoned | **Caught during review**: my first edit produced a duplicate `onPress` prop — the same bug class I had just fixed in `MoveCard`. Corrected before commit. |

### Deliberately not done — cascade risk
- **`profiles` read policy (audit C2).** Restricting it breaks `user/[id]`, the chat's
  embedded profile join, and `useSession`'s `select('*')`. PostgREST cannot embed a
  replacement view across a FK without extra setup. Needs a live database to verify. Full SQL
  and client changes are in `DECISIONS_FOR_MICHAEL.md`.
- **Unique index on `activity_feed`.** Would have made `on conflict do nothing` work — but
  `notify_creator_on_rsvp` (`012:86`) inserts *without* an on-conflict clause, so it would
  abort the whole RSVP transaction on a normal leave-then-rejoin, and would permanently
  swallow legitimate repeat notifications. The array cap is the real fix.

## `cb864a0` — BETA visual identity

Detailed in `03_VISUAL_IDENTITY.md`. Summary of risk: this is a large rewrite of the landing
shell and a systematic token sweep of the app. Mitigated by the Playwright regression
(`tools/test-flow.js`) passing with zero console errors after every step, plus a font-loading
check and screenshots at three viewports in both themes.

**One self-caught error:** my first token pass claimed WCAG numbers I had estimated rather
than computed. Computing them showed `--paper-600` at **2.96** (failing even large text) and
the light-theme accent at **4.15** (failing AA). Both were re-derived until they passed, and
the report now carries measured values.

## `[this commit]` — Reports

Documentation only.
