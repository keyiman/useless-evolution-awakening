import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
await p.goto('http://127.0.0.1:5174/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(5000);
await p.locator('.organ-card', { hasText: '稳定环' }).click();
await p.waitForTimeout(9000);
await p.screenshot({ path: '_research/lab-06.png' });
await b.close();
