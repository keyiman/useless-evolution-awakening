const fs=require('fs');
const p='public/models/manifest.json';
const m=JSON.parse(fs.readFileSync(p,'utf8'));
const labels={cup:'水杯 G0',chair:'椅子 G0',umbrella:'雨伞 G0',bin:'垃圾桶 G0'};
for(const e of Object.values(m)){ if(labels[e.family]) e.nodeLabel=labels[e.family]; }
fs.writeFileSync(p,JSON.stringify(m,null,2)+'\n');
console.log(Object.values(m).map(e=>e.nodeLabel).join(' / '));
