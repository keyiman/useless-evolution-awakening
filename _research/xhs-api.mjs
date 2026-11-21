import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages()[0];
const data=await p.evaluate(async()=>{const r=await fetch('/api/galaxy/v2/creator/note/user/posted?tab=0&page=0',{credentials:'include'});return await r.json();});
console.log(JSON.stringify(data,null,1).slice(0,5000));
await b.close();
