import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
const code = Buffer.from(JSON.stringify({f:'cup',o:['handle'],s:'LAB-001'})).toString('base64').replace(/=+$/,'');
await p.goto(`http://127.0.0.1:5174/?r=handle2#lab=${code}`, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(5500);
await p.screenshot({ path: '_research/handle2.png' });
await b.close();
