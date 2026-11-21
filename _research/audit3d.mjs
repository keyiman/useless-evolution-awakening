import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const OUT = '_research/audit3d';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });

for (const fam of ['cup', 'chair', 'umbrella', 'bin']) {
  for (const gen of [0, 5]) {
    await page.goto(`http://localhost:5173/?demo=${fam}&gen=${gen}&stage=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(5500);
    await page.screenshot({ path: `${OUT}/${fam}-g${gen}.png` });
    console.log(fam, gen);
  }
}

// 测试模式
for (const fam of ['cup', 'chair', 'umbrella', 'bin']) {
  await page.goto(`http://localhost:5173/?demo=${fam}&gen=5`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.hud-title', { timeout: 15000 });
  await page.waitForTimeout(3000);
  await page.getByRole('button', { name: '无用性测试' }).click();
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${OUT}/${fam}-test.png` });
  console.log(fam, 'test');
}

console.log('errors:', errors.length ? errors : 'none');
await browser.close();
