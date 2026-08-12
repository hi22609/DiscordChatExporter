# WTM Overnight Run — Append-Only Log
Run start: 2026-08-12T05:09:35Z
Operator: autonomous (Michael asleep)
Branch: `overnight/2026-08-12` (based on `origin/claude/wtm-app-concept-rci97r`)

Format: `[UTC time] WAVE — event`

---

[05:09] WAVE 0 — Run started. Created `WTM_REPORTS/`, LOG.md, STATE.md.
[05:10] WAVE 0 — Repo ground truth: cwd is `/home/user/DiscordChatExporter` (the DiscordChatExporter OSS project). WTM lives in a `wtm/` subtree that exists ONLY on `origin/claude/wtm-app-concept-rci97r`, not on master and not in the local worktree at session start.
[05:10] WAVE 0 — Local `claude/wtm-app-concept-rci97r` was 0 commits ahead / behind origin by the entire WTM subtree. No stashes, working tree clean. No work at risk.
[05:11] WAVE 0 — Created branch `overnight/2026-08-12` from `origin/claude/wtm-app-concept-rci97r`. RAW = `wtm/` (100 files, ~9.2k LOC TS/TSX/SQL).
[05:11] WAVE 0 — ASSUMPTION LOGGED: Windows paths in the brief (`C:\Users\owedo\...`) do not exist. This is an ephemeral Linux container. Recon limited to the container filesystem + git remotes. `gh` CLI is unavailable in this environment (documented in environment config), so `gh repo list` could not be run. Recorded, moving on per brief.
[05:14] WAVE 0 — RESCUE: BETA existed only in an ephemeral /tmp scratchpad, outside version control. Copied `wtm-beta.html` + `wtm-share-shell.html` into `beta/`, wrote `beta/build.js` (inlines app into shell, verifies byte-exact round-trip, exits non-zero on failure), added package.json/README/gitignore and the Playwright checks. Commit 022e9d9. This was the single highest-value action of the night: a container reclaim would have destroyed the demo.
[05:15] WAVE 0 — RAW verified: `npm install` OK (1507 packages, 1m). `npx tsc --noEmit` FAILS with 72 errors.
[05:15] WAVE 0 — Root-caused the 72 errors to exactly two causes, not 72 problems:
         (1) Schema drift — migrations 012/013/014 added activity_feed, move_messages, move_chat_reads, move_reactions, view move_reaction_counts, and RPCs mark_activity_read/mark_chat_read/waitlist_position. None were added to the hand-written src/types/database.ts. supabase-js then types missing tables as `never` and missing RPC args as `undefined`, producing 18 confusing errors in src/hooks/.
         (2) Wrong toolchain — tsconfig `include: ["**/*.ts"]` sweeps in 4 Supabase Edge Functions that run on DENO (URL imports, `Deno` global). 54 errors. The functions are not broken; they are being typechecked by the React Native config.
[05:16] WAVE 0 — CONSTRAINT: RAW is a native mobile app with no Supabase project provisioned. It cannot be run end-to-end in this container. All RAW findings tonight are static (typecheck + SQL/code review), never runtime. Tagging such claims [UNVERIFIED-RUNTIME]. Not going to pretend otherwise.
[05:16] WAVE 0 — Wrote 00_ORIENTATION.md.
[05:17] WAVE 1/2 — Launched 2 parallel read-only subagents: (A) RAW slop + correctness/resilience; (B) RAW security/RLS + performance/cost. Serializing all surgery to myself per doctrine.
[05:17] WAVE 3 — Starting visual identity on BETA myself while recon runs.
