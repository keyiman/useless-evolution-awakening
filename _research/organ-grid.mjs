import { chromium } from 'playwright-core';

const ids = ['seal', 'funnel', 'arm', 'wheels', 'shell', 'handle', 'parasite', 'gimbal'];
const b = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
});
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
for (const id of ids) {
  const code = Buffer.from(JSON.stringify({ f: 'cup', o: [id], s: 'LAB-001' })).toString('base64').replace(/=+$/, '');
  await p.goto(`http://127.0.0.1:5174/?r=grid-${id}#lab=${code}`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(5200);
  await p.screenshot({ path: `_research/organ-final-${id}.png` });
  console.log('shot', id);
}
await b.close();
