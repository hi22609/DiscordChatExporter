# STATE — what is true right now

**Last updated: 2026-08-17.**

This is the one file that is kept current. Everything else in `WTM_REPORTS/` is a dated
snapshot of what was known on the night it was written, and some of it has since been
overtaken. Where an older report contradicts this file, **this file is right.**

Read this first. Then `DECISIONS_FOR_MICHAEL.md` for what is still open.

---

## Where things are

Branch: **`overnight/2026-08-12`**. Nothing WTM is on `master` — master is the unrelated
DiscordChatExporter fork this repo started as.

| | Path | What |
|---|---|---|
| **BETA** | `beta/` | The demo. One HTML file, no runtime dependencies. This is what gets shown to people. |
| **RAW** | `wtm/` | The product. React Native + Expo + Supabase. Not shippable yet. |

## The database — resolved

The single biggest unknown in this project was whether RAW's schema had ever been deployed.
**It had not.** Seven of sixteen migrations failed outright on a clean database, so nothing
after migration 004 has ever existed anywhere, while the client has been calling all of it.

That is fixed. **19 migrations, 0 errors, 41 assertions passing** against real Postgres +
PostGIS. Reproduce it yourself:

```bash
sudo apt-get install -y postgresql-16 postgresql-16-postgis-3
cd wtm && supabase/tests/run.sh
```

Expected last line: `migrations failed: 0   assertions: 41 passed, 0 failed`.

This supersedes the headline in `02_AUDIT.md` and section 1 of `MORNING_BRIEF.md`, both of
which say the database has never been run and that the fixes are unverified. They were true
when written.

## What changed since the overnight run

| Was | Now |
|---|---|
| 7 of 16 migrations failed; every SQL claim unverified | 19 apply clean, verified under two collation orders |
| Sign-up broken for every user (FK violation in `handle_new_user`) | Fixed and tested |
| `promote_from_waitlist` callable by anyone with the anon key | Revoked from `PUBLIC` — the earlier revoke targeted roles that never held the grant |
| `search_path = ''` silently breaking the functions it hardened | Pinned to `public, extensions` |
| Two `nearby_moves` overloads; client bound the one without `hot_score` / `crew_going` / `waitlist_count` | One signature; feed returns all three |
| `profiles` published every member's push token, birthdate and Instagram handle | Own-row only, with a `public_profiles` view for what others may see |
| "Just Us" and "The Scene" missing from RAW's category enum | Added, and wired into the picker and filter bar |

## Still open

In `DECISIONS_FOR_MICHAEL.md`, which is current. The short version:

- **0** — the map cannot reach Snap Map quality inside a claude.ai artifact. Needs hosting.
- **3** — demo feedback does not reach Michael automatically.
- **4** — push notifications are entirely dead code. Nothing ever writes a token.
- **5** — four remaining BETA/RAW mismatches (see `01_DRIFT.md`, items 1, 3, 5, 6).
- **6** — every move created in RAW is pinned to downtown Pittsburgh. No geocoding.
- **7** — no lockfile, orphaned files, unfilled EAS placeholders.

Blocked on Michael, nobody else can do it: **GitHub Settings → Pages → Source → "GitHub
Actions"**, which is what publishes the demo with a real vector map.

## The two rules

**Zero infrastructure cost.** No paid service, no metered API, no managed database, nothing
that can generate a bill. If the right fix costs money, write it up in
`DECISIONS_FOR_MICHAEL.md` with the price and the alternative instead of doing it.

**Never push to `master`, never deploy, never touch production data.** Branch off
`overnight/2026-08-12`.

## Live artifacts

- Share page: `https://claude.ai/code/artifact/01e27f77-0230-4770-81a6-343205a35cc4`
- Raw app demo: `https://claude.ai/code/artifact/141388bc-393f-4d4f-8110-28a209e75919`

Publishing to these is deploying. Michael's call, not an agent's.
