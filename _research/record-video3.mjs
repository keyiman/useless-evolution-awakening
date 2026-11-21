import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

mkdirSync('提交材料/video-raw3', { recursive: true });
const b = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
});
const ctx = await b.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: '提交材料/video-raw3', size: { width: 1440, height: 900 } },
  permissions: ['clipboard-read', 'clipboard-write'],
});
const p = await ctx.newPage();
const wait = (ms) => p.waitForTimeout(ms);
const code = (o) => Buffer.from(JSON.stringify(o)).toString('base64').replace(/=+$/, '');
const clickCard = async (name) => {
  const c = p.locator('.organ-card', { hasText: name });
  await c.scrollIntoViewIfNeeded();
  await c.click();
};

await p.goto('http://127.0.0.1:5174/?r=video3', { waitUntil: 'domcontentloaded' });
await wait(6500);
await clickCard('轮式底盘');
await wait(2600);
await clickCard('防护笼');
await wait(3200);
await p.locator('button', { hasText: '运行无用性测试' }).click();
await wait(5200);

await p.goto(`http://127.0.0.1:5174/?r=video3-hero#lab=${code({ f: 'cup', o: ['seal', 'arm', 'wheels', 'shell'], s: 'LAB-001' })}`, { waitUntil: 'domcontentloaded' });
await wait(4800);

await p.goto(`http://127.0.0.1:5174/?r=video3-fusion#lab=${code({ f: 'cup', o: ['seal', 'arm'], s: 'LAB-001', x: 'chair' })}`, { waitUntil: 'domcontentloaded' });
await wait(5200);

await p.goto('http://127.0.0.1:5174/?r=video3-auto', { waitUntil: 'domcontentloaded' });
await wait(4200);
await p.locator('button', { hasText: '让它自己变异' }).click();
await wait(11000);
await p.locator('button', { hasText: '分享' }).click();
await wait(2800);

await ctx.close();
await b.close();
console.log('video3 saved');
