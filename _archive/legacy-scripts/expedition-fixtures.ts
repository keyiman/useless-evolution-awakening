import { writeFileSync } from 'node:fs';
import { createRun, offersFor, mutate, resolveTrial, continueRun, encodeRun, type Run } from '../src/engine/expedition';
import type { FamilyId } from '../src/engine/types';
const fixtures: Record<string, {code:string; choices:string[]}> = {};
function walk(r:Run, family:FamilyId) {
 for (const found of r.found) fixtures[`${family}-${found}`] ??= {code:encodeRun(r),choices:r.choices};
 if(r.phase==='won'||r.phase==='lost') {fixtures[`${family}-${r.phase}`] ??= {code:encodeRun(r),choices:r.choices};return;}
 for(const id of offersFor(r)) {
  const ready=mutate(r,id);
  for (const found of ready.found) fixtures[`${family}-${found}`] ??= {code:encodeRun(ready),choices:ready.choices};
  walk(continueRun(resolveTrial(ready)),family);
 }
}
for(const f of ['cup','chair','umbrella','bin'] as const) {
 for(let i=0;i<25;i++) {
  walk(createRun(f,i===0?'ESCAPE-001':`CHECK-${i}`),f);
  if(['won','lost','watcher','drifter','rooted'].every(k=>fixtures[`${f}-${k}`]))break;
 }
}
writeFileSync('_research/expedition-fixtures.json',JSON.stringify(fixtures,null,2));
console.log(Object.fromEntries(Object.entries(fixtures).map(([k,v])=>[k,v.choices.join(' → ')])));
