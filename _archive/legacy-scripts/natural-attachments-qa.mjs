import { chromium } from 'playwright-core';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const fixtures=JSON.parse(fs.readFileSync('_research/expedition-fixtures.json','utf8'));
const browser=await chromium.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:960}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,500));});
fs.mkdirSync('_research/natural-attachments-qa',{recursive:true});
if(!process.env.QA_SANDBOX_ONLY) for(const family of ['cup','chair','umbrella','bin'].filter(f=>!process.env.QA_FAMILY||f===process.env.QA_FAMILY))for(const combo of ['watcher','drifter','rooted']){
 await page.goto(`http://localhost:8787/?spin=0&case=${family}-${combo}#evo=${fixtures[`${family}-${combo}`].code}`);
 await page.waitForFunction(()=>!document.querySelector('.evo-loading'));
 await page.waitForTimeout(1300);
 assert.ok((await page.locator('.evo-specimen .evo-eyebrow').innerText()).includes(family.toUpperCase()));
 assert.equal(await page.locator('.evo-combo-note strong').innerText(),{watcher:'警觉游走体',drifter:'逆风浮游体',rooted:'扎根共生体'}[combo]);
 await page.screenshot({path:`_research/natural-attachments-qa/${family}-${combo}.png`});
 console.log('rendered',family,combo);
}

for(const [family,organs] of [
 ['cup',['seal','eye','wheels','solar']],
 ['chair',['legs','eye','parachute','solar']],
 ['umbrella',['spring','eye','balloon','feathers']],
 ['bin',['wheels','pipe','seal','gauge']],
]) {
 if(process.env.QA_FAMILY&&family!==process.env.QA_FAMILY)continue;
 const hash=Buffer.from(JSON.stringify({f:family,o:organs,s:'LAB-001',x:null})).toString('base64');
 await page.goto('http://localhost:8787/?sandbox=1&spin=0&case='+family+'#lab='+hash);
 await page.waitForSelector('.lab-stage canvas');
 await page.waitForFunction(()=>!document.querySelector('.organ-card.pending'));
 await page.waitForFunction(()=>!document.querySelector('.lab-assembling'));
 await page.waitForTimeout(1000);
 await page.screenshot({path:'_research/natural-attachments-qa/sandbox-'+family+'.png'});
 console.log('rendered sandbox',family,organs.join(','));
}
console.log('errors',errors);await browser.close();assert.equal(errors.length,0);





