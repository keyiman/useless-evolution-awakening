import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

mkdirSync('提交材料/video-clips', { recursive: true });
const b = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
});
const code = (o) => Buffer.from(JSON.stringify(o)).toString('base64').replace(/=+$/, '');
const wait = (p, ms) => p.waitForTimeout(ms);
const clickCard = async (p, name) => {
  const c = p.locator('.organ-card', { hasText: name });
  await c.scrollIntoViewIfNeeded();
  await c.click();
};

async function record(name, fn) {
  const ctx = await b.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: '提交材料/video-clips', size: { width: 1440, height: 900 } },
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const p = await ctx.newPage();
  await fn(p);
  await ctx.close();
  console.log('clip', name);
}

await record('a', async (p) => {
  await p.goto('http://127.0.0.1:5174/?r=clip-a', { waitUntil: 'domcontentloaded' });
  await wait(p, 6000);
  await clickCard(p, '轮式底盘');
  await wait(p, 3000);
  await clickCard(p, '防护笼');
  await wait(p, 3000);
  await p.locator('button', { hasText: '运行无用性测试' }).click();
  await wait(p, 5200);
});

await record('b', async (p) => {
  await p.goto(`http://127.0.0.1:5174/?r=clip-b#lab=${code({ f: 'cup', o: ['seal', 'arm'], s: 'LAB-001', x: 'chair' })}`, { waitUntil: 'domcontentloaded' });
  await wait(p, 9500);
});

await record('c', async (p) => {
  await p.goto('http://127.0.0.1:5174/?r=clip-c', { waitUntil: 'domcontentloaded' });
  await wait(p, 6000);
  await p.locator('button', { hasText: '让它自己变异' }).click();
  await wait(p, 10500);
});

await record('d', async (p) => {
  await p.goto('http://127.0.0.1:5174/?r=clip-d', { waitUntil: 'domcontentloaded' });
  await wait(p, 6000);
  await p.locator('button', { hasText: '分享' }).click();
  await wait(p, 2600);
});

await b.close();
console.log('clips saved');
