import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages()[0];
await p.goto('https://creator.xiaohongshu.com/new/note-manager',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(2500);
const card=p.locator('.note-card').first(); await card.hover(); await p.waitForTimeout(800);
const btns=await p.evaluate(()=>Array.from(document.querySelectorAll('.note-card__action-btn, .note-card__actions button, .note-card__actions a')).map(e=>({tag:e.tagName,text:e.innerText?.trim(),title:e.getAttribute('title'),aria:e.getAttribute('aria-label'),html:e.outerHTML.slice(0,300)})));
console.log(JSON.stringify(btns,null,1));
await p.screenshot({path:'_research/xhs-hover.png'});
await b.close();
