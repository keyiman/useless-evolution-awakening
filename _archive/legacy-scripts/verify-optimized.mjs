import { chromium } from 'playwright-core';

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
const glbs = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text().slice(0, 200));
});
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message.slice(0, 200)));
page.on('response', (r) => {
  if (r.url().endsWith('.glb')) glbs.push({ url: r.url().split('/').pop(), status: r.status(), len: r.headers()['content-length'] });
});

for (const fam of ['cup', 'chair', 'umbrella', 'bin']) {
  await page.goto(`http://localhost:5173/?demo=${fam}&gen=5&stage=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('canvas', { timeout: 15000 });
  await page.waitForTimeout(6000);
  await page.screenshot({ path: `_research/opt-${fam}.png` });
  console.log(fam, 'ok');
}

console.log('glb', JSON.stringify(glbs));
console.log('errors', errors.length ? errors : 'none');
await browser.close();
