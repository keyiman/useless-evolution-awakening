import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {EXHIBITS,readProgress,writeProgress} from '../src/living/exhibits';
import {prepareLuxModel} from '../src/living/luxModel';
import {loadLuxSource} from './load-lux-source';
const manifest=JSON.parse(fs.readFileSync('public/models/manifest.json','utf8'));
assert.equal(EXHIBITS.length,4);
for(const exhibit of EXHIBITS){assert.equal(exhibit.stages.length,5);assert.ok(fs.existsSync('public'+exhibit.url));assert.ok(manifest[exhibit.url.split('/').at(-1)!.replace('.glb','')]);assert.equal(exhibit.source,'Aholo Lux3D · G1-Turbo');}
const memory=new Map<string,string>(),store={getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>{memory.set(k,v);}};
writeProgress(store,'cup',3);writeProgress(store,'chair',1);assert.equal(readProgress(store,'cup'),3);assert.equal(readProgress(store,'chair'),1);assert.equal(readProgress(store,'bin'),0);memory.set('living-stage-bin','NaN');assert.equal(readProgress(store,'bin'),0);
const source=new THREE.Group(),mesh=new THREE.Mesh(new THREE.BoxGeometry(2,4,2),new THREE.MeshStandardMaterial());mesh.position.set(7,8,-3);source.add(mesh);source.position.x=4;
const before=Array.from(mesh.geometry.getAttribute('position').array),originalMaterial=mesh.material;
const made=prepareLuxModel(source,'chair');const bounds=new THREE.Box3().setFromObject(made.root);assert.ok(Math.abs(bounds.min.y)<1e-6);assert.ok(bounds.max.y<=1.26);assert.deepEqual(Array.from(mesh.geometry.getAttribute('position').array),before);assert.equal(mesh.material,originalMaterial);assert.ok(made.meshes[0].geometry.getAttribute('uv'));assert.notEqual(made.meshes[0].material,mesh.material);
assert.equal(made.root.userData.source,'Aholo Lux3D');assert.ok(made.meshes[0].customDepthMaterial,'animated shadows');made.dispose();
for(const e of EXHIBITS){
 const source=await loadLuxSource(e.url);let original:THREE.Mesh|null=null;source.traverse(o=>{if((o as THREE.Mesh).isMesh)original=o as THREE.Mesh;});
 const raw=(original as unknown as THREE.Mesh).geometry.getAttribute('position'),copy=Array.from(raw.array),originalMap=((original as unknown as THREE.Mesh).material as THREE.MeshStandardMaterial).map;
 const model=prepareLuxModel(source,e.id),pos=model.meshes[0].geometry.getAttribute('position');
 assert.equal(pos.count,raw.count,'same original Lux3D topology');assert.ok(originalMap);assert.equal((model.meshes[0].material as THREE.MeshStandardMaterial).map,originalMap,'preserve the generated texture');assert.deepEqual(Array.from(raw.array),copy,'shared source is untouched');
 for(let i=0;i<pos.count;i++)assert.ok([pos.getX(i),pos.getY(i),pos.getZ(i)].every(v=>Number.isFinite(v)&&Math.abs(v)<2),'quantized GLB does not overflow');
 if(e.id==='bin'){assert.ok(model.lidCut>.86&&model.lidCut<.90,'lid rotation excludes the actual barrel rim');assert.ok(model.uniforms.lifeHingeZ.value<-.30,'hinge is behind barrel');}
 model.dispose();
}
console.log('Exhibits passed: four real Lux3D assets, five stages each, separate progress, grounded source-safe textured models and animated shadows.');
