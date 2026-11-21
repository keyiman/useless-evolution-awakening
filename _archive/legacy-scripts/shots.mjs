import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const OUT = '报告/figs';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1680, height: 1050 }, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

const shot = async (name, ms = 2500) => {
  await page.waitForTimeout(ms);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('shot', name);
};

// 1. 引导页
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.intro', { timeout: 15000 });
await shot('fig-intro', 1200);

// 2. 示范链最终代（GLB）
await page.goto('http://localhost:5173/?demo=cup&gen=5&spin=0', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.hud-title', { timeout: 15000 });
await page.waitForTimeout(6000);
await page.screenshot({ path: `${OUT}/fig-main.png` });
console.log('shot fig-main');

await page.locator('.lineage-wrap').screenshot({ path: `${OUT}/fig-lineage.png` });
await page.locator('.gene-panel-wrap').screenshot({ path: `${OUT}/fig-panel.png` });
await page.locator('.candidates').screenshot({ path: `${OUT}/fig-candidates.png` });
console.log('shots elements');

// 3. 无用性测试
await page.getByRole('button', { name: '无用性测试' }).click();
await shot('fig-test', 1500);

// 4. 分享卡
await page.getByRole('button', { name: '返回观察' }).click();
await page.getByRole('button', { name: '分享' }).click();
await shot('fig-share', 800);

// 5. 纯舞台：G0 / G3 / G5
for (const gen of [0, 3, 5]) {
  await page.goto(`http://localhost:5173/?demo=cup&gen=${gen}&stage=1&spin=0`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('canvas', { timeout: 15000 });
  await page.waitForTimeout(6000);
  await page.screenshot({ path: `${OUT}/fig-asset-g${gen}.png` });
  console.log('shot asset g' + gen);
}

// 6. 完成
console.log('errors:', errors.length ? errors : 'none');
await browser.close();

