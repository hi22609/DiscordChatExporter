// This container's network policy blocks every tile host and CDN, so the only
// thing verifiable here is the FAILURE path: does the page tell the truth when
// it cannot draw a map, instead of showing a blank screen?
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('file://' + __dirname + '/../map-real.html', { timeout: 20000 });
  await page.waitForTimeout(7500);
  const shown = await page.locator('#fail.show').count();
  const why = (await page.locator('#fail-why').innerText()).trim();
  const chromeVisible = await page.locator('.bar .title').isVisible();
  console.log('failure panel shown :', shown === 1 ? 'yes' : 'NO — blank screen bug');
  console.log('message             :', why);
  console.log('page chrome renders :', chromeVisible);
  await page.screenshot({ path: __dirname + '/../../WTM_REPORTS/screenshots/beta-realmap-offline-fallback.png' });
  await b.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
