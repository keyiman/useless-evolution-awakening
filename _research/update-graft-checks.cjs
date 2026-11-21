const fs=require('fs');
const p=JSON.parse(fs.readFileSync('package.json','utf8'));
p.scripts['test:grafts']='tsx scripts/graft-check.ts';
p.scripts['test:attachments']='tsx scripts/attachment-check.ts && tsx scripts/attachment-contact-check.ts && tsx scripts/morphology-check.ts && tsx scripts/graft-check.ts';
fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n');
