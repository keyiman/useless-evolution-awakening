import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const fixtures=JSON.parse(fs.readFileSync('_research/expedition-fixtures.json','utf8'));
const out='_research/expedition-qa';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1440,height:960},permissions:['clipboard-read','clipboard-write']});
const page=await context.newPage();const errors=[];
page.on('pageerror',e=>errors.push(e.message));
async function loaded(){await page.waitForFunction(()=>!document.querySelector('.evo-loading'),{timeout:20000});}
async function path(kind){
 await page.goto('http://localhost:8787/?challenge=1&spin=0');await loaded();
 const choices=fixtures[`cup-${kind}`].choices;
 for(let i=0;i<choices.length;i++){
  await page.locator(`[data-organ="${choices[i]}"]`).click();await loaded();
  await page.getByRole('button',{name:'启动环境试验 →',exact:true}).click();
  await page.waitForFunction(()=>!!document.querySelector('.evo-trial-actions button')&&!document.querySelector('.evo-trial-actions button').disabled&&!document.querySelector('.evo-trial-actions button').textContent.includes('启动环境'));
  if(i===0&&kind==='won'){
   const generation=await page.locator('.evo-generation').innerText();
   await page.getByRole('button',{name:'重播试验',exact:true}).click();
   await page.waitForFunction(()=>!document.querySelector('.evo-trial-actions button').disabled);
   assert.equal(await page.locator('.evo-generation').innerText(),generation);
   await page.screenshot({path:`${out}/trial-result.png`});
  }
  await page.locator('.evo-trial-actions .primary').click();
 }
 await page.waitForSelector('.evo-ending');
 assert.ok((await page.locator('.evo-ending').innerText()).includes(kind==='won'?'正式脱离人类用途':'不是进化的终点'));
 await page.screenshot({path:`${out}/${kind}.png`});
 console.log(`PASS full ${kind} path: ${choices.join(',')}`);
}
await path('won');
await page.getByRole('button',{name:'分享',exact:true}).click();
const shared=await page.evaluate(()=>navigator.clipboard.readText());assert.ok(shared.includes('#evo='));
await page.goto(shared);await loaded();await page.waitForSelector('.evo-ending');console.log('PASS share replay');
await path('lost');
await page.getByRole('button',{name:'同种子再挑战',exact:true}).click();await loaded();assert.equal(await page.locator('.evo-card').count(),3);console.log('PASS restart');
for(const family of ['chair','umbrella','bin','cup']){
 await page.getByRole('button',{name:new RegExp({chair:'椅子',umbrella:'雨伞',bin:'垃圾桶',cup:'水杯'}[family])}).click();await loaded();
 await page.screenshot({path:`${out}/base-${family}.png`});
}
await page.locator('.evo-card').first().click();await loaded();
await page.getByRole('button',{name:'重新开始',exact:true}).click();await page.getByRole('button',{name:'继续当前实验'}).click();assert.equal(await page.locator('.evo-card').count(),0);console.log('PASS restart cancellation');
await page.getByRole('button',{name:/发现图鉴/}).click();await page.waitForSelector('[aria-label="发现图鉴"]');await page.getByRole('button',{name:'关闭图鉴'}).click();console.log('PASS gallery');
await page.goto('http://localhost:8787/?challenge=1&spin=0');await loaded();await page.setViewportSize({width:390,height:844});
await page.screenshot({path:`${out}/mobile.png`,fullPage:true});
assert.equal(await page.evaluate(()=>document.querySelector('.evo').scrollWidth>innerWidth),false);console.log('PASS mobile no overflow');
await page.locator('.evo-card').first().click();await loaded();await page.getByRole('button',{name:'启动环境试验 →',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.evo-trial-actions button').disabled&&!document.querySelector('.evo-trial-actions button').textContent.includes('启动环境'));console.log('PASS mobile trial');
console.log('ERRORS',errors);assert.equal(errors.length,0);await browser.close();
