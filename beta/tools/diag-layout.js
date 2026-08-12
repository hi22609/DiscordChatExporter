const {chromium} = require('playwright-core');
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
  const page = await b.newPage({viewport:{width:390,height:844}});
  page.setDefaultTimeout(6000);
  await page.goto('file://'+__dirname+'/../dist/wtm-share.html',{timeout:15000});
  await page.waitForTimeout(600);
  await page.click('nav button.btn-primary'); await page.waitForTimeout(1100);
  let f=null;
  for(const fr of page.frames()){if(fr===page.mainFrame())continue;if(await fr.locator('button.wlc-btn').count()>0){f=fr;break;}}
  await f.click('button.wlc-btn'); await page.waitForTimeout(500);
  await f.click('#scr-moves .tab:nth-child(2)'); await page.waitForTimeout(1000);
  const d = await f.evaluate(()=>{
    const g=s=>{const e=document.querySelector(s);if(!e)return'MISSING';const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return{top:Math.round(r.top),bottom:Math.round(r.bottom),h:Math.round(r.height),pos:cs.position,cssBottom:cs.bottom};};
    return{scr:g('#scr-map'),hint:g('#map-hint'),ctrls:g('.map-ctrls'),tabbar:g('#scr-map .tabbar'),topbar:g('.map-topbar'),canvas:g('#map-canvas'),
      safeB:getComputedStyle(document.documentElement).getPropertyValue('--safe-b'),innerH:innerHeight};
  });
  console.log(JSON.stringify(d,null,1));
  await b.close();
})().catch(e=>{console.error('FATAL',e.message);process.exit(1)});
