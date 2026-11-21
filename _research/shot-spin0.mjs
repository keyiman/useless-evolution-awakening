import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,160))});
for (const f of ['cup','chair','umbrella','bin']) {
  await p.goto(`http://localhost:5173/?demo=${f}&gen=5&stage=1&spin=0`, { waitUntil:'domcontentloaded' });
  await p.waitForSelector('canvas'); await p.waitForTimeout(4500);
  await p.screenshot({ path:`_research/audit3d/${f}-g5-spin0.png` });
}
console.log('errors', errs.length?errs:'none');
await b.close();
