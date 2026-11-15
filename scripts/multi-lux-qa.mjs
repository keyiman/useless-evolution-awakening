import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const browser=await chromium.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true,args:['--force-device-scale-factor=1','--use-angle=d3d11']});
const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1}),errors=[],loaded=new Set();
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,700));});page.on('response',r=>{if(r.url().endsWith('.glb')&&r.status()===200)loaded.add(new URL(r.url()).pathname);});
const ready=()=>page.waitForFunction(()=>document.querySelector('.life-gallery')?.dataset.ready==='true',{},{timeout:45000});
const mode=m=>page.waitForFunction(m=>document.querySelector('.life-gallery')?.dataset.mode===m,m,{timeout:45000});
const value=key=>page.locator('.life-gallery').getAttribute(`data-${key}`);
const hash=async()=>createHash('sha256').update(await page.locator('canvas').screenshot()).digest('hex');
fs.mkdirSync('_research/multi-lux-qa',{recursive:true});
try{
 await page.goto('http://localhost:8787/?object=cup');await ready();assert.equal(await page.locator('.life-objects button').count(),4);
 for(const id of ['cup','chair','umbrella','bin']){
  await page.locator(`.life-objects [data-object="${id}"]`).click();await ready();assert.equal(await value('object'),id);assert.equal(await value('stage'),'0');
  await page.screenshot({path:`_research/multi-lux-qa/${id}-original.png`});
  for(let stage=1;stage<=4;stage++){
   await page.locator('.life-timeline button').nth(stage).click();await mode('demo');assert.equal(await value('stage'),String(stage));
   if(stage===2){await page.waitForTimeout(300);const moving=await hash();await page.waitForTimeout(350);assert.notEqual(await hash(),moving,`${id}: actual motion`);await page.getByRole('button',{name:'暂停动画',exact:true}).click();await page.waitForTimeout(500);const frozen=await hash();await page.waitForTimeout(250);assert.equal(await hash(),frozen,`${id}: pause freezes geometry`);await page.getByRole('button',{name:'继续动画',exact:true}).click();}
  }
  await page.screenshot({path:`_research/multi-lux-qa/${id}-evolved.png`});
  await page.getByRole('button',{name:/重播动作/}).click();assert.equal(await value('mode'),'demo');
  await page.locator('.life-source summary').click();assert.ok((await page.locator('.life-source').innerText()).includes('原始模型不自带动画'));assert.ok((await page.locator('.life-source a').getAttribute('href')).endsWith('.glb'));await page.locator('.life-source summary').click();
  console.log(id,'passed 5 stages, real asset, animation, pause and source');
 }
 assert.equal(loaded.size,4,'all four real GLBs loaded');
 await page.locator('.life-objects [data-object="chair"]').click();await ready();assert.equal(await value('stage'),'4');await page.reload();await ready();assert.equal(await value('object'),'chair');assert.equal(await value('stage'),'4');
 await page.locator('.life-timeline button').nth(0).click();await mode('idle');await page.locator('.life-timeline button').nth(1).click();await page.locator('.life-objects [data-object="umbrella"]').click();await ready();await page.waitForTimeout(600);assert.equal(await value('stage'),'4');assert.equal(await value('mode'),'idle','switch cancels previous evolution');
 for(const width of [390,320]){await page.setViewportSize({width,height:844});await page.waitForTimeout(250);assert.ok(await page.evaluate(()=>{const e=document.querySelector('.life-gallery');return e.scrollWidth<=e.clientWidth&&document.documentElement.scrollWidth<=innerWidth;}));await page.screenshot({path:`_research/multi-lux-qa/mobile-${width}.png`,fullPage:true});}
 assert.deepEqual(errors,[]);console.log('Multi-Lux QA passed: 20 stages, four GLB responses, real motion and pause, replay, source disclosure, independent persistence, cancellation, mobile and no JS/WebGL errors.');
}finally{await browser.close();}
