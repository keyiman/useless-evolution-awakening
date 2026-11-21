import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages()[0];
await p.goto('https://creator.xiaohongshu.com/new/note-manager',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(2500);
const card=p.locator('.note-card').first(); await card.hover(); await p.waitForTimeout(400);
const btns=p.locator('.note-card__action-btn');
for(let i of [0,1,3]){
 await btns.nth(i).hover(); await p.waitForTimeout(600);
 const tip=await p.evaluate(()=>Array.from(document.querySelectorAll('[class*=tooltip],[class*=popover]')).map(e=>e.innerText?.trim()).filter(Boolean).join(' | '));
 console.log(i, 'TIP:',tip);
}
await b.close();
