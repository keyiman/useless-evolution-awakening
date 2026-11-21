import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
await p.goto('http://127.0.0.1:5174/?r=finalcheck', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(8000);
console.log('cards', await p.locator('.organ-card').count(), 'pending', await p.locator('.organ-card.pending').count());
console.log('score', (await p.locator('.lab-score').innerText()).replace(/\n/g,' '));
await b.close();
