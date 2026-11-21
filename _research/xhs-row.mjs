import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages()[0];
const html=await p.evaluate(()=>{const el=Array.from(document.querySelectorAll('*')).find(e=>e.textContent?.trim()==='我让一只杯子，自己长出了腿'); let n=el; for(let i=0;i<5&&n;i++) n=n.parentElement; return n?.outerHTML?.slice(0,4000);});
console.log(html);
await b.close();
