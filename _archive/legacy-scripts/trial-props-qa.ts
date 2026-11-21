import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createRun, mutate, resolveTrial, continueRun, encodeRun, type Run } from '../src/engine/expedition';
import { TRIAL_PROPS } from '../src/engine/trialProps';
import catalog from '../src/lab/assetCatalog.json';
const out='_research/trial-props-qa';mkdirSync(out,{recursive:true});
for(const prop of TRIAL_PROPS){
  const url=catalog.trials[prop.id];assert.ok(url,`${prop.id} is generated`);
  const file=`public${url}`;assert.ok(existsSync(file));
  assert.equal(readFileSync(file).readUInt32LE(0),0x46546c67,'valid binary glTF');
  console.log('ASSET',prop.id,Math.round(statSync(file).size/1024),'KB');
}
const fixtures=JSON.parse(readFileSync('_research/expedition-fixtures.json','utf8'));
let state=createRun('cup','ESCAPE-001');const states:Run[]=[];
for(const id of fixtures['cup-won'].choices){state=mutate(state,id);states[state.stage]=state;state=continueRun(resolveTrial(state));}
const browser=await chromium.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:960}});
const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
try{
  for(let stage=0;stage<3;stage++){
    await page.goto(`http://localhost:8787/?spin=0&trial-qa=${stage}#evo=${encodeRun(states[stage])}`);
    await page.waitForFunction(()=>!document.querySelector('.evo-loading'));
    assert.ok((await page.locator('.evo-device-caption').innerText()).includes(TRIAL_PROPS[stage].name));
    await page.waitForTimeout(900);
    await page.screenshot({path:`${out}/${TRIAL_PROPS[stage].id}-idle.png`});
    await page.getByRole('button',{name:'启动环境试验 →',exact:true}).click();
    await page.waitForTimeout(1300);
    await page.screenshot({path:`${out}/${TRIAL_PROPS[stage].id}-active.png`});
    await page.waitForFunction(()=>!!document.querySelector('.evo-trial-actions button')&&!document.querySelector('.evo-trial-actions button')!.hasAttribute('disabled')&&!document.querySelector('.evo-trial-actions button')!.textContent!.includes('启动环境'));
    await page.getByRole('button',{name:'重播试验',exact:true}).click();
    await page.waitForFunction(()=>!document.querySelector('.evo-trial-actions button')!.hasAttribute('disabled'));
    assert.equal((await page.locator('.evo-generation b').innerText()).trim(),String(states[stage].generation).padStart(2,'0'));
    console.log('PASS device idle/action/replay:',TRIAL_PROPS[stage].id);
  }
  await page.setViewportSize({width:390,height:844});
  await page.goto(`http://localhost:8787/?spin=0&trial-mobile=1#evo=${encodeRun(states[0])}`);
  await page.waitForFunction(()=>!document.querySelector('.evo-loading'));
  await page.screenshot({path:`out/mobile-gripper.png`.replace('out/',`${out}/`)});
  assert.equal(await page.evaluate(()=>document.querySelector('.evo')!.scrollWidth>innerWidth),false);
  console.log('PASS mobile device scene, no overflow');
  assert.equal(errors.length,0,errors.join('\n'));console.log('Browser errors: 0');
}finally{await browser.close();}
