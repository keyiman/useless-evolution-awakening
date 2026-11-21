import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
await p.goto('http://127.0.0.1:5174/?demo=cup&gen=0&glb=/models/a66d98ffeba95a575fec.glb&stage=1&spin=0&r=balloon', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(7000);
await p.screenshot({ path: '_research/solo-balloon.png' });
await b.close();
