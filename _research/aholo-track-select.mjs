import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages().at(-1);
for(const label of ['空间设计应用奖','影视应用奖']){
 const n=await p.evaluate((label)=>{const els=Array.from(document.querySelectorAll('*')).filter(e=>e.textContent?.trim()===label&&e.offsetParent!==null); if(els.length){els[els.length-1].click(); return els.length;} return 0;},label);
 console.log(label,n); await p.waitForTimeout(500);
}
await p.waitForTimeout(800);
console.log((await p.locator('body').innerText()).slice(0,1200));
await p.screenshot({path:'_research/aholo-track-selected.png'});
await b.close();
