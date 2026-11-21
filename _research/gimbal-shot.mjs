import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
await p.goto('http://127.0.0.1:5174/?demo=cup&gen=0&glb=/models/08c6bcbc8f8fefbb3c4e.glb&stage=1&spin=0', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(9000);
await p.screenshot({ path: '_research/gimbal.png' });
console.log('canvas', await p.locator('canvas').count());
await b.close();
