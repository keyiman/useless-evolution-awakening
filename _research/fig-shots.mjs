import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
const code = (o) => Buffer.from(JSON.stringify(o)).toString('base64').replace(/=+$/,'');
const shot = async (name) => { await p.waitForTimeout(600); await p.screenshot({ path: `报告/figs/${name}.png` }); console.log('shot', name); };

await p.goto('http://127.0.0.1:5174/?r=fig-default', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(6000);
await shot('fig-lab-default');

await p.goto(`http://127.0.0.1:5174/?r=fig-hero#lab=${code({f:'cup',o:['seal','arm','wheels','shell'],s:'LAB-001'})}`, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(6500);
await shot('fig-lab-hero');
await p.locator('button', { hasText: '运行无用性测试' }).click();
await p.waitForTimeout(1600);
await shot('fig-lab-test');

await p.goto(`http://127.0.0.1:5174/?r=fig-fusion#lab=${code({f:'cup',o:['seal','arm'],s:'LAB-001',x:'chair'})}`, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(6000);
await shot('fig-lab-fusion');

await p.goto('http://127.0.0.1:5174/?r=fig-auto', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(5000);
await p.locator('button', { hasText: '让它自己变异' }).click();
await p.waitForTimeout(5600);
await shot('fig-lab-auto');

await p.goto('http://127.0.0.1:5174/?tree=1&r=fig-legacy', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(6000);
await shot('fig-legacy');
await b.close();
