import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const OUT = '_research';
mkdirSync(OUT, { recursive: true });
const errors = [];

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('CONSOLE ' + m.text().slice(0, 300));
});
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message.slice(0, 300)));

await page.goto('http://localhost:5173/?play=1&family=cup&seed=UE-1994', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.hud-title', { timeout: 20000 });
await page.waitForTimeout(3500);
await page.screenshot({ path: `${OUT}/qa-01-g0.png` });
console.log('G0 text:', (await page.locator('.hud-title').innerText()).trim());

await page.getByRole('button', { name: '示范路线' }).click();
await page.waitForTimeout(4500);
await page.screenshot({ path: `${OUT}/qa-02-showcase.png` });
console.log('showcase title:', (await page.locator('.hud-title').innerText()).trim());
console.log('asset:', (await page.locator('.asset-text').innerText()).trim());
console.log('nodes:', await page.locator('.lineage-node').count());

await page.getByRole('button', { name: '无用性测试' }).click();
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/qa-03-test.png` });
console.log('test headline:', (await page.locator('.test-head strong').innerText()).trim());

await page.getByRole('button', { name: '返回观察' }).click();
await page.getByRole('button', { name: '分享' }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/qa-04-share.png` });
console.log('share link:', (await page.locator('.field input').first().inputValue()).slice(0, 120));
await page.locator('.modal-close').click();

await page.getByRole('button', { name: '雨伞' }).click();
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/qa-05-umbrella.png` });
console.log('umbrella title:', (await page.locator('.hud-title').innerText()).trim());

await page.getByRole('button', { name: '水杯' }).click();
await page.waitForTimeout(1500);
const firstCandidate = page.locator('.candidate .btn.primary').first();
if (await firstCandidate.count()) {
  await firstCandidate.click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${OUT}/qa-06-child.png` });
  console.log('child title:', (await page.locator('.hud-title').innerText()).trim());
  console.log('nodes after child:', await page.locator('.lineage-node').count());
}

console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
await browser.close();
