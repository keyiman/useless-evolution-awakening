import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages()[0];
await p.goto('https://www.xiaohongshu.com/explore/6af99ab60000000018028749',{waitUntil:'domcontentloaded'});
await p.waitForTimeout(5000);
console.log('URL',p.url());
console.log((await p.locator('body').innerText()).slice(0,800));
await p.screenshot({path:'_research/xhs-public.png'});
await b.close();
