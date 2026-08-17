# ACCESS


> **Dated snapshot — 2026-08-12.** Parts of this have since been overtaken. `STATE.md` is the current picture; where the two disagree, STATE.md is right.

Assume you just woke up. This is everything you need.

## The branch

```bash
git checkout overnight/2026-08-12
```

**See everything I changed, in one command:**
```bash
git fetch origin
git log  --oneline origin/claude/wtm-app-concept-rci97r..overnight/2026-08-12
git diff --stat origin/claude/wtm-app-concept-rci97r..overnight/2026-08-12
```
Use the **`origin/`** base. Your local `claude/wtm-app-concept-rci97r` was stale when I
started (it predates the whole `wtm/` subtree), so diffing against it shows every file in
the project as new.

**Undo the entire night, in one command:**
```bash
git checkout claude/wtm-app-concept-rci97r && git branch -D overnight/2026-08-12
```
(`-D` rather than `-d` because the branch was never merged anywhere.)
Nothing was pushed, nothing was merged, nothing was deployed. Your original branch is
untouched. The night is one branch deletion away from never having happened.

---

## Run BETA (the demo)

No install needed to *look* at it, but the demo has to be built first because the fonts and
the app are injected at build time.

```bash
cd beta
npm install          # once. installs playwright-core (dev only, never ships)
node build.js        # writes dist/
```

Then open either file directly in a browser. **No server, no port, no credentials.**

| File | What |
|---|---|
| `beta/dist/wtm-share.html` | The share page with the demo embedded. **This is the one to send people.** |
| `beta/dist/wtm-app.html` | Just the app, fullscreen, standalone |

```bash
xdg-open beta/dist/wtm-share.html    # or just double-click it
```

**Verify it yourself:**
```bash
node tools/test-flow.js      # drives the whole app, fails on any console error
node tools/verify-fonts.js   # proves the 4 embedded faces load, no silent fallback
node tools/diag-layout.js    # asserts the map fills the screen and chrome is positioned
node tools/shots.js          # re-writes the screenshots
```

**Hidden feedback log:** open the share page and add `#log` to the URL, or tap the WTM
wordmark in the footer five times.

---

## Run RAW (the app)

```bash
cd wtm
npm install
npm run type-check     # now passes. it did not before tonight.
npm run lint
```

**You cannot run RAW end-to-end yet, and neither could I.** It needs:
1. A device or simulator (`npx expo start`, then `i` / `a`).
2. A Supabase project that **does not exist yet**.

To get it running:
```bash
cp .env.example .env      # then fill in the two EXPO_PUBLIC_SUPABASE_* values
npx supabase start        # local Postgres
npx supabase db reset     # applies all 16 migrations
npx expo start
```

> **Before you trust `db reset`:** migrations 011 and 014 could not apply at all until
> tonight, and my repairs have **not been executed against a real Postgres** (there is none in
> the container I ran in). Expect to fix one or two more errors on the first real run. Details
> in `02_AUDIT.md` C8.

### Environment variables

`wtm/.env.example` is the source of truth. Required:

| Variable | Where it comes from |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | same page |
| `GOOGLE_MAPS_API_KEY` | Google Cloud console. **Restrict by bundle ID / SHA-1 before shipping.** |
| `ADMIN_SECRET` | you choose it; set with `npx supabase secrets set ADMIN_SECRET=...` |

`EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` **was removed** — nothing used it and the
`EXPO_PUBLIC_` prefix inlines it into the shipped bundle.

### Test credentials

There are none, because there is no database and no users. Once Supabase is running, create
an account through the app. The invite gate now genuinely blocks signup without a valid code,
so seed one first:

```sql
insert into invite_codes (code, max_uses, created_by)
values ('MOVETEST', 50, null);
```

**No real credential value appears anywhere in this repo or these reports.**

---

## The live demo links

Both are **unchanged from yesterday**. I deliberately did not republish them — Rule 2 says
don't deploy, and updating a link people already have is a deploy.

| Link | State |
|---|---|
| `claude.ai/code/artifact/01e27f77-0230-4770-81a6-343205a35cc4` | share page, still last night's version |
| `claude.ai/code/artifact/141388bc-393f-4d4f-8110-28a209e75919` | raw app demo, same |

**To publish tonight's redesign**, ask me in the morning and I will push
`beta/dist/wtm-share.html` to the same URL so the link you have already shared keeps working.
That is a single action and it is yours to authorise.
