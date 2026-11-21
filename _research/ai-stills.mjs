import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
mkdirSync('提交材料/ai-shots', { recursive: true });
const b = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
const code = (o) => Buffer.from(JSON.stringify(o)).toString('base64').replace(/=+$/, '');
const css = `html,body,#root{background:#0d1014!important;overflow:hidden!important}
.lab-head,.lab-left,.lab-right,.lab-tray,.lab-hint,.lab-loading,.lab-assembling,.lab-fusion-tag,.lab-note,.lab-missing,.lab-toast{display:none!important}
.lab-main{display:block!important;padding:0!important;height:100vh!important}
.lab-stage{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;border:0!important;border-radius:0!important}
.lab-stage canvas{width:100vw!important;height:100vh!important}`;
const shots = {
  hero: {f:'cup',o:['seal','arm','wheels','shell'],s:'LAB-001'},
  fusion: {f:'cup',o:['seal','arm'],s:'LAB-001',x:'chair'},
  cage: {f:'cup',o:['shell','arm'],s:'LAB-001'},
  balloon: {f:'cup',o:['balloon','arm'],s:'LAB-001'},
};
for (const [name, state] of Object.entries(shots)) {
  await p.goto(`http://127.0.0.1:8787/?r=ai-${name}#lab=${code(state)}`, { waitUntil: 'domcontentloaded' });
  await p.addStyleTag({ content: css });
  await p.waitForTimeout(7000);
  await p.screenshot({ path: `提交材料/ai-shots/${name}.png` });
  console.log('shot', name);
}
await b.close();
