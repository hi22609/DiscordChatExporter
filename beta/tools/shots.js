// Captures the BETA share page and app at the viewports named in the brief,
// in both themes, into WTM_REPORTS/screenshots/.
const { chromium } = require('playwright-core');
const path = require('path');
const OUT = path.join(__dirname, '..', '..', 'WTM_REPORTS', 'screenshots');
const URL = 'file://' + path.join(__dirname, '..', 'dist', 'wtm-share.html');

const VIEWS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet',  width: 768,  height: 1024 },
  { name: 'mobile',  width: 375,  height: 812 },
];

(async () => {
  const b = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
    args: ['--no-sandbox'],
  });
  for (const theme of ['light', 'dark']) {
    for (const v of VIEWS) {
      const page = await b.newPage({ viewport: { width: v.width, height: v.height }, colorScheme: theme });
      page.setDefaultTimeout(8000);
      await page.goto(URL, { timeout: 15000 });
      await page.waitForTimeout(700);
      await page.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('in')));
      await page.waitForTimeout(200);
      await page.screenshot({ path: `${OUT}/beta-landing-${v.name}-${theme}-after.png` });
      await b.contexts && page.close();
    }
  }
  // The app itself, fullscreen, on mobile.
  for (const theme of ['light', 'dark']) {
    const page = await b.newPage({ viewport: { width: 390, height: 844 }, colorScheme: theme });
    page.setDefaultTimeout(8000);
    await page.goto(URL, { timeout: 15000 });
    await page.waitForTimeout(500);
    await page.click('nav button.btn-primary');
    await page.waitForTimeout(1100);
    let f = null;
    for (const fr of page.frames()) {
      if (fr === page.mainFrame()) continue;
      if (await fr.locator('button.wlc-btn').count()) { f = fr; break; }
    }
    await page.screenshot({ path: `${OUT}/beta-welcome-mobile-${theme}-after.png` });
    await f.click('button.wlc-btn'); await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/beta-feed-mobile-${theme}-after.png` });
    await f.click('#scr-moves .tab[onclick*=\"map\"]'); await page.waitForTimeout(1100);
    await page.screenshot({ path: `${OUT}/beta-map-mobile-${theme}-after.png` });
    await f.click('#scr-map .tab[onclick*=\"moves\"]'); await page.waitForTimeout(400);
    await f.click('.card'); await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/beta-movesheet-mobile-${theme}-after.png` });
    await page.close();
  }
  await b.close();
  console.log('screenshots written to WTM_REPORTS/screenshots/');
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
