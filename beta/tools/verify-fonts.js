// Confirms the embedded faces actually load rather than silently falling back
// to system sans, and that both themes resolve their tokens.
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', args: ['--no-sandbox'] });
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('file://' + __dirname + '/../dist/wtm-share.html', { timeout: 15000 });
  await page.waitForTimeout(500);
  const r = await page.evaluate(async () => {
    await document.fonts.ready;
    const loaded = [...document.fonts].map(f => `${f.family} ${f.weight} ${f.status}`);
    const cs = (sel, prop) => getComputedStyle(document.querySelector(sel)).getPropertyValue(prop);
    const widthIn = (family) => {
      const c = document.createElement('canvas').getContext('2d');
      c.font = `700 40px ${family}`;
      return Math.round(c.measureText('WTM Moving Tonight').width);
    };
    return {
      loaded,
      h1Family: cs('h1', 'font-family'),
      bodyFamily: cs('body', 'font-family'),
      // If the custom face failed, these would equal the fallback width.
      wDisplay: widthIn("'WTM Display'"), wSans: widthIn("'WTM Sans'"),
      wFallback: widthIn('system-ui'), wMono: widthIn("'WTM Mono'"),
      signal: cs(':root', '--signal').trim(),
      ink: cs(':root', '--ink-900').trim(),
    };
  });
  console.log('faces loaded:', r.loaded.join(' | '));
  console.log('h1 family  :', r.h1Family);
  console.log('body family:', r.bodyFamily);
  console.log(`widths -> display ${r.wDisplay}  sans ${r.wSans}  mono ${r.wMono}  system fallback ${r.wFallback}`);
  console.log('distinct from fallback:', r.wDisplay !== r.wFallback && r.wSans !== r.wFallback);
  console.log('tokens -> signal', r.signal, '| ink-900', r.ink);
  await b.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
