const {chromium} = require('playwright-core');
(async()=>{
  const browser = await chromium.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
  const page = await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
  page.setDefaultTimeout(6000);
  await page.goto('file://'+__dirname+'/wtm-share.html',{timeout:15000});
  await page.waitForTimeout(700);
  await page.screenshot({path:'v-landing.png'});
  await page.click('button.nav-cta'); await page.waitForTimeout(1100);
  let frame=null;
  for(const f of page.frames()){if(f===page.mainFrame())continue;if(await f.locator('button.wlc-btn').count()>0){frame=f;break;}}
  await frame.click('button.wlc-btn'); await page.waitForTimeout(700);
  await page.screenshot({path:'v-feed.png'});
  await frame.click('#scr-moves .tab:nth-child(2)'); await page.waitForTimeout(900);
  await page.screenshot({path:'v-map-city.png'});
  await frame.evaluate(()=>{for(let i=0;i<9;i++)zoomMap(1/1.35);}); await page.waitForTimeout(400);
  await page.screenshot({path:'v-map-metro.png'});
  await browser.close();
})().catch(e=>{console.error('FATAL',e.message);process.exit(1)});
