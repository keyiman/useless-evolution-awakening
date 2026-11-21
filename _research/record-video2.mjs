import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

mkdirSync('提交材料/video-raw2', { recursive: true });
const b = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
});
const ctx = await b.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: '提交材料/video-raw2', size: { width: 1440, height: 900 } },
  permissions: ['clipboard-read', 'clipboard-write'],
});
const p = await ctx.newPage();
const wait = (ms) => p.waitForTimeout(ms);
const clickCard = async (name) => {
  const c = p.locator('.organ-card', { hasText: name });
  await c.scrollIntoViewIfNeeded();
  await c.click();
};

await p.goto('http://127.0.0.1:5174/?r=video2', { waitUntil: 'domcontentloaded' });
await wait(7000);
await clickCard('轮式底盘');
await wait(3500);
await clickCard('防护笼');
await wait(4000);
await p.locator('button', { hasText: '运行无用性测试' }).click();
await wait(4500);
await p.locator('button', { hasText: '返回观察' }).click();
await wait(1200);
await p.locator('.fusion-chip', { hasText: '椅子' }).click();
await wait(4500);
await p.locator('.fusion-chip', { hasText: '不融合' }).click();
await wait(800);
await p.locator('button', { hasText: '让它自己变异' }).click();
await wait(11000);
await p.locator('button', { hasText: '分享' }).click();
await wait(2500);
await ctx.close();
await b.close();
console.log('video saved');
