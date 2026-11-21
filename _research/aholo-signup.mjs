import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages().at(-1);
const btn=p.getByText('立即报名',{exact:true}).first();
console.log('count',await btn.count());
if(await btn.count()){ await btn.click(); await p.waitForTimeout(2500); console.log('URL',p.url()); console.log((await p.locator('body').innerText()).slice(0,1800)); await p.screenshot({path:'_research/aholo-signup.png'}); }
await b.close();
