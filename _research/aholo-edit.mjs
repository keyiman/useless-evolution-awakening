import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages().at(-1);
const btn=p.getByText('修改提交',{exact:true}).first();
console.log('count',await btn.count());
if(await btn.count()){ await btn.click(); await p.waitForTimeout(2500); }
console.log('URL',p.url());
console.log((await p.locator('body').innerText()).slice(0,1200));
const inputs=await p.evaluate(()=>Array.from(document.querySelectorAll('input,textarea')).map((e,i)=>({i,type:e.type,ph:e.placeholder,val:e.value,parent:e.parentElement?.parentElement?.innerText?.slice(0,80)})));
console.log(JSON.stringify(inputs,null,1));
await p.screenshot({path:'_research/aholo-edit.png'});
await b.close();
