import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
const logs = [];
p.on('console', (m) => { const t = m.text(); if (t.startsWith('[bbox]')) logs.push(t); });
for (const id of ['tank','gauge','lock','hinge']) {
  logs.length = 0;
  const code = Buffer.from(JSON.stringify({f:'cup',o:[id],s:'LAB-001'})).toString('base64').replace(/=+$/,'');
  await p.goto(`http://127.0.0.1:5174/?r=${id}#lab=${code}`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(5000);
  console.log(id, '|', logs.join(' || ') || '(no bbox)');
}
await b.close();
