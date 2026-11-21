import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages().at(-1);
const info=await p.evaluate(()=>Array.from(document.querySelectorAll('input,textarea,select,button')).map((e,i)=>({i,tag:e.tagName,type:e.type,ph:e.placeholder,accept:e.accept,cls:e.className?.toString().slice(0,80),text:(e.innerText||'').trim().slice(0,40),rect:(()=>{const r=e.getBoundingClientRect();return [Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)]})()})).filter(x=>x.rect[2]>0));
console.log(JSON.stringify(info,null,1));
await b.close();
