import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages().at(-1);
const vals=await p.evaluate(()=>({urls:Array.from(document.querySelectorAll('input[type=url]')).map(e=>e.value), checks:Array.from(document.querySelectorAll('input[type=checkbox]')).map((e,i)=>({i,checked:e.checked,visible:e.offsetParent!==null,label:e.parentElement?.innerText?.slice(0,60)}))}));
console.log(JSON.stringify(vals,null,1));
await b.close();
