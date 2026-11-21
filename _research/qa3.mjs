import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1680, height: 1050 }, deviceScaleFactor: 2 });
await p.goto('http://localhost:5173/?demo=cup&gen=5', { waitUntil: 'domcontentloaded' });
await p.waitForSelector('.hud-title', { timeout: 15000 });
await p.waitForTimeout(5000);
await p.locator('.lineage-wrap').screenshot({ path: '_research/lineage5.png' });
await p.getByRole('button', { name: '无用性测试' }).click();
await p.waitForTimeout(2500);
await p.locator('.test-panel').screenshot({ path: '_research/testpanel5.png' });
console.log('ok');
await b.close();

