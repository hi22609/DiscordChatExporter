// Drives the Ask screen in a real browser: typed query, example chip, the
// no-match path, and opening a result.
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(6000);
  const errs = [];
  page.on('pageerror', e => errs.push('PAGE: ' + e.message.slice(0, 140)));
  page.on('console', m => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/ERR_TUNNEL_CONNECTION_FAILED|ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(t)) return;
    errs.push('CON: ' + t.slice(0, 140));
  });
  await page.goto('file://' + __dirname + '/../dist/wtm-share.html', { timeout: 15000 });
  await page.waitForTimeout(600);
  await page.click('nav button.btn-primary'); await page.waitForTimeout(1100);
  let f = null;
  for (const fr of page.frames()) { if (fr === page.mainFrame()) continue; if (await fr.locator('button.wlc-btn').count()) { f = fr; break; } }
  await f.click('button.wlc-btn'); await page.waitForTimeout(700);

  await f.click('#scr-moves .tab[onclick*=\"ask\"]'); await page.waitForTimeout(500);
  console.log('ask screen active:', await f.locator('#scr-ask.active').count());
  console.log('example chips:', await f.locator('.ask-chip').count());

  await f.fill('#ask-in', 'find me a skate spot near me');
  await f.click('.ask-go'); await page.waitForTimeout(400);
  console.log('results for skate:', await f.locator('.ask-card').count());
  console.log('top result:', (await f.locator('.ask-card-name').first().innerText()).trim());
  console.log('reason chips on top result:', await f.locator('.ask-card').first().locator('.ask-why').count());

  await f.fill('#ask-in', 'pierogi'); await f.click('.ask-go'); await page.waitForTimeout(300);
  console.log('no-match state shown:', await f.locator('.ask-empty').count(), '| cards:', await f.locator('.ask-card').count());

  await f.click('.ask-chip:nth-child(2)'); await page.waitForTimeout(400);
  console.log('after example chip, results:', await f.locator('.ask-card').count());

  await f.click('.ask-card'); await page.waitForTimeout(600);
  console.log('spot sheet open:', await f.locator('.sheet.open').count());
  await f.click('[data-act="spot-map"]'); await page.waitForTimeout(900);
  console.log('routed to map:', await f.locator('#scr-map.active').count());

  console.log('ERRORS:', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
