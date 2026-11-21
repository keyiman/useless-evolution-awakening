import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
await p.goto('http://127.0.0.1:5174/?tree=1', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(4000);
console.log('URL', p.url());
console.log('body', (await p.locator('body').innerText()).slice(0, 300).replace(/\n/g, ' | '));
console.log('app', await p.locator('.app').count(), 'lab', await p.locator('.lab').count());
await b.close();
