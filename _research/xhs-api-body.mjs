import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages()[0];
let bodyText='';
p.on('response',async r=>{if(r.url().includes('/api/galaxy/v2/creator/note/user/posted')){try{bodyText=await r.text();}catch{}}});
await p.goto('https://creator.xiaohongshu.com/new/note-manager',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(4500);
console.log('LEN',bodyText.length);
console.log(bodyText.slice(0,4000));
await b.close();
