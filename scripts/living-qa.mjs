import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const browser=await chromium.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true,args:['--force-device-scale-factor=1','--use-angle=d3d11','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:1});const errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
fs.mkdirSync('_research/living-qa',{recursive:true});
const mode=async()=>page.locator('.life-gallery').getAttribute('data-mode');
const waitMode=m=>page.waitForFunction(m=>document.querySelector('.life-gallery')?.dataset.mode===m,m,{timeout:35000});
let frame=0;const hash=async()=>createHash('sha256').update(await page.locator('canvas').screenshot({path:`_research/living-qa/pause-check-${frame++}.png`})).digest('hex');
// Drain queued compositor frames before checking a frozen WebGL canvas.
async function frozenFrame(){let previous=await hash();for(let i=0;i<12;i++){await page.waitForTimeout(100);const next=await hash();if(next===previous)return next;previous=next;}assert.fail('paused canvas never settles');}
try{
 await page.goto('http://localhost:8787/?challenge=1');await page.waitForSelector('canvas');await page.waitForTimeout(1700);
 assert.equal(await page.locator('.life-timeline button').count(),5);
 assert.equal(await page.locator('.deck-game,.evo-arena,.candidate-grid').count(),0,'old challenge routes are removed');
 await page.screenshot({path:'_research/living-qa/0-original.png'});
 await page.getByRole('button',{name:/让它苏醒/}).click();assert.equal(await mode(),'grow');await waitMode('demo');
 await page.waitForTimeout(1000);await page.screenshot({path:'_research/living-qa/1-awake.png'});
 await page.getByRole('button',{name:/继续进化/}).click();await page.waitForTimeout(700);await page.getByRole('button',{name:'暂停动画',exact:true}).click();
 const progress=await page.locator('.life-growth b').getAttribute('style');await page.waitForTimeout(900);assert.equal(await page.locator('.life-growth b').getAttribute('style'),progress,'growth pauses');
 await page.getByRole('button',{name:'继续动画',exact:true}).click();await waitMode('demo');await page.waitForTimeout(800);
 const moving=await hash();await page.waitForTimeout(500);assert.notEqual(await hash(),moving,'walking actually animates');
 await page.getByRole('button',{name:'暂停动画',exact:true}).click();await page.waitForTimeout(700);const still=await frozenFrame();await page.waitForTimeout(500);assert.equal(await hash(),still,'paused 3D stays still');
 await page.screenshot({path:'_research/living-qa/2-walking.png'});await page.getByRole('button',{name:'继续动画',exact:true}).click();
 for(let i=3;i<=4;i++){await page.locator('.life-timeline button').nth(i).click();await waitMode('demo');await page.waitForTimeout(1100);await page.screenshot({path:`_research/living-qa/${i}-evolved.png`});console.log('stage',i,'automatically demonstrates');}
 await page.getByRole('button',{name:/重播动作/}).click();assert.equal(await mode(),'demo');await waitMode('idle');
 await page.getByRole('button',{name:/重播动作/}).click();assert.equal(await mode(),'demo');
 await page.reload();await page.waitForSelector('canvas');assert.equal(await page.locator('.life-gallery').getAttribute('data-stage'),'4');
 for(const width of [390,320]){await page.setViewportSize({width,height:844});await page.waitForTimeout(500);assert.ok(await page.evaluate(()=>{const el=document.querySelector('.life-gallery');return el.scrollWidth<=el.clientWidth&&document.documentElement.scrollWidth<=innerWidth;}),'no horizontal overflow');await page.screenshot({path:`_research/living-qa/mobile-${width}.png`,fullPage:true});}
 await page.locator('.life-timeline button').nth(0).click();await waitMode('idle');assert.equal(await page.locator('.life-gallery').getAttribute('data-stage'),'0');
 await page.locator('.life-timeline button').nth(4).click();await waitMode('demo');
 await page.getByRole('button',{name:/从头开始/}).click();await page.getByRole('button',{name:'从原物开始',exact:true}).click();assert.equal(await page.locator('.life-gallery').getAttribute('data-stage'),'0');
 assert.deepEqual(errors,[]);console.log('Living browser QA passed: five stages, automatic actions, visible motion, true pause, replay, reverse evolution, reset, persistence, 390/320px, no JS/WebGL errors.');
}finally{await browser.close();}
