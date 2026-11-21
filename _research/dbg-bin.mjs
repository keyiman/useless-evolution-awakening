import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox'] });
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
await p.addInitScript(() => { localStorage.setItem('living-stage-bin','4'); localStorage.setItem('living-active-exhibit','bin'); });
await p.goto('http://127.0.0.1:8787/?object=bin&r=dbg-bin', { waitUntil: 'domcontentloaded' });
await p.waitForSelector('.life-gallery[data-ready="true"]', { timeout: 30000 });
await p.waitForTimeout(3000);
console.log('before', await p.locator('.life-gallery').getAttribute('data-mode'), await p.locator('.life-gallery').getAttribute('data-stage'));
const btn = p.locator('button', { hasText: '再看它动起来' });
console.log('btn count', await btn.count(), 'disabled', await btn.isDisabled().catch(()=>'?'));
await btn.click();
for (const ms of [500, 1500, 3000, 5000]) { await p.waitForTimeout(ms); console.log(ms, await p.locator('.life-gallery').getAttribute('data-mode')); await p.screenshot({ path: `_research/dbg-bin-${ms}.png` }); }
await b.close();
