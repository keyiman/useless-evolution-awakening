import { NodeIO } from '@gltf-transform/core';
import { MeshoptDecoder } from 'meshoptimizer';
import fs from 'node:fs';
const m = JSON.parse(fs.readFileSync('public/models/manifest.json','utf8'));
const io = new NodeIO().registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
for (const id of ['seal','arm','wheels','gimbal','funnel','shell','handle','parasite']) {
  const rec = Object.values(m).find(v => v.nodeId === `organ:${id}`);
  const doc = await io.read(`public/models/${rec.file}`);
  let min=[1e9,1e9,1e9], max=[-1e9,-1e9,-1e9];
  for (const mesh of doc.getRoot().listMeshes()) for (const prim of mesh.listPrimitives()) {
    const acc = prim.getAttribute('POSITION');
    const a = acc.getMin([]), b = acc.getMax([]);
    for (let i=0;i<3;i++){ min[i]=Math.min(min[i],a[i]); max[i]=Math.max(max[i],b[i]); }
  }
  console.log(id.padEnd(9), 'size', max.map((v,i)=>(v-min[i]).toFixed(2)).join(' x '), 'min', min.map(v=>v.toFixed(2)).join(','), 'max', max.map(v=>v.toFixed(2)).join(','));
}
