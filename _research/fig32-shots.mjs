import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

mkdirSync('报告/figs', { recursive: true });
const b = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
});
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
const code = (o) => Buffer.from(JSON.stringify(o)).toString('base64').replace(/=+$/, '');
const waitReady = async () => {
  await p
    .waitForFunction(() => document.querySelectorAll('.organ-card.pending').length === 0, { timeout: 45000 })
    .catch(() => console.log('WARN still pending'));
};
const shot = async (name) => {
  await p.waitForTimeout(500);
  await p.screenshot({ path: `报告/figs/${name}.png` });
  console.log('shot', name);
};

await p.goto('http://127.0.0.1:5174/?r=fig32-default', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(5000);
await waitReady();
await shot('fig-lab-default');
await shot('fig-lab-full');

await p.goto(`http://127.0.0.1:5174/?r=fig32-hero#lab=${code({ f: 'cup', o: ['seal', 'arm', 'wheels', 'shell'], s: 'LAB-001' })}`, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(6500);
await shot('fig-lab-hero');
await p.locator('button', { hasText: '运行无用性测试' }).click();
await p.waitForTimeout(1800);
await shot('fig-lab-test');

await p.goto(`http://127.0.0.1:5174/?r=fig32-fusion#lab=${code({ f: 'cup', o: ['seal', 'arm'], s: 'LAB-001', x: 'chair' })}`, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(6000);
await shot('fig-lab-fusion');

await p.goto('http://127.0.0.1:5174/?r=fig32-auto', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(5000);
await p.locator('button', { hasText: '让它自己变异' }).click();
await p.waitForTimeout(5600);
await shot('fig-lab-auto');

await p.goto('http://127.0.0.1:5174/?tree=1&r=fig32-legacy', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(6000);
await shot('fig-legacy');
await b.close();
