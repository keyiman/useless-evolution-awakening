import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages()[0];
await p.goto('https://creator.xiaohongshu.com/publish/update?id=6af99ab60000000018028749&noteType=normal',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(3000);
const info=await p.evaluate(()=>Array.from(document.querySelectorAll('[class*=preview],[class*=Preview]')).map(e=>({tag:e.tagName,cls:e.className?.toString().slice(0,100),text:e.innerText?.trim().slice(0,60),rect:(()=>{const r=e.getBoundingClientRect();return [Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)]})()})).filter(x=>x.rect[2]>50));
console.log(JSON.stringify(info.slice(0,30),null,1));
await b.close();
