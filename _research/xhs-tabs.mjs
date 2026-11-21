import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages()[0];
await p.goto('https://creator.xiaohongshu.com/new/note-manager',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(2500);
for(const tab of ['已发布','审核中','未通过']){
 const el=p.getByText(tab,{exact:true}).first();
 if(await el.count()){ await el.evaluate(e=>e.click()); await p.waitForTimeout(1800); const txt=(await p.locator('body').innerText()); console.log('TAB',tab,'hasNote',txt.includes('我让一只杯子'),'len',txt.length); }
}
await b.close();
