import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages()[0];
const info=await p.evaluate(()=>Array.from(document.querySelectorAll('img,svg,button,[role=button]')).map((e,i)=>({i,tag:e.tagName,cls:e.className?.toString().slice(0,80),aria:e.getAttribute('aria-label'),src:e.getAttribute('src')?.slice(0,80),text:(e.textContent||'').trim().slice(0,30),rect:(()=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()})).filter(x=>x.rect[2]>0));
console.log(JSON.stringify(info.slice(0,40),null,1));
await b.close();
