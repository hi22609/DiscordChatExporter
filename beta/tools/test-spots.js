// Drives the spot submission and review flow in a real browser.
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
    if (/ERR_TUNNEL_CONNECTION_FAILED|ERR_NAME_NOT_RESOLVED|Failed to load resource/.test(t)) return;
    errs.push('CON: ' + t.slice(0, 140));
  });
  await page.goto('file://' + __dirname + '/../dist/wtm-share.html', { timeout: 15000 });
  await page.waitForTimeout(600);
  await page.click('nav button.btn-primary'); await page.waitForTimeout(1100);
  let f = null;
  for (const fr of page.frames()) { if (fr === page.mainFrame()) continue; if (await fr.locator('button.wlc-btn').count()) { f = fr; break; } }
  await f.click('button.wlc-btn'); await page.waitForTimeout(700);
  await f.click('#scr-moves .tab[onclick*="ask"]'); await page.waitForTimeout(400);

  console.log('queue badge:', (await f.locator('#rq-n').innerText()).trim());

  // Submit something that should be flagged
  await f.click('[data-act="sb-open"]'); await page.waitForTimeout(500);
  await f.fill('#sb-name', "Marcus's basement");
  await f.fill('#sb-blurb', 'my boy has a place we chill at all the time');
  await f.click('[data-act="sb-cat"][data-arg="chill"]');
  await f.click('[data-act="sb-check"]'); await page.waitForTimeout(400);
  console.log('verdict shown :', (await f.locator('.sb-verdict').innerText()).trim());
  console.log('checks listed :', await f.locator('.sb-check').count());
  console.log('flags raised  :', await f.locator('.sb-review, .sb-reject').count());
  await page.screenshot({ path: __dirname + '/../../WTM_REPORTS/screenshots/beta-spot-submit-mobile-dark-after.png' });

  // Review queue, then publish one
  await f.click('#sheet-overlay', { position: { x: 10, y: 10 } }).catch(() => {});
  await page.waitForTimeout(400);
  await f.click('[data-act="rq-open"]'); await page.waitForTimeout(500);
  const before = await f.locator('.rq-card').count();
  console.log('queue cards   :', before);
  console.log('verdicts      :', (await f.locator('.rq-verdict').allInnerTexts()).join(', '));
  await page.screenshot({ path: __dirname + '/../../WTM_REPORTS/screenshots/beta-spot-queue-mobile-dark-after.png' });
  await f.click('.rq-yes'); await page.waitForTimeout(600);
  console.log('after publish :', await f.locator('.rq-card').count(), 'cards left');

  console.log('ERRORS:', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
