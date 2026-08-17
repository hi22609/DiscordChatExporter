# MORNING BRIEF


> **Dated snapshot — 2026-08-12.** Parts of this have since been overtaken. `STATE.md` is the current picture; where the two disagree, STATE.md is right.

> Specifically: section 1 says the migration fixes were never run against a database.
> They have been now, and three further bugs surfaced. See `STATE.md`.

One page. Everything else is detail.

---

## 1. The most important thing I found

**Your demo was not saved anywhere.**

`wtm-beta.html` — the whole thing, weeks of work — existed only in a temporary folder that
gets wiped when the session ends. Not in git. Not in a backup. One timeout from gone forever.

That was the first thing I fixed. It is now in the repo at `beta/`, with a build script and
tests. **Look there first.**

The second thing: **RAW's database has never worked.** Two of the migration files contain SQL
errors that stop them dead — one function is called with two arguments when it only takes one,
and another tries to use a status value (`waitlist`) that was never added to the list of
allowed values. So everything built after migration 010 — the waitlist, reactions, the
activity feed, the chat, the ban system — has never existed in any real database, while the
app has been calling all of it. I fixed the errors, but I had no database to run them against,
so **run `npx supabase db reset` before trusting it.**

---

## 2. What I fixed

**About 45 real issues.** The ones that mattered:

- **Your app had a crash on its most-used screen.** Opening any move you'd joined threw an
  error and dropped you to the error screen. One wrong method call.
- **The venue name on every feed card was invisible** — black text on a black card, caused by
  a duplicated style attribute.
- **`npm run type-check` had never passed** (72 errors). Now zero. Every bug above was
  something the typechecker would have caught, if it had ever been green.
- **A 16-year-old could pass your 17+ age check.** It calculated age from birth year only, so
  anyone born late in the year came out a year older than they are.
- **Three ways your Supabase bill could have run away unattended**, including a function with
  no password check that held your admin key and could be called by anyone. Deleted.
- **Every private move was readable by anyone** with the key that ships inside your app.
- **The demo's map was quietly on fire** — every zoom tap started another animation loop that
  never stopped. Eight taps meant 209 loops fighting each other. That was the lag and the
  battery drain.

---

## 3. What I built

Not much, and that is a deliberate call — the fixes above ate the night. Two things, both
finished:

- **A real build for the demo** (`node beta/build.js`) that verifies the packaged copy matches
  the source exactly and fails loudly if it doesn't.
- **A test suite that drives the demo in a real browser** and fails on any error. It is what
  caught the animation-loop bug and two layout bugs.

---

## 4. What it looks like now

Last night the demo looked like it came out of a generator, because it had every marker of
one: purple-to-orange gradients, gradient text on the headline, blurred colour blobs, frosted
glass panels, emoji instead of icons, nineteen different corner radiuses, and a stats bar
claiming "137 people locked in" on a demo with no users.

Now it has an actual point of view. The accent colour is sodium-vapour amber — the colour of a
Pittsburgh street under the old streetlights, which is exactly where and when someone opens
this app. It means one thing, "this is live", and nothing decorative uses it. The greys are
pulled slightly blue, like wet asphalt under that light. Three real typefaces instead of the
system default. Two corner radiuses instead of nineteen. Hairlines instead of drop shadows.
The headline is left-aligned and the layout is deliberately uneven, so it reads as designed
rather than as a template. The fake statistics are deleted, not reworded.

Screenshots are in `WTM_REPORTS/screenshots/` at three sizes in both light and dark.

---

## 5. What is still broken, and why I left it

- **RAW has never been run — not by me, not by anyone.** No simulator, no database. Every RAW
  fix is verified by typechecker and code reading only. I have marked this everywhere rather
  than glossing it.
- **The `profiles` table still publishes every user's push token, birthdate and Instagram
  handle.** I know exactly how to fix it. I did not, because the fix breaks three working
  screens and I had no way to test the repair. Exact SQL is in the decisions file. **Do this
  before launching.**
- **8 of 14 screens say "nothing here" when the network fails** instead of "something went
  wrong". Highest-value next job.
- **Every move created in RAW is pinned to downtown Pittsburgh**, whatever address you type.
- **Push notifications are entirely dead code.** Nothing ever registers a token.

---

## 6. Waiting on you

Full detail in `DECISIONS_FOR_MICHAEL.md`. The four that matter:

1. **Was the database ever actually deployed?** Everything else depends on the answer.
2. **The `profiles` exposure** — needs a database to fix safely.
3. **Feedback doesn't reach you automatically.** claude.ai pages cannot send data anywhere.
   My recommendation: host the demo on Cloudflare Pages free tier, then it can.
4. **Push notifications** — wire them up or delete them, but don't leave them.

**I did not republish your demo links.** Updating a link people already have is a deploy, and
you said not to deploy. Say the word and I'll push the redesign to the same URL.

---

## 7. What I assumed when I couldn't ask

- **The Windows paths in your brief don't exist** — I was running in a Linux container. I
  searched everything reachable and found both builds in the repo. `gh` isn't installed, so I
  couldn't list your other repos.
- **"Don't deploy" includes the artifact links.** They're what people already have, so I
  treated them as production and left them alone.
- **Free tier or nothing meant I created no accounts.** Several good fixes need a Google Form
  or a Netlify account. Those are yours to make, so I wrote them up instead of guessing.
- **When a fix cascaded past what I could verify, I stopped and documented it** rather than
  shipping SQL I couldn't run. That happened twice.

**Nothing was pushed, merged or deployed. The whole night is one command to undo:**
```bash
git checkout claude/wtm-app-concept-rci97r && git branch -D overnight/2026-08-12
```
