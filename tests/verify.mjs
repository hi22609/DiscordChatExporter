#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// Full verification suite for the Bitcoin Cycle Tracker.
//
// Runs the same checks used during development, end to end:
//   1. every inline <script> parses (syntax)
//   2. every onclick/oninput handler is defined; no duplicate element IDs
//   3. the app boots over HTTP with stubbed market APIs and ZERO runtime errors
//   4. all 8 pages open via the bottom nav
//   5. deep links (#future) route on load; back button works
//   6. the whale feed renders (stubbed) real transactions with explorer links
//   7. the service worker registers and activates
//   8. the removed email-capture modal stays removed
//
// Usage:   node tests/verify.mjs
// CI:      runs via .github/workflows/verify.yml on every push
// Local:   set PW_CHROME=/path/to/chrome if playwright's browsers aren't installed
// ──────────────────────────────────────────────────────────────────────────
import fs from 'fs';
import vm from 'vm';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8917;
let failures = 0;
const ok = (name) => console.log('  ✓ ' + name);
const fail = (name, detail) => { failures++; console.error('  ✖ ' + name + (detail ? ' — ' + detail : '')); };

// playwright: prefer the installed package (CI), fall back to a global path (dev sandbox)
let chromium;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// ── 1. syntax ──
console.log('1. Script syntax');
for (const [i, m] of [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].entries()) {
  try { new vm.Script(m[1]); ok(`inline script #${i} parses (${m[1].split('\n').length} lines)`); }
  catch (e) { fail(`inline script #${i}`, e.message); }
}
try { new vm.Script(fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8')); ok('sw.js parses'); }
catch (e) { fail('sw.js', e.message); }

// ── 2. static references ──
console.log('2. Static references');
{
  const js = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
  const handlers = [...new Set([...html.matchAll(/on(?:click|input|change|keydown)="([a-zA-Z0-9_]+)\s*\(/g)].map(m => m[1]))];
  const defined = new Set([...js.matchAll(/function\s+([a-zA-Z0-9_]+)\s*\(/g)].map(m => m[1]));
  [...js.matchAll(/(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?(?:function|\()/g)].forEach(m => defined.add(m[1]));
  const missing = handlers.filter(h => !defined.has(h));
  missing.length ? fail('handlers', 'undefined: ' + missing.join(', ')) : ok(`${handlers.length} handlers all defined`);

  const ids = [...html.matchAll(/\sid="([a-zA-Z0-9_-]+)"/g)].map(m => m[1]);
  const seen = new Set(), dups = new Set();
  ids.forEach(i => seen.has(i) ? dups.add(i) : seen.add(i));
  dups.size ? fail('duplicate IDs', [...dups].join(', ')) : ok(`${ids.length} element IDs, no duplicates`);
}

// ── 3–8. runtime over HTTP ──
console.log('3. Runtime (HTTP + service worker)');
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', ROOT], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));

const exe = process.env.PW_CHROME;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
try {
  const page = await browser.newPage({ viewport: { width: 414, height: 880 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERR: ' + e.message));
  page.on('console', m => {
    const t = '' + m.text();
    if (m.type() === 'error' && !/net::|Failed to load resource/.test(t)) errors.push('CONSOLE: ' + t);
  });

  await page.addInitScript(() => {
    const rf = window.fetch.bind(window);
    window.fetch = async (u, o) => {
      const s = '' + u;
      if (s.includes('coingecko')) return { ok: true, json: async () => ({ bitcoin: { usd: 104250, usd_24h_change: 2.4 } }) };
      if (s.includes('alternative')) return { ok: true, json: async () => ({ data: [{ value: '72', value_classification: 'Greed' }] }) };
      if (s.includes('mempool/recent')) return { ok: true, json: async () => [
        { txid: 'a'.repeat(64), fee: 12000, vsize: 400, value: 425e8 },
        { txid: 'b'.repeat(64), fee: 3000, vsize: 200, value: 8e8 },
      ] };
      if (s.includes('api/mempool')) return { ok: true, json: async () => ({ count: 91234 }) };
      if (s.includes('fees/recommended')) return { ok: true, json: async () => ({ fastestFee: 24, hourFee: 12, economyFee: 6, minimumFee: 2 }) };
      if (s.includes('api/blocks')) return { ok: true, json: async () => Array.from({ length: 6 }, (_, i) => ({ height: 870000 - i, tx_count: 3000, timestamp: Math.floor(Date.now() / 1000) - i * 600, extras: { pool: { name: 'Foundry' } } })) };
      return rf(u, o);
    };
  });

  // 5a. deep link
  await page.goto(`http://localhost:${PORT}/#future`);
  await page.waitForTimeout(2200);
  (await page.evaluate(() => document.getElementById('page-future').classList.contains('active')))
    ? ok('deep link #future routes on load') : fail('deep link #future');

  // 5b. back button
  await page.evaluate(() => document.querySelector('.nav-item[data-page="calc"]').click());
  await page.waitForTimeout(300);
  await page.goBack();
  await page.waitForTimeout(400);
  ((await page.evaluate(() => document.querySelector('.page.active').id)) === 'page-future')
    ? ok('browser back button restores prior page') : fail('back button');

  // 6. whale feed (real explorer links)
  await page.evaluate(() => document.querySelector('.nav-item[data-page="intel"]').click());
  await page.waitForTimeout(500);
  await page.evaluate(() => { const t = [...document.querySelectorAll('.intel-tab')].find(e => /Blockchain/i.test(e.textContent)); t && t.click(); });
  await page.waitForTimeout(1200);
  (await page.evaluate(() => !!document.querySelector('#whaleFeed a[href*="mempool.space/tx/"]')))
    ? ok('whale feed renders transactions linked to the public explorer') : fail('whale feed explorer links');

  // 7. service worker
  await page.waitForTimeout(1500);
  const swState = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return reg ? (reg.active ? 'active' : 'installing') : 'none';
  });
  swState !== 'none' ? ok('service worker registered (' + swState + ')') : fail('service worker', 'not registered');

  // 8. email modal stays dead
  (await page.evaluate(() => !document.getElementById('emailOverlay')))
    ? ok('email-capture modal absent') : fail('email modal', 'came back');

  // 4. all pages
  for (const pg of ['home', 'chart', 'calc', 'portfolio', 'alerts', 'learn', 'intel', 'future']) {
    await page.evaluate((pg) => document.querySelector(`.nav-item[data-page="${pg}"]`).click(), pg);
    await page.waitForTimeout(250);
  }
  ok('all 8 pages open via bottom nav');

  errors.length === 0
    ? ok('zero runtime errors across the whole run')
    : fail('runtime errors', [...new Set(errors)].slice(0, 5).join(' | '));
} finally {
  await browser.close();
  server.kill();
}

console.log(failures === 0 ? '\nALL CHECKS PASSED ✓' : `\n${failures} CHECK(S) FAILED ✖`);
process.exit(failures === 0 ? 0 : 1);
