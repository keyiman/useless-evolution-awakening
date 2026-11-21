import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages().at(-1);
const info=await p.evaluate(()=>{
 const els=Array.from(document.querySelectorAll('*')).filter(e=>e.textContent?.trim()==='我的选题');
 return els.map(e=>{let n=e;let arr=[];for(let i=0;i<4&&n;i++){arr.push({tag:n.tagName,cls:n.className?.toString().slice(0,80),html:n.outerHTML.slice(0,300)});n=n.parentElement;}return arr;});
});
console.log(JSON.stringify(info,null,1).slice(0,5000));
await b.close();
