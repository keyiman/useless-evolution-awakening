const fs=require('fs');
const file='scripts/expedition-model-qa.mjs';let s=fs.readFileSync(file,'utf8');
s=s.replace("import fs from 'node:fs';", "import fs from 'node:fs';\nimport assert from 'node:assert/strict';");
s=s.replace("await page.waitForTimeout(1300);", "await page.waitForTimeout(1300);\n assert.ok((await page.locator('.evo-specimen .evo-eyebrow').innerText()).includes(family.toUpperCase()));\n assert.equal(await page.locator('.evo-combo-note strong').innerText(),{watcher:'警觉游走体',drifter:'逆风浮游体',rooted:'扎根共生体'}[combo]);");
fs.writeFileSync(file,s);
