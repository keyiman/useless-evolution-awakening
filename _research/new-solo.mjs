import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
const files = { solar:'1b9d41c38e2a52680b86', parachute:'e013dbe4939c703148c6', tank:'85f58e1fe858a34941aa', gear:'da70e2356a66dcf3ef2e' };
for (const [id,file] of Object.entries(files)) {
  await p.goto(`http://127.0.0.1:5174/?demo=cup&gen=0&glb=/models/${file}.glb&stage=1&spin=0&r=${id}`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(6500);
  await p.screenshot({ path: `_research/new-${id}.png` });
  console.log('shot', id);
}
await b.close();
