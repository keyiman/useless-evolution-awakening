import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages().at(-1);
const clicked=await p.evaluate(()=>{const els=Array.from(document.querySelectorAll('*')).filter(e=>e.textContent?.trim()==='无'&&e.offsetParent!==null); if(els.length){els[els.length-1].click(); return els.length;} return 0;});
console.log('clicked',clicked); await p.waitForTimeout(800);
const selects=p.getByText('请选择',{exact:true});
console.log('selects left',await selects.count());
if(await selects.count()){ await selects.first().click(); await p.waitForTimeout(800); }
console.log((await p.locator('body').innerText()).slice(0,1500));
await p.screenshot({path:'_research/aholo-select2.png'});
await b.close();
