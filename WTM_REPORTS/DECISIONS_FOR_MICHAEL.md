# DECISIONS FOR MICHAEL

Things I could not decide for you. Ordered by what blocks the most.

---

## 1. Was the database ever actually deployed?

**Blocks:** every other RAW decision.

Migrations 011 and 014 contain SQL that **cannot execute** (verified: `blocked_either` is
declared with one argument at `010:27` and called with two at `011:121`; `'waitlist'` is not a
member of the `rsvp_status` enum). So one of two things is true:

- **(a) They were never pushed.** Then everything after migration 010 — ban enforcement, squad
  RSVPs, hot score, activity feed, move chat, waitlist, reactions — has never existed in any
  database, and the client has been calling all of it. This is the likely case.
- **(b) Someone hand-patched a live database.** Then the repo does not describe production and
  nothing in `02_AUDIT.md` can be trusted about the real schema.

**Recommendation:** run `npx supabase db reset` locally and see what happens. My repairs are
committed but **have never been executed against a real Postgres.**

**Cost:** zero.

---

## 2. The `profiles` table publishes every user's push token, birthdate and Instagram handle

**Blocks:** any public launch. **Cost:** zero. **I did not fix this, on purpose.**

`profiles_public_read` is `using (true)` — no role restriction, no column restriction. Anyone
with the anon key (which ships inside the app bundle) can read the whole table. For a 17–25
app that is birthdate + social handle + push token per user.

I did not change it because every safe repair breaks working code and I could not verify a fix
without a database:
- `app/user/[id].tsx:78` reads another member's profile
- `useMoveChat.ts:21` embeds `profiles(...)` to label chat messages
- `useSession.ts:34` uses `select('*')`, which needs whole-table SELECT

**The fix, when you have a database to test against:**
```sql
drop policy "profiles_public_read" on public.profiles;
create policy "profiles_read_own" on public.profiles for select using (auth.uid() = id);

create view public.public_profiles with (security_invoker = on) as
  select id, username, display_name, avatar_url, bio, city, created_at from public.profiles;
grant select on public.public_profiles to anon, authenticated;
```
Then: point `user/[id].tsx` and `useSearchUsers.ts` at `public_profiles`, change
`useSession.ts` to an explicit column list, and either declare a computed relationship for the
chat embed or denormalise `username`/`avatar_url` onto `move_messages` at insert time.

**Do this before registering any push tokens.** Tokens in a world-readable table are worse
than no tokens: Expo's push endpoint needs no auth for a token you hold, so anyone could push
to your entire install base under your icon.

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

## 5. BETA promises six things RAW cannot deliver

Detailed in `01_DRIFT.md`. The two that will bite in a demo-to-signup conversation:

- **"Just Us" and "The Scene"** are the categories the entire demo is built around. They are
  **not in RAW's `move_category` enum.** One migration + one constant.
- **Trending, crew-going and waitlist** are visible in BETA and dead in RAW — partly from the
  migration failure, partly because two `nearby_moves` overloads exist and the client binds
  the old one, which returns neither `hot_score` nor `crew_going`.

**Recommendation:** treat BETA as the spec. It is the more coherent product.

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
