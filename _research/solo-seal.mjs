import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
await p.goto('http://127.0.0.1:5174/?demo=cup&gen=0&glb=/models/7b9814aa9374cb6c28d7.glb&stage=1&spin=0&r=seal', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(7000);
await p.screenshot({ path: '_research/solo-seal.png' });
await b.close();
