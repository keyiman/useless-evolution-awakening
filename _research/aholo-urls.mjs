import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages().at(-1);
const info=await p.evaluate(()=>Array.from(document.querySelectorAll('input[type=url]')).map((e,i)=>({i,ph:e.placeholder,val:e.value,parent:e.parentElement?.parentElement?.innerText?.slice(0,120)})));
console.log(info);
await b.close();
