# START HERE

You've been added to WTM. This page is the five minutes of context that saves you an hour.

**First thing to know:** this repo is a fork of an unrelated open-source project
(DiscordChatExporter). All the C# at the top level is not ours and does not matter. WTM lives
in two folders.

**Second thing:** none of it is on `master`. The work is on **`overnight/2026-08-12`**. If you
start a session from master you'll see the Discord tool and no WTM at all. Say so in your first
message to Claude:

> work on the branch overnight/2026-08-12

---

## What WTM is

A Pittsburgh-first app for finding what's happening tonight. Invite-only, 17-25, two kinds of
plans: **Just Us** (small, private, someone's place) and **The Scene** (nightlife, bars, shows).

## The two builds

| | Where | What it is |
|---|---|---|
| **BETA** | `beta/` | The demo. One HTML file, no dependencies, no build step needed to open it. This is what gets shown to people. |
| **RAW** | `wtm/` | The real product. React Native + Expo + Supabase. Not shippable yet. |

They barely share files, which makes them a clean line to split work along. Pick one, say which,
so you and Michael aren't editing the same thing.

### Running BETA

```bash
cd beta && npm install && node build.js
```

Writes `dist/wtm-share.html`. Open it in a browser. That's the whole loop.

### Running RAW

```bash
cd wtm && npm install && npx tsc --noEmit    # must report 0 errors
```

There is no Supabase project yet, so the app cannot talk to a backend. What you *can* run is
the database, locally:

```bash
sudo apt-get install -y postgresql-16 postgresql-16-postgis-3
cd wtm && supabase/tests/run.sh
```

That applies every migration to a throwaway Postgres and runs 41 assertions against the result.
It should say `migrations failed: 0   assertions: 41 passed, 0 failed`. **Run it before you
change anything** — if it's red on arrival, that's your environment, not the code, and it's
worth fixing before you go further.

---

## Where to read next

Everything is in `WTM_REPORTS/`. **Two of those files are kept current. The rest are dated
snapshots** of what was known the night they were written, and several have been overtaken —
each one carries a banner saying so. Read the current two first:

1. **`STATE.md`** — what is true right now. Start here. Where any other report disagrees with
   it, this one is right.
2. **`DECISIONS_FOR_MICHAEL.md`** — everything still open, with the reasoning and the cost
   attached. Read it before proposing anything.

Then, as background:

3. **`00_ORIENTATION.md`** — where the code is and how it got there.
4. **`07_VERIFICATION.md`** — what has been executed versus what is still only claimed.
   Anything marked `[UNVERIFIED]` is exactly that.
5. **`02_AUDIT.md`** — the security and correctness findings. Its headline is out of date; the
   individual findings are not.

## Two rules that are not negotiable

**Zero infrastructure cost.** A previous project died because hosting and API bills ate it. No
paid service, no metered API, no managed database, nothing that can generate a bill. If the
right fix costs money, don't do it — write it up in `DECISIONS_FOR_MICHAEL.md` with the price
and the alternative instead.

**Never push to `master`, never deploy, never touch production data.** Branch off
`overnight/2026-08-12` and commit there. No force pushes, no history rewriting.

## A habit worth copying

Almost every real bug in this project was found by running something, not by reading it. Seven
of sixteen database migrations were broken for months while looking completely reasonable on
the page. The feed's Trending badge and friends row were built, shipped, and permanently
invisible because the client was calling a function that could not answer.

If you claim something works, run it first.
