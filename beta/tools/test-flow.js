const {chromium} = require('playwright-core');
(async()=>{
  const browser = await chromium.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
  const page = await browser.newPage({viewport:{width:390,height:844}});
  page.setDefaultTimeout(6000);
  const errors=[];
  page.on('pageerror',e=>errors.push('PAGE: '+e.message.slice(0,120)));
  page.on('console',m=>{
    if(m.type()!=='error')return;
    const t=m.text();
    // A blocked CDN/tile fetch is expected offline and inside the artifact
    // sandbox; the app is designed to fall back to the canvas map. Only real
    // application errors should fail this test.
    if(/ERR_TUNNEL_CONNECTION_FAILED|ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(t))return;
    errors.push('CON: '+t.slice(0,120));
  });
  await page.goto('file://'+__dirname+'/../dist/wtm-share.html',{timeout:15000});
  await page.waitForTimeout(700);
  await page.click('nav button.btn-primary'); await page.waitForTimeout(1100);
  let frame=null;
  for(const f of page.frames()){if(f===page.mainFrame())continue;if(await f.locator('button.wlc-btn').count()>0){frame=f;break;}}
  await frame.click('button.wlc-btn'); await page.waitForTimeout(700);
  const ok=[];
  // full nav cycle x2 (loop leak check)
  for(let r=0;r<2;r++){
    await frame.click('#scr-moves .tab[onclick*=\"map\"]'); await page.waitForTimeout(500); // map
    await frame.click('#scr-map .tab[onclick*=\"friends\"]'); await page.waitForTimeout(300); // friends
    await frame.click('#scr-friends .tab[onclick*=\"profile\"]'); await page.waitForTimeout(300); // profile
    await frame.click('#scr-profile .tab[onclick*=\"moves\"]'); await page.waitForTimeout(300); // moves
  }
  // after cycling on/off map twice, is there still just one loop?
  await frame.click('#scr-moves .tab[onclick*=\"map\"]'); await page.waitForTimeout(500);
  const loops = await frame.evaluate(()=>{const o=requestAnimationFrame;let c=0;window.requestAnimationFrame=f=>{c++;return o(f)};return new Promise(r=>setTimeout(()=>{window.requestAnimationFrame=o;r(c)},500))});
  ok.push('loops after 2 on/off map cycles (want ~30): '+loops);
  // story
  await frame.click('#scr-map .tab[onclick*=\"moves\"]'); await page.waitForTimeout(400);
  await frame.click('.story'); await page.waitForTimeout(700);
  ok.push('story viewer open: '+(await frame.locator('#story-viewer.open').count()));
  await frame.click('.sv-close'); await page.waitForTimeout(300);
  // sheet
  await frame.click('.card'); await page.waitForTimeout(500);
  ok.push('sheet open: '+(await frame.locator('.sheet.open').count()));
  ok.push('who-going avatars: '+(await frame.locator('.going-av').count()));
  await frame.click('#sheet-overlay',{position:{x:10,y:10}}).catch(()=>{});
  // search
  await frame.fill('#search-in','rooftop'); await page.waitForTimeout(400);
  ok.push('search "rooftop" cards: '+(await frame.locator('.card').count()));
  await frame.click('#search-clear'); await page.waitForTimeout(300);
  // create move
  await frame.click('.fab'); await page.waitForTimeout(400);
  await frame.fill('#ci-title','Test Move'); await frame.click('.create-cat:first-child');
  await frame.click('.create-submit'); await page.waitForTimeout(500);
  ok.push('after create, cards: '+(await frame.locator('.card').count()));
  console.log(ok.join('\n'));
  console.log('ERRORS:',errors.length?errors.join(' | '):'none');
  await browser.close();
})().catch(e=>{console.error('FATAL',e.message);process.exit(1)});
