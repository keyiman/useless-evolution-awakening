import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages().at(-1);
const info=await p.evaluate(()=>Array.from(document.querySelectorAll('input,textarea,select,button')).map((e,i)=>{
 let n=e, txt='';
 for(let j=0;j<4&&n;j++){n=n.parentElement;if(n&&n.innerText&&n.innerText.length<500){txt=n.innerText.trim();}}
 return {i,tag:e.tagName,type:e.type,ph:e.placeholder,accept:e.accept,text:(e.innerText||'').trim().slice(0,30),parent:txt.replace(/\n/g,' | ').slice(0,220)};
}));
console.log(JSON.stringify(info.filter(x=>x.tag==='INPUT'||x.tag==='SELECT'||x.tag==='TEXTAREA'||x.text.includes('上传')||x.text.includes('提交')),null,1));
await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(800); await p.screenshot({path:'_research/aholo-top.png'});
await b.close();
