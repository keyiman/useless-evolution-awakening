import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,160))});
for (const f of ['cup','umbrella','bin','chair']) {
  await p.goto(`http://localhost:5173/?demo=${f}&gen=5`, { waitUntil:'domcontentloaded' });
  await p.waitForSelector('.hud-title'); await p.waitForTimeout(2500);
  await p.getByRole('button', { name: '无用性测试' }).click();
  await p.waitForTimeout(1400);
  await p.screenshot({ path:`_research/audit3d/${f}-test2.png` });
}
console.log('errors', errs.length?errs:'none');
await b.close();
