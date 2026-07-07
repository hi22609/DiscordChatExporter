#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// Bitcoin Cycle Tracker — AI content engine
//
// Generates a daily batch of varied, value-first social posts grounded in the
// REAL current cycle position, ready to drip through a scheduler.
//
// It does NOT post anywhere. It writes files. You (or your scheduler) post them
// at a human cadence. See README.md for why "100 spam posts" gets you banned and
// this approach doesn't.
//
//   ANTHROPIC_API_KEY=sk-ant-... node generate.mjs --count 100
//
// Flags:
//   --count N     how many posts to generate (default 100)
//   --model ID    Claude model (default claude-opus-4-8; for high volume on a
//                 budget try claude-sonnet-4-6 or claude-haiku-4-5)
//   --out DIR     output directory (default ./out)
// ──────────────────────────────────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { cycleSnapshot } from './cycle.mjs';

const APP_URL = 'https://hi22609.github.io/DiscordChatExporter/bitcoin-app/';

// ── args ──
const arg = (name, def) => {
  const i = process.argv.indexOf('--' + name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
};
const COUNT = parseInt(arg('count', '100'), 10);
const MODEL = arg('model', 'claude-opus-4-8');
const OUT_DIR = arg('out', path.join(path.dirname(new URL(import.meta.url).pathname), 'out'));
const BATCH = 10; // posts per API call — controls variety + cost

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('✖ Set ANTHROPIC_API_KEY first.  e.g.  ANTHROPIC_API_KEY=sk-ant-... node generate.mjs');
  process.exit(1);
}
const client = new Anthropic();

// Post archetypes — the mix is deliberately VALUE-FIRST. Promo is rare and soft
// (the Bitcoin community rewards teaching and punishes shilling).
const ARCHETYPES = [
  { key: 'education',      weight: 4, brief: 'Teach one Bitcoin or cycle concept in plain English. No jargon. Genuinely useful even to a no-coiner.' },
  { key: 'cycle-data',    weight: 3, brief: 'State plainly where we are in the 4-year cycle right now and what it has historically meant. Ground it in the snapshot.' },
  { key: 'contrarian',    weight: 2, brief: 'A calm, evidence-based contrarian take or myth-bust about Bitcoin or the market. No insults, no hype.' },
  { key: 'question',      weight: 2, brief: 'An open, engagement-driving question that makes people reflect on time preference, fiat, or the cycle.' },
  { key: 'history',       weight: 2, brief: 'A historical parallel — a past cycle, a fiat collapse, gold, or sound-money history — tied to today.' },
  { key: 'sovereignty',   weight: 2, brief: 'A sharp, anti-fiat / pro-self-custody / pro-freedom message. Punchy, principled, never financial advice.' },
  { key: 'orange-pill',   weight: 2, brief: 'A simple analogy that helps a normal person finally "get" why Bitcoin matters. Warm, not preachy.' },
  { key: 'tool-mention',  weight: 1, brief: `A soft, non-spammy mention that a free, open-source, no-tracking cycle tracker exists (${APP_URL}). Lead with the value, mention the tool once at the end.` },
];

function pickArchetype() {
  const pool = ARCHETYPES.flatMap(a => Array(a.weight).fill(a));
  return pool[Math.floor(Math.random() * pool.length)];
}

const SYSTEM = `You write social posts for an independent, open-source Bitcoin cycle tracker.

VOICE: sharp, sovereign, anti-fiat, pro-freedom — but HONEST and grounded. You sound like a thoughtful Bitcoiner, not a hype account or a scammer. You stick it to central banks and the fiat system, not to people.

HARD RULES:
- NEVER give financial advice or promise returns. Frame projections as a model, not a prophecy.
- NEVER use scammy urgency, fake stats, "you're early", giveaways, or "to the moon" filler.
- NEVER sound like an ad. Lead with something genuinely useful or interesting.
- No emojis spam (0–2 max). No hashtag walls. Plain, confident language.
- Each post must stand on its own and be DISTINCT from the others — vary the angle, opening, and structure.
- X posts MUST be ≤ 280 characters including hashtags. Nostr posts can be longer (up to ~500 chars) and more raw.
- It is fine — encouraged — for most posts to never mention the tracker at all. Value first.`;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    posts: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          platform:  { type: 'string', enum: ['x', 'nostr'] },
          archetype: { type: 'string' },
          text:      { type: 'string' },
          hashtags:  { type: 'array', items: { type: 'string' } },
        },
        required: ['platform', 'archetype', 'text', 'hashtags'],
      },
    },
  },
  required: ['posts'],
};

function buildUserPrompt(snap, n, avoidOpenings) {
  const assignments = Array.from({ length: n }, () => {
    const a = pickArchetype();
    const platform = Math.random() < 0.6 ? 'x' : 'nostr';
    return `- platform=${platform}, archetype=${a.key}: ${a.brief}`;
  }).join('\n');

  return `CURRENT CYCLE SNAPSHOT (use it — write about THIS moment, not generic hype):
- Cycle day ${snap.day} of ${snap.cycleLength} (${snap.progressPct}% through the 4-year cycle)
- Phase: ${snap.phaseName} — ${snap.phaseDesc}
- Direction: ${snap.direction}
- Model verdict: ${snap.verdict} (suggested behavior: ${snap.action}); risk level: ${snap.risk}
- ${snap.nextEvent.inDays} days to the ${snap.nextEvent.name}
- Long-term ATH model range: $${snap.athTargets.bear.toLocaleString()}–$${snap.athTargets.bull.toLocaleString()} per coin

Write exactly ${n} posts, one for each assignment below. Make every post distinct.
${assignments}

${avoidOpenings.length ? `Do NOT start any post the same way as these already-written openings:\n${avoidOpenings.map(o => '· ' + o).join('\n')}` : ''}

Return JSON matching the schema: { "posts": [ { platform, archetype, text, hashtags } ] }`;
}

function firstWords(t, n = 6) {
  return t.trim().split(/\s+/).slice(0, n).join(' ').toLowerCase();
}

async function main() {
  const snap = cycleSnapshot();
  console.log(`▸ Cycle day ${snap.day}/${snap.cycleLength} · ${snap.phaseName} · verdict ${snap.verdict}`);
  console.log(`▸ Generating ${COUNT} posts with ${MODEL} ...`);

  const all = [];
  const seen = new Set();

  while (all.length < COUNT) {
    const need = Math.min(BATCH, COUNT - all.length);
    const avoid = all.slice(-12).map(p => firstWords(p.text));
    let resp;
    try {
      resp = await client.messages.create({
        model: MODEL,
        max_tokens: 4000,
        system: SYSTEM,
        output_config: { format: { type: 'json_schema', schema: SCHEMA } },
        messages: [{ role: 'user', content: buildUserPrompt(snap, need, avoid) }],
      });
    } catch (e) {
      console.error('  API error:', e.message, '— retrying in 5s');
      await new Promise(r => setTimeout(r, 5000));
      continue;
    }

    const textBlock = resp.content.find(b => b.type === 'text');
    let parsed;
    try { parsed = JSON.parse(textBlock.text); }
    catch { console.error('  could not parse a batch, skipping'); continue; }

    for (const p of parsed.posts || []) {
      const key = firstWords(p.text, 8);
      if (seen.has(key)) continue;          // dedupe near-identical openings
      seen.add(key);
      const overLimit = p.platform === 'x' && p.text.length > 280;
      all.push({ ...p, chars: p.text.length, overLimit, ts: new Date().toISOString() });
      if (all.length >= COUNT) break;
    }
    process.stdout.write(`  ${all.length}/${COUNT}\r`);
  }

  // ── write outputs ──
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const jsonlPath = path.join(OUT_DIR, `posts-${stamp}.jsonl`);
  const mdPath = path.join(OUT_DIR, `posts-${stamp}.md`);

  fs.writeFileSync(jsonlPath, all.map(p => JSON.stringify(p)).join('\n') + '\n');

  const md = [`# Bitcoin Cycle posts — ${stamp}`,
    `Cycle day ${snap.day}/${snap.cycleLength} · ${snap.phaseName} · verdict ${snap.verdict}`,
    `Generated ${all.length} posts with ${MODEL}. Review before posting. Drip at a sane cadence.`, '']
    .concat(all.map((p, i) =>
      `### ${i + 1}. [${p.platform.toUpperCase()} · ${p.archetype}]${p.overLimit ? ' ⚠ OVER 280' : ''}\n` +
      `${p.text}\n` + (p.hashtags?.length ? `\n_${p.hashtags.map(h => h.startsWith('#') ? h : '#' + h).join(' ')}_\n` : '')
    )).join('\n');
  fs.writeFileSync(mdPath, md);

  const over = all.filter(p => p.overLimit).length;
  console.log(`\n✓ Wrote ${all.length} posts`);
  console.log(`  • ${jsonlPath}  (machine-readable, feed your scheduler)`);
  console.log(`  • ${mdPath}  (human review)`);
  if (over) console.log(`  ⚠ ${over} X posts exceeded 280 chars — flagged in the files; trim before posting.`);
  console.log(`\nReminder: post these at a human cadence (a handful/hour, not all at once). Review first.`);
}

main().catch(e => { console.error(e); process.exit(1); });
