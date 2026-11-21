const fs=require('fs');
let code=fs.readFileSync('scripts/expedition-model-qa.mjs','utf8');
code=code.replace("const errors=[];page.on('pageerror',e=>errors.push(e.message));", "const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,500));});\nfs.mkdirSync('_research/natural-attachments-qa',{recursive:true});");
code=code.replaceAll('_research/expedition-qa/','_research/natural-attachments-qa/');
const end="console.log('errors',errors);await browser.close();";
const sandbox=`
for(const [family,organs] of [
 ['cup',['seal','eye','wheels','solar']],
 ['chair',['legs','eye','parachute','solar']],
 ['umbrella',['spring','eye','balloon','feathers']],
 ['bin',['wheels','pipe','seal','gauge']],
]) {
 const hash=Buffer.from(JSON.stringify({f:family,o:organs,s:'LAB-001',x:null})).toString('base64');
 await page.goto('http://localhost:8787/?sandbox=1&spin=0&case='+family+'#lab='+hash);
 await page.waitForSelector('.lab-stage canvas');
 await page.waitForFunction(()=>!document.querySelector('.organ-card.pending'));
 await page.waitForTimeout(1800);
 await page.screenshot({path:'_research/natural-attachments-qa/sandbox-'+family+'.png'});
 console.log('rendered sandbox',family,organs.join(','));
}
console.log('errors',errors);await browser.close();assert.equal(errors.length,0);
`;
code=code.replace(end,sandbox);
fs.writeFileSync('scripts/natural-attachments-qa.mjs',code);
const p=JSON.parse(fs.readFileSync('package.json','utf8'));
p.scripts['test:expedition']='tsx scripts/expedition-check.ts && tsx scripts/attachment-check.ts && tsx scripts/attachment-contact-check.ts && tsx scripts/morphology-check.ts';
p.scripts['test:attachments']='tsx scripts/attachment-check.ts && tsx scripts/attachment-contact-check.ts && tsx scripts/morphology-check.ts';
fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n');
