import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const fixtures=JSON.parse(fs.readFileSync('_research/expedition-fixtures.json','utf8'));
const browser=await chromium.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1366,height:900}});
let blocked=true;
await page.route('**/models/eea91460acac61b97745.glb',r=>blocked?r.abort():r.continue());
await page.goto(`http://localhost:8787/?retry-test=1#evo=${fixtures['cup-watcher'].code}`);
await page.getByRole('button',{name:'重新加载模型'}).waitFor();
blocked=false;await page.getByRole('button',{name:'重新加载模型'}).click();
try{
 await page.waitForFunction(()=>!document.querySelector('.evo-loading')&&!document.querySelector('.evo-scene-error'),undefined,{timeout:8000});
 console.log('PASS failed organ batch recovers');
 await page.goto(`http://localhost:8787/?retry-test=1#evo=${fixtures['bin-rooted'].code}`);
 await page.waitForFunction(()=>document.querySelector('.evo-specimen .evo-eyebrow')?.textContent.includes('BIN')&&!document.querySelector('.evo-loading'));
 console.log('PASS same-document share navigation');
 for(const width of [320,390,768]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.querySelector('.evo').scrollWidth>innerWidth),false);}
 console.log('PASS 320/390/768 width checks');
 await page.goto('http://localhost:8787/?sandbox=1');await page.waitForSelector('.lab-stage canvas');
 assert.equal(await page.locator('.lab-tray .organ-card').count(),32);console.log('PASS sandbox preserved, 32 organs');
 await page.goto('http://localhost:8787/?tree=1');await page.waitForSelector('.app');console.log('PASS legacy tree preserved');
}finally{await browser.close();}
