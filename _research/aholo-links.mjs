import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages().at(-1);
const items=await p.evaluate(()=>Array.from(document.querySelectorAll('a,button,[role=button]')).map(e=>({tag:e.tagName,text:e.innerText?.trim().slice(0,50),href:e.getAttribute('href'),cls:e.className?.toString().slice(0,60)})).filter(x=>x.text));
console.log(JSON.stringify(items.slice(0,60),null,1));
await b.close();
