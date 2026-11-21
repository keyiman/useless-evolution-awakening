import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
const logs = [];
p.on('console', (m) => { const t = m.text(); if (t.startsWith('[base]') || t.startsWith('[organ]')) logs.push(t); });
for (const id of ['seal','arm','wheels','gimbal','funnel','shell','handle','parasite']) {
  logs.length = 0;
  const code = Buffer.from(JSON.stringify({f:'cup',o:[id],s:'LAB-001'})).toString('base64').replace(/=+$/,'');
  await p.goto(`http://127.0.0.1:5174/#lab=${code}`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(4500);
  console.log(id, '|', logs.filter(l=>l.includes('[organ]')||l.includes('[base]')).join(' || '));
}
await b.close();
