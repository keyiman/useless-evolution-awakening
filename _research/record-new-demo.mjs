import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

mkdirSync('提交材料/video-new-raw', { recursive: true });
const b = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
});
const ctx = await b.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: '提交材料/video-new-raw', size: { width: 1440, height: 900 } },
});
const p = await ctx.newPage();
const wait = (ms) => p.waitForTimeout(ms);
await p.addInitScript(() => {
  localStorage.setItem('living-stage-cup', '0');
  for (const id of ['chair', 'umbrella', 'bin']) localStorage.setItem(`living-stage-${id}`, '4');
  localStorage.setItem('living-active-exhibit', 'cup');
});
await p.goto('http://127.0.0.1:8787/?object=cup&r=newvid', { waitUntil: 'domcontentloaded' });
await p.waitForSelector('.life-gallery[data-ready="true"]', { timeout: 30000 });
await wait(5000);
await p.locator('button', { hasText: '让它苏醒' }).click();
await wait(5600);
await p.locator('.life-timeline button').nth(4).click();
await wait(7800);
await p.locator('button', { hasText: '再看它动起来' }).click();
await wait(4200);

for (const id of ['chair', 'umbrella', 'bin']) {
  await p.locator(`[data-object="${id}"]`).click();
  await p.waitForSelector('.life-gallery[data-ready="true"]', { timeout: 30000 });
  await wait(2600);
  await p.locator('button', { hasText: '再看它动起来' }).click();
  await wait(4600);
}

await p.goto('http://127.0.0.1:8787/?create=1&r=newvid-workshop', { waitUntil: 'domcontentloaded' });
await wait(3200);
await ctx.close();
await b.close();
console.log('new demo recorded');