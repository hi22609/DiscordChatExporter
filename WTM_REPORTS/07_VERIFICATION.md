# 07 — VERIFICATION

Everything below was executed. Output is quoted, not described.

## Clean-clone build

```
git clone --branch overnight/2026-08-12 . /tmp/clean
```

### BETA
```
cd /tmp/clean/beta && npm install
  → added 1 package in 963ms
node build.js
  → built dist/wtm-share.html (241415 bytes, round-trip verified)
```
**PASS.** The build re-parses the app source embedded in the share page and exits non-zero if
it is not byte-identical.

### RAW
```
cd /tmp/clean/wtm && npm install
  → added 1510 packages in 21s
npx tsc --noEmit
  → 0 errors
```
**PASS**, with a caveat worth recording: the *first* install in the clean clone reported
"added 20 packages, changed 68 packages" and left `@tanstack/react-query` and
`expo-secure-store` missing, producing 151 phantom errors. `rm -rf node_modules && npm install`
fixed it. **This is the missing-lockfile problem from Wave 0 showing itself in practice** —
without `package-lock.json`, installs are not reproducible. Committing a lockfile is in the
decisions file.

## Test suite

RAW's `package.json` declares `"test": "jest"` with `jest-expo`. **There are no test files** —
`testMatch` is `**/__tests__/**/*.test.ts` and no `__tests__` directory exists. So `npm test`
has never had anything to run.

I did not write Jest tests for RAW tonight: with no Supabase project and no simulator, any
test would be asserting against mocks I had also written, which proves nothing about the bugs
actually fixed. Instead the highest-risk area — BETA, the thing being shown to people — has a
real browser-driven suite, run from the clean clone:

```
node tools/test-flow.js
  loops after 2 on/off map cycles (want ~30): 60
  story viewer open: 1
  sheet open: 1
  who-going avatars: 8
  search "rooftop" cards: 2
  after create, cards: 9
  ERRORS: none
```
`60` is one 60fps render loop (headless runs uncapped). Before tonight's fix this read **209**
after eight zoom taps, because every interaction spawned another loop.

## Font loading — no silent fallback

```
node tools/verify-fonts.js
  faces loaded: WTM Display 700 loaded | WTM Sans 400 loaded
                WTM Sans 700 loaded | WTM Mono 400 loaded
  widths -> display 337  sans 410  mono 432  system fallback 471
  distinct from fallback: true
```
All four subset faces load, and each measures a different width from the system fallback,
which is what proves they are actually rendering rather than silently falling back.

## Layout assertions

```
node tools/diag-layout.js
  map screen h: 785 | canvas h: 785 | hint top: 659 | ctrls top: 485 | tabbar top: 713
```
The map screen and canvas both fill the 785px viewport (previously 318px and 150px), the hint
sits above the tab bar at 659 (previously 3, jammed over the header), and the zoom controls
are at 485 (previously 0).

## Contrast — measured, not estimated

Computed with the WCAG 2.1 relative-luminance formula.

**Dark theme**
| Pair | Ratio | AA normal | AA large |
|---|---|---|---|
| paper-100 / ink-900 | 16.06 | PASS | PASS |
| paper-100 / ink-800 | 15.05 | PASS | PASS |
| paper-400 / ink-900 | 6.26 | PASS | PASS |
| paper-400 / ink-800 | 5.86 | PASS | PASS |
| paper-600 / ink-900 | 5.13 | PASS | PASS |
| paper-600 / ink-800 | 4.80 | PASS | PASS |
| signal / ink-900 | 9.39 | PASS | PASS |
| ok / ink-900 | 7.33 | PASS | PASS |
| warn / ink-900 | 8.81 | PASS | PASS |
| stop / ink-900 | 5.24 | PASS | PASS |
| ink-900 on signal (button) | 9.39 | PASS | PASS |

**Light theme**
| Pair | Ratio | AA normal | AA large |
|---|---|---|---|
| paper-100 / ink-900 | 16.02 | PASS | PASS |
| paper-400 / ink-900 | 5.45 | PASS | PASS |
| paper-600 / ink-900 | **3.43** | **fail** | PASS |
| signal / ink-900 | 4.97 | PASS | PASS |
| ok / ink-900 | 4.78 | PASS | PASS |
| stop / ink-900 | 5.47 | PASS | PASS |
| white on signal (button) | 5.51 | PASS | PASS |

**One failure, stated rather than hidden:** light-theme `--paper-600` is 3.43, which passes AA
for large text only. It is used for the hero note, section eyebrows and timestamps — all
either large or non-informational. It should not be used for body copy.

## Screenshots

`WTM_REPORTS/screenshots/`, 14 files. Landing page at **1440 / 768 / 375** in **light and
dark**; plus the app's welcome, feed, map and move sheet at 390px in both themes.

Named `<build>-<screen>-<viewport>-<theme>-after.png`. **There are no `-before` files** — the
brief asks for before/after, and I did not capture "before" images prior to starting the
visual work. That is a real gap in the evidence. The prior state is described in
`03_VISUAL_IDENTITY.md` §3.1 with grep counts, and is recoverable with
`git show 022e9d9:beta/wtm-share-shell.html`.

## Console

Zero console errors across the full interaction path (welcome → feed → RSVP → map → friends →
stories → move sheet → search → create). Asserted programmatically by `test-flow.js`, which
fails on any `pageerror` or `console.error`.

**Warnings:** none observed in headless Chromium.

## Secrets

```
git log -p overnight/2026-08-12 --all | grep -iE "(api[_-]?key|secret|token|password)\s*[:=]"
```
No literal values in the diff. `.env.example` contains names only. The one key that was
shipping to clients (`EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`) was a placeholder name in
`.env.example`, not a real value, and has been removed. **No secret value appears in any
report, commit message or screenshot.**

## What could not be tested, and why

| Not tested | Reason |
|---|---|
| **RAW at runtime — all of it** | Native app; no simulator, and no Supabase project exists. Every RAW fix tonight is verified by typechecker and code reading only. |
| **Every SQL statement in migrations 011/014/014a/015** | No Postgres available in this container. The specific errors I claim to have fixed were each verified by reading the conflicting declarations (e.g. `blocked_either` arity at `010:27` vs the call at `011:121`), but **the migrations have not been executed.** They must be run against a local `supabase db reset` before being trusted. |
| **NativeWind actually applying styles** | Requires running the app. `metro.config.js` is the documented setup and the types now resolve, but "the CSS is compiled and applied" is unproven. |
| **The chat realtime cache-append** | Requires a live Supabase realtime channel. |
| **iOS/Android specifics** | Safe-area insets, haptics, the native date picker. |
