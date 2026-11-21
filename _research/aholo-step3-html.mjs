import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages().at(-1);
const html=await p.evaluate(()=>document.body.innerHTML);
const i=html.indexOf('我的选题');
console.log('idx',i); console.log(html.slice(Math.max(0,i-1200),i+800));
await b.close();
