import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages()[0];
const url='https://www.xiaohongshu.com/explore/6af99ab60000000018028749?xsec_token=YBLRjsOctx_XaWXilg1LVLsU4EhLnzAM4jFgFgA1-DTLk%3D&xsec_source=pc_creatormng';
await p.goto(url,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(4000);
console.log('URL',p.url());
console.log((await p.locator('body').innerText()).slice(0,500));
await p.screenshot({path:'_research/xhs-public2.png'});
await b.close();
