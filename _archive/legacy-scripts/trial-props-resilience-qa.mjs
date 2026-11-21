import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const catalog=JSON.parse(fs.readFileSync('src/lab/assetCatalog.json','utf8'));
const fixtures=JSON.parse(fs.readFileSync('_research/expedition-fixtures.json','utf8'));
const browser=await chromium.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1366,height:900}});
const url=`http://localhost:8787/?device-recovery=1#evo=${fixtures['cup-watcher'].code}`;
try{
  // Restore a ready last-stage specimen, then fail its physical power-supply device only.
  let blocked=true;
  await page.route(`**${catalog.trials['power-dock']}`,r=>blocked?r.abort():r.continue());
  await page.goto(url);
  await page.getByRole('button',{name:'重新加载模型',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'启动环境试验 →',exact:true}).isDisabled(),true);
  const generation=await page.locator('.evo-generation').innerText();
  blocked=false;
  await page.getByRole('button',{name:'重新加载模型',exact:true}).click();
  await page.waitForFunction(()=>!document.querySelector('.evo-loading')&&!document.querySelector('.evo-scene-error'));
  assert.equal(await page.getByRole('button',{name:'启动环境试验 →',exact:true}).isEnabled(),true);
  assert.equal(await page.locator('.evo-generation').innerText(),generation);
  console.log('PASS missing trial device blocks start, retry recovers, generation preserved');
}finally{await browser.close();}
