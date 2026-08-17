# 06 — ADVERSARIAL PASS


> **Dated snapshot — 2026-08-12.** Parts of this have since been overtaken. `STATE.md` is the current picture; where the two disagree, STATE.md is right.

Re-reading tonight's work as a hostile reviewer. I am the most likely source of new slop in
this repo, so this hunts my own output against the Wave 2 Track A list and the Wave 3 tells.

## Things I got wrong and fixed

### 1. I claimed WCAG numbers I had not computed
I wrote a contrast table into `03_VISUAL_IDENTITY.md` from estimation. Computing them
properly showed two of my own tokens **failing**:

| Token | I claimed | Actual | Outcome |
|---|---|---|---|
| `--paper-600` on `--ink-900` | 3.20 (AA-large pass) | **2.96 — fails even large text** | Re-derived to `#77849D` → **5.13**, now passes AA |
| light-theme `--signal` | not measured | **4.15 — fails AA** | Re-derived to `#945C23` → **4.97** |

This is the exact failure mode the brief warns about, committed by me, in the report that
was supposed to prove I had not committed it. Every number in that table is now measured
output from `python3 /tmp/contrast.py`, reproduced in `07_VERIFICATION.md`.

### 2. I wrote a `STATE.md` that claimed all eight waves were complete
Written at the start of the night, when one was. If I had been compacted in the next ten
minutes, my own resume file would have told me the night was finished. Corrected within the
same minute, but it is the most dangerous thing I did.

### 3. I reintroduced em dashes into user-visible copy
Michael said plainly he does not like them. I then wrote seven into the new landing page
(the hero side-panel, a feature card, the FAQ, and three strings in the feedback flow).
All removed. Comment-only em dashes in source are left alone, since he was talking about
what readers see.

### 4. I created a duplicate `onPress` prop
While fixing `MoveCard`'s prefetch I did a blind `onPressIn` → `onPress` replacement, which
produced two `onPress` props on the same element. That is precisely the bug I had fixed forty
minutes earlier on line 144 of the same file. Caught by `tsc` before commit.

### 5. My first restrictive RLS policy would have locked creators out of their own moves
Making 011's ban policy `RESTRICTIVE` was right. Copying its body verbatim was not: it
carried `is_public = true and is_cancelled = false`, which as a restrictive clause ANDs
against everything and would have hidden every creator's private and cancelled moves from
them. Narrowed to carry only the ban check.

### 6. My first schema types were wrong in two places
I guessed `is_read` (actual column: `read`) and `body` (actual: `content`). The typechecker
caught both. Worth noting the direction: the types I added were wrong, the app code was right.

### 7. I nearly shipped a unique index that would abort RSVPs
`activity_feed_dedupe` would have made `on conflict do nothing` work — but
`notify_creator_on_rsvp` inserts *without* an on-conflict clause, so a normal
leave-then-rejoin would have raised and rolled back the whole RSVP. Removed before commit,
with the reasoning left in the migration.

### 8. I committed `node_modules` — 47,145 files
`git add -A wtm` after an `npm install`, against a repo whose `.gitignore` is the C# one from
DiscordChatExporter and has no `node_modules` rule. The diffstat read "47,295 files changed",
which is how I noticed. Untracked in a follow-up commit rather than by rewriting history,
per the no-rewrite rule; a proper Node `.gitignore` is now in place. I also left the generated
`beta/wtm-share.html` tracked in the first commit — likewise untracked.

**One accidental good outcome:** that install also produced `wtm/package-lock.json`, which was
missing (a Wave 0 finding). It is now committed, so installs are reproducible.

### 9. My own undo instructions were wrong
`ACCESS.md` told Michael to diff against `claude/wtm-app-concept-rci97r`. That local branch
was stale — it predates the entire `wtm/` subtree — so the command would have shown every file
in the project as new and buried the actual changes. Corrected to the `origin/` base.

## Checks run against my own work

| Question | Answer |
|---|---|
| Did any new component duplicate something existing? | No new components in RAW. In BETA the shell was rewritten in place, not forked. |
| Any placeholder or mock left in? | `grep -in "todo\|fixme\|lorem\|coming soon"` → **0** in both BETA sources. |
| Every new error path handled? | The chat send now has `onError`; `mark_chat_read` logs instead of throwing. `markAllRead` checks its error. |
| Every new feature reachable from the UI? | The founder log is reachable two ways (`#log`, 5 taps on the wordmark). No orphans added. |
| Hardcoded colour or radius that should be a token? | Swept. Remaining literals are (a) inside `:root` declarations, (b) canvas map constants, which cannot read CSS custom properties and are commented as mirroring the tokens, and (c) `#FFFFFF` in canvas strokes. Radii are down to `var(--r-sm)`, `var(--r-md)` and `50px` pills. |
| Did the visual work drift into a second style? | One real drift found and fixed: move cover gradients and the story ring were still the old saturated multi-hue set, and the welcome canvas still painted violet particles. All three now derive from the new ramp. |
| Do both themes still hold? | Yes — measured, and screenshotted at 3 viewports × 2 themes. |
| Does it still build from clean? | `node beta/build.js` verifies the embedded copy byte-for-byte and exits non-zero on mismatch. RAW: clean `npm install` + `tsc` → 0 errors. |

## Things I am leaving, deliberately

| Left | Why |
|---|---|
| **`profiles` read policy still `using (true)`** | The fix cascades into three call sites and PostgREST view-embedding, and cannot be verified without a live database. Documented with exact SQL rather than shipped blind. |
| **RAW's 18 screens still hand-roll `#FF6B35`** | Now that NativeWind is wired the token palette can finally work, but converting 18 screens at 4am with no way to run the app is how you end the night with a broken UI and a cheerful summary. |
| **`Button.tsx`, `useSearchUsers.ts` orphans** | Deleting them is correct and I ran out of night. One command each, listed in the decisions file. |
| **Emoji still used as move-category markers in BETA** | These are *content* (a 🎵 on a music move), not iconography. The chrome — tab bar, buttons, section markers — is now SVG. Deleting content emoji would make the demo colder for no gain. |
| **`validate-invite` still unthrottled** | Needs a rate-limit table plus a live database to verify. Documented. |
| **RAW never run** | No simulator, no Supabase project. Stated everywhere it matters rather than papered over. |

## Honest assessment of tonight

The strongest work is the diagnosis: the migration failure, the render-loop multiplication,
the `calc()` whitespace bug, and the `interface`-vs-`type` root cause behind 72 type errors
are all things that would have cost real hours to find later.

The weakest part is that **RAW's fixes are unverified at runtime**. I fixed a crash I could
only see through a typechecker. That is genuinely better than not fixing it, but it is not
the same as watching it work, and I have not pretended otherwise anywhere in these reports.
