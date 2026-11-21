import assert from 'node:assert/strict';
import * as THREE from 'three';
import { morphBody } from '../src/lab/morphology';
const base=new THREE.Group();const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.9,24,12),new THREE.MeshStandardMaterial({color:'white'}));mesh.position.y=.45;base.add(mesh);
const source=mesh.geometry.getAttribute('position').array.slice();
const evolved=morphBody(base,['legs','mycelium']);
assert.deepEqual(mesh.geometry.getAttribute('position').array,source,'cached geometry remains untouched');
const changed=(evolved.children[0] as THREE.Mesh).geometry.getAttribute('position').array;
assert.notDeepEqual(changed,source,'evolution changes body geometry, not just additions');
const bounds=new THREE.Box3().setFromObject(evolved);
assert.ok(Math.abs(bounds.min.y)<1e-5);
assert.ok(Math.abs(bounds.max.y-.9)<1e-5);
for(const v of changed)assert.ok(Number.isFinite(v));
console.log('Morphology checks passed: inherited silhouette deforms, ground and crown retained, source untouched.');
// Optimized GLBs use normalized Int16 POSITION attributes. Expansion must not overflow their storage.
const quantized=new THREE.Group();
const geometry=new THREE.CylinderGeometry(1,1,2,24,12);
const original=geometry.getAttribute('position');
const ints=new Int16Array(original.count*3);
for(let i=0;i<original.count;i++){ints[i*3]=Math.round(original.getX(i)*32767);ints[i*3+1]=Math.round(original.getY(i)*32767);ints[i*3+2]=Math.round(original.getZ(i)*32767);}
geometry.setAttribute('position',new THREE.BufferAttribute(ints,3,true));
const quantMesh=new THREE.Mesh(geometry);quantMesh.position.y=1;quantized.add(quantMesh);
const expanded=morphBody(quantized,['balloon']);
const expandedBounds=new THREE.Box3().setFromObject(expanded);
assert.ok(expandedBounds.max.x>1.1,'quantized geometry expands without integer wraparound');
console.log('Quantized geometry check passed: no wraparound or spikes.');
// A chair's new feet replace its old leg length instead of supporting a complete chair on a second set of legs.
const chair=new THREE.Group();
const seat=new THREE.Mesh(new THREE.BoxGeometry(.6,.10,.55));seat.position.y=.5;chair.add(seat);
const back=new THREE.Mesh(new THREE.BoxGeometry(.55,.6,.06));back.position.set(0,.8,-.24);chair.add(back);
for(const x of [-.24,.24])for(const z of [-.2,.2]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.055,.45,.055));leg.position.set(x,.225,z);chair.add(leg);}
const mechanicalChair=morphBody(chair,['legs'],'chair');
const chairBox=new THREE.Box3().setFromObject(mechanicalChair);
const newSeatBox=new THREE.Box3().setFromObject(mechanicalChair.children[0]);
assert.ok(Math.abs(chairBox.min.y)<1e-5,'mechanical chair body re-grounded');
assert.ok(newSeatBox.min.y<.16,'old wood legs retract so mechanical feet attach under the seat');
assert.ok(chairBox.max.y<.9,'no double-height leg stack');
console.log('Chair transition check passed: inherited leg stubs meet the new support.');
const bin=new THREE.Group();
const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.65,48));barrel.position.y=.325;bin.add(barrel);
const lid=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.025,48));lid.rotation.x=-.85;lid.position.set(0,.81,-.10);bin.add(lid);
const sealedBin=morphBody(bin,['seal'],'bin');
assert.ok(new THREE.Box3().setFromObject(sealedBin).max.y<.72,'new seal replaces inherited open lid rather than stacking above it');
console.log('Bin transition check passed: old open lid does not compete with new seal.');
const floatingBin=morphBody(bin,['balloon'],'bin');
assert.ok(new THREE.Box3().setFromObject(floatingBin).max.y<.72,'balloon port also replaces old lid instead of intersecting it');
