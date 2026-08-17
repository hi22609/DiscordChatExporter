# 00 — ORIENTATION

Generated 2026-08-12 ~05:15 UTC. Every command below was executed; output is quoted, not predicted.

## Where the code actually is

| Build | Path | Confidence | Notes |
|---|---|---|---|
| **RAW** | `wtm/` | **Certain** | `package.json` name is `wtm`. React Native + Expo Router + Supabase. 100 files, 9,230 LOC of TS/TSX/SQL. |
| **BETA** | `beta/` | **Certain** | Two hand-written HTML files. `<title>WTM · What's The Move</title>`. |

### The most important thing found in Wave 0

**BETA was not in version control.** It lived only at
`/tmp/claude-0/.../scratchpad/wtm-beta.html` — an ephemeral container scratchpad that is
reclaimed when the session ends. The entire demo (110 KB, single file, weeks of iteration)
was one container reclaim from permanent loss.

Rescued into the repo in commit `022e9d9` along with a real build script and the
Playwright checks. This alone justified Wave 0.

**RAW was also not in the local worktree.** The `wtm/` subtree exists only on
`origin/claude/wtm-app-concept-rci97r`; `master` has none of it. Anyone cloning this repo
and checking out master sees the DiscordChatExporter OSS project and no WTM at all.

## Search performed

- Current working directory and everything beneath it — searched.
- `C:\Users\owedo\Desktop`, `Downloads`, `Documents`, `OneDrive` — **do not exist.** This is
  an ephemeral Linux container (`Linux 6.18.5`), not the Windows machine the brief assumes.
- `gh repo list` — **`gh` CLI is not installed in this environment** (confirmed in the
  environment configuration). Could not enumerate remote repos. Recorded and moved on per brief.
- Base44 / Lovable / Replit / Bolt config — none found.
- Git remotes: `origin https://github.com/hi22609/DiscordChatExporter`. Branches: `master`,
  `claude/wtm-app-concept-rci97r`. WTM is entirely on the latter.

## Stack

### RAW (`wtm/`)
| Dimension | Value |
|---|---|
| Framework | Expo SDK 51, React Native 0.74.5, Expo Router 3.5 (file-based routing) |
| Language | TypeScript 5.3, `strict: true` |
| Package manager | npm (no lockfile committed — see Audit) |
| Styling | NativeWind 4 (Tailwind for RN) + `global.css` + `tailwind.config.js` |
| State | Zustand 4.5 (auth, location) + TanStack Query 5.45 (server state) |
| Forms | react-hook-form 7.52 + zod 3.23 |
| Database | Supabase (Postgres + PostGIS), 14 SQL migrations |
| Auth | Supabase Auth, session persisted via `expo-secure-store` |
| Backend | 4 Supabase Edge Functions (Deno) |
| Maps | `react-native-maps` 1.14 |
| Hosting | None yet. EAS Build configured (`eas.json`) but never run. |

### BETA (`beta/`)
| Dimension | Value |
|---|---|
| Framework | **None.** Hand-written HTML + CSS + vanilla JS, single file. |
| Dependencies | **Zero runtime dependencies.** Map is Canvas 2D drawn from hand-authored coordinates. |
| Build | `node beta/build.js` — inlines the app into the share shell, verifies byte-exact round-trip |
| Test | `playwright-core` (dev-only) driving headless Chromium |
| Hosting | Published as claude.ai artifacts (see STATE.md for URLs) |

## Git state

- Branch created: **`overnight/2026-08-12`** from `origin/claude/wtm-app-concept-rci97r`.
- Working tree was clean at start. **No stashes. No uncommitted work. Nothing was at risk.**
- Last 10 commits on the base branch:
  ```
  05d22ef feat: move chat, waitlist queue, hype reactions, crew social proof
  f8f39bf Replace squad picker modal with instant RSVP + crew link
  9d9d053 feat: full growth engine — activity feed, hot score, daily digest
  381de54 refactor: zero-friction onboarding — 4 fields signup + 1-tap age gate
  a9212ab feat: squad RSVPs, 17-25 age gate, and safety hardening
  ae3c6fd Launch readiness: block system, reports UI, app assets, legal, runbook
  f462161 Production hardening: latency, rendering, security, and code quality
  671797b Correctness pass: fix six real bugs and close the spot→move loop
  8b879b1 Add Fire Spots: a second map layer for permanent local gems
  b1ca1c1 Add deep-link invites: tap a share link straight into sign-up
  ```

## Commands — executed and confirmed

### RAW
```bash
cd wtm
npm install        # VERIFIED: "added 1507 packages in 1m"
npx tsc --noEmit   # VERIFIED: FAILS — 72 errors (see below)
npm run lint       # see 02_AUDIT.md
npm test           # see 07_VERIFICATION.md
npx expo start     # NOT RUN — needs a device/simulator and Supabase credentials
```

> **RAW cannot be run end-to-end in this container.** It is a native mobile app requiring a
> simulator, and it needs `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`
> pointing at a live Supabase project that does not exist yet. All RAW findings tonight are
> from static analysis, typechecking, and SQL review — **never from running the app.**
> Tagged `[UNVERIFIED-RUNTIME]` where that distinction matters.

### BETA
```bash
node beta/build.js            # VERIFIED: "built beta/wtm-share.html (144204 bytes, round-trip verified)"
npm --prefix beta install     # VERIFIED
node beta/tools/test-flow.js  # VERIFIED: passes, zero console errors
```
BETA opens directly in a browser — no server, no port, no credentials.

## `npx tsc --noEmit` — 72 errors, two root causes

**Cause 1 — schema drift (18 errors in `src/hooks/`).** Migrations 012–014 added tables and
RPCs that were never added to the hand-written `src/types/database.ts`. When a table is
absent from the `Database` generic, supabase-js types its rows as `never`; when an RPC is
absent, it types the args as `undefined`. Hence the odd-looking errors.

| Missing from `database.ts` | Added by | Used at |
|---|---|---|
| table `activity_feed` | 012 | `.from('activity_feed')` |
| table `move_messages` | 013 | `.from('move_messages')` |
| table `move_chat_reads` | 013 | — |
| table `move_reactions` | 014 | `.from('move_reactions')` |
| view `move_reaction_counts` | 014 | `.from('move_reaction_counts')` |
| rpc `mark_activity_read` | 012 | `useActivity.ts` |
| rpc `mark_chat_read` | 013 | `useMoveChat.ts` |
| rpc `waitlist_position` | 014 | `useWaitlist.ts` |

**Cause 2 — Deno files in the app's TypeScript project (54 errors in `supabase/functions/`).**
`tsconfig.json` has `"include": ["**/*.ts", ...]`, which sweeps in the four Supabase Edge
Functions. Those run on Deno: they import from URLs and use the `Deno` global, neither of
which resolves under the React Native config. They are not broken — they are being
typechecked by the wrong toolchain.

Both fixed in Wave 4.

## Size

| Metric | RAW | BETA |
|---|---|---|
| Files | 100 | 2 source + 1 generated |
| LOC (TS/TSX/SQL) | 9,230 | 3,006 (single HTML) |
| Runtime dependencies | 31 | **0** |
| Dev dependencies | 11 | 1 |
| Bulk of code | `app/` (24 routes), `src/hooks/` (16), `supabase/migrations/` (14) | one file |

## Alarming on first pass

1. **BETA was outside version control.** Fixed.
2. **No lockfile in `wtm/`.** `package-lock.json` is not committed, so "install" is not
   reproducible — `^`/`~` ranges float. Two installs a month apart can differ.
3. **`npm run type-check` fails.** It is in `package.json` as if it were a gate; it has
   presumably never passed.
4. **Nothing in RAW has ever run against a real database.** No Supabase project exists. Every
   query, RLS policy, and RPC in RAW is unexecuted code.
5. **`master` contains no WTM code at all.** All of it lives on one feature branch.
