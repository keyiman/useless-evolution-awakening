import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1680, height: 1050 }, deviceScaleFactor: 2 });
await p.goto('http://localhost:5173/?demo=cup&gen=5', { waitUntil:'domcontentloaded' });
await p.waitForSelector('.hud-title'); await p.waitForTimeout(4500);
await p.screenshot({ path:'_research/audit3d/main-new.png' });
await b.close();
