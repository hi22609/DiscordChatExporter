const { chromium } = require('playwright-core');
const OUT='/home/user/DiscordChatExporter/WTM_REPORTS/screenshots';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', args: ['--no-sandbox'] });
  for (const theme of ['dark','light']) {
    const page = await b.newPage({ viewport: { width: 390, height: 844 }, colorScheme: theme, deviceScaleFactor: 2 });
    page.setDefaultTimeout(8000);
    await page.goto('file:///home/user/DiscordChatExporter/beta/dist/wtm-share.html');
    await page.waitForTimeout(600);
    await page.click('nav button.btn-primary'); await page.waitForTimeout(1100);
    let f=null; for (const fr of page.frames()){if(fr===page.mainFrame())continue;if(await fr.locator('button.wlc-btn').count()){f=fr;break;}}
    await f.click('button.wlc-btn'); await page.waitForTimeout(600);
    await f.click('#scr-moves .tab[onclick*="ask"]'); await page.waitForTimeout(400);
    await page.screenshot({path:`${OUT}/beta-ask-empty-mobile-${theme}-after.png`});
    await f.fill('#ask-in','quiet place to watch the sunset');
    await f.click('.ask-go'); await page.waitForTimeout(500);
    await page.screenshot({path:`${OUT}/beta-ask-results-mobile-${theme}-after.png`});
    await page.close();
  }
  await b.close(); console.log('ask screenshots written');
})().catch(e=>{console.error('FATAL',e.message);process.exit(1)});
