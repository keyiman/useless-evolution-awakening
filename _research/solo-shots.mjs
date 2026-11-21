import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
for (const [id,file] of [['handle','7767c1b83ad0b4550cf9.glb'],['parasite','e06012dfe6499648bbd3.glb']]) {
  await p.goto(`http://127.0.0.1:5174/?demo=cup&gen=0&glb=/models/${file}&stage=1&spin=0&r=${id}`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(7000);
  await p.screenshot({ path: `_research/solo-${id}.png` });
}
await b.close();
