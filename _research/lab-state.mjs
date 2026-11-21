import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
await p.goto('http://127.0.0.1:5174/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(9000);
const state = await p.evaluate(() => ({
  pending: document.querySelectorAll('.organ-card.pending').length,
  on: document.querySelectorAll('.organ-card.on').length,
  effects: document.querySelector('.lab-effects')?.innerText,
  score: document.querySelector('.lab-score')?.innerText,
  missing: document.querySelector('.lab-missing')?.textContent,
  loading: !!document.querySelector('.lab-loading'),
}));
console.log(JSON.stringify(state, null, 2));
await p.screenshot({ path: '_research/lab-02.png' });
await b.close();
