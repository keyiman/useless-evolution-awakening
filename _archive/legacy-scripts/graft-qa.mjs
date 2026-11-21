import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const out='_research/graft-fusion-qa';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:960}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,1000));});
try{
 for(const [family,organs] of [
  ['cup',['seal','eye','wheels','solar']],
  ['chair',['legs','eye','parachute','solar']],
  ['umbrella',['spring','eye','balloon','feathers']],
  ['bin',['wheels','pipe','seal','gauge']],
 ]){
  if(process.env.GRAFT_FAMILY&&family!==process.env.GRAFT_FAMILY)continue;
  const hash=Buffer.from(JSON.stringify({f:family,o:organs,s:'LAB-001',x:null})).toString('base64');
  await page.goto('http://localhost:8787/?sandbox=1&spin=0&graft-case='+family+'#lab='+hash);
  await page.waitForSelector('.lab-stage canvas');
  await page.waitForFunction(()=>!document.querySelector('.organ-card.pending')&&!document.querySelector('.lab-assembling'));
  await page.waitForTimeout(1000);
  await page.screenshot({path:`${out}/${family}-full.png`});
  await page.locator('.lab-stage').screenshot({path:`${out}/${family}-front.png`});
  const box=await page.locator('.lab-stage canvas').boundingBox();
  await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.5+170,box.y+box.height*.5,{steps:12});await page.mouse.up();
  await page.waitForTimeout(600);
  await page.locator('.lab-stage').screenshot({path:`${out}/${family}-side.png`});
  console.log('PASS graft front/side:',family);
 }
 assert.equal(errors.length,0,errors.join('\n'));console.log('Shader and page errors: 0');
}finally{await browser.close();}

