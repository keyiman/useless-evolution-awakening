import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages().at(-1);
await p.getByText('修改提交',{exact:true}).first().click(); await p.waitForTimeout(1500);
// open application track dropdown by clicking the button that contains selected tracks
const trackBtn=p.locator('button').filter({hasText:'空间设计应用奖'}).first();
console.log('trackBtn',await trackBtn.count(),await trackBtn.isVisible().catch(()=>false));
await trackBtn.evaluate(el=>el.click()); await p.waitForTimeout(800);
// uncheck 3D打印应用奖 by clicking visible option
const n=await p.evaluate(()=>{const els=Array.from(document.querySelectorAll('*')).filter(e=>e.textContent?.trim()==='3D打印应用奖'&&e.offsetParent!==null); if(els.length){els[els.length-1].click(); return els.length;} return 0;});
console.log('clicked 3D',n); await p.waitForTimeout(800);
const checks=await p.evaluate(()=>Array.from(document.querySelectorAll('input[type=checkbox]')).filter(e=>['SPATIAL_DESIGN','FILM','PRINT_3D'].includes(e.value)).map(e=>({val:e.value,checked:e.checked})));
console.log(checks);
await p.screenshot({path:'_research/aholo-track-fix.png'});
await b.close();
