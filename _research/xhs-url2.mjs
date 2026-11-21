import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages()[0];
for(const u of ['https://www.xiaohongshu.com/discovery/item/6af99ab60000000018028749','https://www.xiaohongshu.com/explore/6af99ab60000000018028749?xsec_token=']){
 await p.goto(u,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(2500);
 console.log('URL',p.url()); console.log((await p.locator('body').innerText()).slice(0,160).replace(/\n/g,' | '));
}
await b.close();
