import { chromium } from 'playwright-core';
import fs from 'node:fs';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages()[0];
// close onboarding modal if present
const know=p.getByText('我知道了',{exact:true});
if(await know.count()){ await know.first().click(); await p.waitForTimeout(500); }
const raw=fs.readFileSync('提交材料/小红书/小红书文案.txt','utf8').replace(/\r/g,'');
const lines=raw.split('\n');
const body=lines.slice(1).join('\n').replace(/\n{2,}/g,'\n').trim();
const editor=p.locator('.tiptap.ProseMirror').first();
await editor.click();
await p.keyboard.press('Control+A');
await editor.fill(body);
await p.waitForTimeout(800);
await p.keyboard.press('Escape');
await p.locator('body').click({position:{x:900,y:900}}).catch(()=>{});
await p.waitForTimeout(500);
console.log('body', (await editor.innerText()).slice(0,600));
await p.screenshot({path:'_research/xhs-ready.png'});
await b.close();
