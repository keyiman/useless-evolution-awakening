import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages().at(-1);
const submit=p.getByText('提交新版本',{exact:true}).first();
console.log('submit',await submit.count()); await submit.click(); await p.waitForTimeout(5000);
console.log('URL',p.url());
console.log((await p.locator('body').innerText()).slice(0,1100));
await p.screenshot({path:'_research/aholo-final.png'});
await b.close();
