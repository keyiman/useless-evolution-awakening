import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,160))});
for (const [f,g] of [['cup',5],['umbrella',0],['chair',0],['bin',5]]) {
  await p.goto(`http://localhost:5173/?demo=${f}&gen=${g}&stage=1`, { waitUntil:'domcontentloaded' });
  await p.waitForSelector('canvas'); await p.waitForTimeout(5000);
  await p.screenshot({ path:`_research/audit3d/${f}-g${g}-env.png` });
}
console.log('errors', errs.length?errs:'none');
await b.close();
