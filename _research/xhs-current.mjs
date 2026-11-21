import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages()[0];
console.log('URL',p.url());
console.log((await p.locator('body').innerText()).slice(0,1500));
await p.screenshot({path:'_research/xhs-current.png'});
await b.close();
