# WTM Overnight Run — Append-Only Log

> **Dated snapshot — 2026-08-12.** Parts of this have since been overtaken. `STATE.md` is the current picture; where the two disagree, STATE.md is right.

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

[05:20] WAVE 3 — Tell audit on beta/: 19 distinct border-radius values, 6 gradient-text uses, 11 backdrop-filter, 4 competing accent hues, emoji tab bar, 4 identical section rhythms, and a stats strip of invented numbers ("137 people locked in"). Essentially the full checklist.
[05:25] WAVE 3 — Chose sodium-vapour amber #FF9E3D as the single accent (colour of a Pittsburgh street at night = where/when the app is opened). Neutrals biased blue as the complement. Subset 4 real typefaces to woff2 data URIs, 45KB total.
[05:30] WAVE 3 — SELF-CAUGHT: I wrote estimated WCAG ratios into the report. Computed them properly: --paper-600 was 2.96 (fails even large text) and light-theme accent 4.15 (fails AA). Re-derived both. Report now carries measured values only.
[05:40] WAVE 2 — Security subagent returned 34 findings. Independently verified its top claim (migrations 011/014 cannot apply) by reading the conflicting declarations myself. Confirmed.
[05:55] WAVE 2 — Correctness subagent returned 35 findings, independently reaching the same migration conclusion. Notable non-finding it reported honestly: RAW has almost no textual AI slop (0 TODO, 0 lorem, 0 marketing filler). The slop is structural.
[06:10] WAVE 4 — Root-caused the 72 type errors to `interface` vs `type`: interfaces get no implicit index signature, so the Database type never satisfied supabase-js's GenericSchema and every table collapsed to `never`. One malformed view entry compounded it. 72 -> 0.
[06:20] WAVE 4 — Types then caught two of MY OWN errors: I declared `is_read` (actual: `read`) and `body` (actual: `content`). Code was right, my types were wrong. Fixed.
[06:35] WAVE 4 — STOPPED AND REVERTED: my first restrictive RLS policy repeated `is_public = true`, which would have locked creators out of their own private moves. Narrowed to carry only the ban check.
[06:40] WAVE 4 — REJECTED a unique index on activity_feed: notify_creator_on_rsvp inserts without on-conflict, so it would abort the whole RSVP transaction on a normal leave-then-rejoin. Array cap is the real fix. Reasoning left in the migration.
[06:45] WAVE 4 — DECIDED NOT TO FIX profiles read exposure (audit C2). Every safe repair breaks 3 call sites and PostgREST view-embedding, and cannot be verified without a live DB. Wrote exact SQL into DECISIONS_FOR_MICHAEL.md instead of shipping blind.
[07:00] WAVE 4 — Deleted send-push-notification entirely (unauthenticated, service-role key, client-invoked). The activity row it duplicated is already written by a trigger.
[07:20] WAVE 3 — SELF-CAUGHT: while fixing MoveCard's prefetch I created a duplicate onPress prop, the exact bug class I'd fixed 40 minutes earlier in the same file. tsc caught it before commit.
[07:35] WAVE 6 — SELF-CAUGHT: I reintroduced 7 em dashes into user-visible copy after Michael explicitly said he dislikes them. Removed. Also found the visual work had drifted: move covers, story rings and the welcome canvas were still the old saturated palette. Harmonised.
[07:50] WAVE 7 — Clean clone verified. NOTE: first `npm install` in the clean clone silently under-installed (151 phantom errors) until `rm -rf node_modules`. That is the missing-lockfile finding from Wave 0 reproducing itself. Recorded.
[07:55] WAVE 7 — Screenshots: 14 files, 3 viewports x 2 themes + 4 app screens. GAP ACKNOWLEDGED: no `-before` images; I did not capture them before starting. Prior state is documented by grep counts and recoverable via `git show 022e9d9`.
[08:00] WAVE 5 — CUT. Per the brief, feature scope is cut first when behind. Wrote the scored candidate list and the rejected list instead of half-building.
[08:05] WAVE 8 — Deliverables written. Did NOT republish the live artifact links: updating a link people already hold is a deploy, and Rule 2 forbids it. Left as a one-action decision for Michael.
[08:10] RUN COMPLETE — 6 commits on overnight/2026-08-12. Nothing pushed, nothing merged, nothing deployed. Undo is one branch deletion.
[08:15] WAVE 6 (cont) — SELF-CAUGHT: I committed wtm/node_modules (47,145 files) in 186e8f7, because the repo's .gitignore is DiscordChatExporter's C# one and I used `git add -A wtm` after npm install. Untracked in a follow-up commit rather than rewriting history. Added a Node .gitignore. Side benefit: the install also produced wtm/package-lock.json, which was a Wave 0 gap, so installs are now reproducible.
[08:18] WAVE 6 (cont) — SELF-CAUGHT: ACCESS.md told Michael to diff against the LOCAL base branch, which is stale and predates the wtm/ subtree, so his "show me what changed" command would have shown the entire project as new. Corrected to the origin/ base.
[08:20] WAVE 7 (re-verify) — After the cleanup commits: working tree clean, 0 tracked build artifacts, beta rebuild round-trip verified, test-flow passes with zero console errors.
