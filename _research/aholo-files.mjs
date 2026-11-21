import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages().at(-1);
const files=await p.evaluate(()=>Array.from(document.querySelectorAll('input[type=file]')).map((e,i)=>({i,accept:e.accept,multiple:e.multiple,cls:e.className,parent:e.parentElement?.innerText?.slice(0,100),rect:(()=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()})));
console.log(files);
await b.close();
