import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
mkdirSync('_research/new-shots', { recursive: true });
const b = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8787/?object=cup&r=new1', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(8000);
console.log('title', await p.title());
console.log('h1', await p.locator('h1,h2').first().innerText().catch(()=>''));
await p.screenshot({ path: '_research/new-shots/home-cup.png' });
for (let i=0;i<5;i++) {
  const t = p.locator('.life-timeline button').nth(i);
  if (await t.count()) { await t.click(); await p.waitForTimeout(2600); await p.screenshot({ path: `_research/new-shots/cup-stage-${i+1}.png` }); console.log('cup stage', i+1); }
}
for (const [id,name] of [['chair','chair'],['umbrella','umbrella'],['bin','bin']]) {
  await p.locator(`[data-object="${id}"]`).click();
  await p.waitForTimeout(3500);
  await p.screenshot({ path: `_research/new-shots/${name}-stage-1.png` });
  await p.locator('.life-timeline button').nth(4).click();
  await p.waitForTimeout(2600);
  await p.screenshot({ path: `_research/new-shots/${name}-stage-5.png` });
  console.log(name, 'done');
}
await p.goto('http://127.0.0.1:8787/?create=1&r=new2', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(6000);
await p.screenshot({ path: '_research/new-shots/workshop.png' });
console.log('workshop shot');
await p.setViewportSize({ width: 390, height: 844 });
await p.goto('http://127.0.0.1:8787/?object=cup&r=new3', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(5000);
await p.screenshot({ path: '_research/new-shots/mobile-cup.png' });
console.log('mobile shot; errors', errs.slice(0,3));
await b.close();
