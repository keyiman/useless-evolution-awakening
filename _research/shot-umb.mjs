import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
await p.goto('http://localhost:5173/?demo=umbrella&gen=5&stage=1&spin=0', { waitUntil:'domcontentloaded' });
await p.waitForSelector('canvas'); await p.waitForTimeout(4000);
await p.screenshot({ path:'_research/audit3d/umbrella-final.png' });
await b.close();
