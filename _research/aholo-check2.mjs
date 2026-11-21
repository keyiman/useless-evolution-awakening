import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages().at(-1);
const checks=await p.evaluate(()=>Array.from(document.querySelectorAll('input[type=checkbox]')).filter(e=>e.offsetParent!==null).map((e,i)=>({i,val:e.value,checked:e.checked,label:e.parentElement?.innerText?.slice(0,50)})));
console.log(checks);
// click visible labels to ensure both checked
for(const txt of ['我确认作品使用 Aholo Lux3D 完成，且可运行、可演示','我已阅读并同意《群核科技 Aholo 全球 3D AI 黑客松参赛作品提交须知》']){
 const loc=p.getByText(txt,{exact:false}).first();
 if(await loc.count()) await loc.click({force:true});
 await p.waitForTimeout(300);
}
const checks2=await p.evaluate(()=>Array.from(document.querySelectorAll('input[type=checkbox]')).filter(e=>e.offsetParent!==null).map((e,i)=>({i,checked:e.checked,label:e.parentElement?.innerText?.slice(0,50)})));
console.log(checks2);
await b.close();
