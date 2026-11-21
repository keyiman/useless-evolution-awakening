import { chromium } from 'playwright-core';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const fixtures=JSON.parse(fs.readFileSync('_research/expedition-fixtures.json','utf8'));
const browser=await chromium.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:960}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
for(const family of ['cup','chair','umbrella','bin'])for(const combo of ['watcher','drifter','rooted']){
 await page.goto(`http://localhost:8787/?spin=0&case=${family}-${combo}#evo=${fixtures[`${family}-${combo}`].code}`);
 await page.waitForFunction(()=>!document.querySelector('.evo-loading'));
 await page.waitForTimeout(1300);
 assert.ok((await page.locator('.evo-specimen .evo-eyebrow').innerText()).includes(family.toUpperCase()));
 assert.equal(await page.locator('.evo-combo-note strong').innerText(),{watcher:'警觉游走体',drifter:'逆风浮游体',rooted:'扎根共生体'}[combo]);
 await page.screenshot({path:`_research/expedition-qa/${family}-${combo}.png`});
 console.log('rendered',family,combo);
}
console.log('errors',errors);await browser.close();

