import fs from 'node:fs';
const m = JSON.parse(fs.readFileSync('public/models/manifest.json','utf8'));
for (const id of ['seal','arm','wheels','gimbal','funnel','shell','handle','parasite']) {
  const rec = Object.values(m).find(v => v.nodeId === `organ:${id}`);
  const buf = fs.readFileSync(`public/models/${rec.file}`);
  const jsonLen = buf.readUInt32LE(12);
  const gltf = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
  let min=[1e9,1e9,1e9], max=[-1e9,-1e9,-1e9];
  for (const mesh of gltf.meshes || []) for (const prim of mesh.primitives || []) {
    const idx = prim.attributes?.POSITION;
    const acc = gltf.accessors?.[idx];
    if (!acc?.min || !acc?.max) continue;
    for (let i=0;i<3;i++){ min[i]=Math.min(min[i],acc.min[i]); max[i]=Math.max(max[i],acc.max[i]); }
  }
  console.log(id.padEnd(9), 'size', max.map((v,i)=>(v-min[i]).toFixed(2)).join(' x '), 'min', min.map(v=>v.toFixed(2)).join(','), 'max', max.map(v=>v.toFixed(2)).join(','));
}
