import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages()[0];
const urls=[];
p.on('response',r=>{const u=r.url(); if(u.includes('/api/')&&u.includes('note')) urls.push(u);});
await p.goto('https://creator.xiaohongshu.com/new/note-manager',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(4000);
console.log([...new Set(urls)].slice(-20));
await b.close();
