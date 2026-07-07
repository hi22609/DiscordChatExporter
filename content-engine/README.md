# ₿ Cycle Tracker — AI Content Engine

Generates a daily batch of **varied, value-first social posts** about Bitcoin and
the 4-year cycle, grounded in the **real current cycle position** (it reads the
same model the app uses). You drip them through a scheduler. It compounds
reputation instead of burning it.

> **It does not post anywhere.** It writes files. Posting is a separate step you
> control (see "The autopilot piece" below).

---

## ⚠️ Read this first — why not literally 100 promo posts/day

100 "buy my app" posts a day is **spam**, and it backfires fast:

- X, Reddit, and Nostr relays detect and throttle/ban high-volume promotion.
- The Bitcoin community has the strongest immune response anywhere to shilling
  and astroturfing — it's the quickest way to get permanently blacklisted and
  undo the open-source / no-tracking credibility you just built.

So this engine generates **100 genuinely useful posts** — education, cycle data,
contrarian takes, history, orange-pills — and mentions the tracker only
occasionally and softly. Same volume of output; the opposite reputational
outcome. **Value first is the only thing that becomes a staple.**

---

## Setup (on your own machine)

```bash
cd content-engine
npm install
export ANTHROPIC_API_KEY=sk-ant-...        # your key — get one at console.anthropic.com
node generate.mjs --count 100
```

Outputs land in `./out/`:
- `posts-YYYY-MM-DD.jsonl` — one JSON post per line, for your scheduler
- `posts-YYYY-MM-DD.md` — human-readable, **review before posting**

Flags:
- `--count N` — how many to generate (default 100)
- `--model ID` — `claude-opus-4-8` (default, best), or `claude-sonnet-4-6` /
  `claude-haiku-4-5` for cheaper high-volume runs
- `--out DIR` — output directory

### Cost, honestly
Each run makes ~`count/10` API calls of a few thousand tokens. 100 posts/day on
Opus is a few dollars/day; Sonnet or Haiku cut that several-fold with slightly
less polish. Pick the model that fits your budget — it's the `--model` flag.

---

## Run it daily (cron)

```bash
# crontab -e  — generate a fresh batch every morning at 7am
0 7 * * *  cd /path/to/repo/content-engine && ANTHROPIC_API_KEY=sk-ant-... /usr/bin/node generate.mjs --count 100 >> engine.log 2>&1
```

Fresh batch every day, automatically grounded in that day's cycle position.

---

## The autopilot piece (posting)

This engine produces the content; **posting needs your accounts**, so it runs on
your side. Two clean options:

1. **A scheduler app** — Typefully / Buffer / Hypefury (X), or a Nostr scheduler.
   Paste or import the day's posts and let it drip them at a human cadence.
2. **A poster script** — feed `out/posts-*.jsonl` to the X API or a Nostr client
   (e.g. `nostr-tools`) on a timer. Keep it to a handful per hour, not a firehose.

Either way: **review each batch first**, and **never dump all 100 at once** — a
human cadence (every 10–20 min, with gaps) is what keeps accounts healthy and
reads as a real person, not a bot farm.

---

## Customize

- **Voice / rules** — edit the `SYSTEM` prompt in `generate.mjs`.
- **The content mix** — edit `ARCHETYPES` (weights control how often each type
  appears; `tool-mention` is deliberately rare).
- **The cycle model** — `cycle.mjs` mirrors the app; change once, both stay in sync.

---

## Guardrails baked in

- Every post is grounded in the live cycle snapshot (no generic hype).
- Hard rules against financial advice, fake stats, scammy urgency, and ad-speak.
- Near-duplicate openings are de-duplicated automatically.
- X posts over 280 chars are flagged in the output so you trim before posting.

*Not financial advice. This is a content tool — you are responsible for what you post.*
