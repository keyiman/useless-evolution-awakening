import assert from 'node:assert/strict';
import * as THREE from 'three';
import { measureAnatomy, attachmentLayout } from '../src/lab/attachment';
import { createSideGraft, createRimGraft, createFootGraft } from '../src/lab/graftGeometry';
import { prepareGraftedOrgan, sampleGraftAppearance } from '../src/lab/graftMaterial';
const body=new THREE.Group();
const cylinder=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,1,64,12),new THREE.MeshStandardMaterial({color:'#f4f0e6',roughness:.28}));cylinder.position.y=.5;body.add(cylinder);
const anatomy=measureAnatomy(body,'cup');
const layout=attachmentLayout(body,'cup',[{id:'eye',size:new THREE.Vector3(.16,.16,.16)}],anatomy);
const placement=layout.parts[0];
const geometry=createSideGraft(anatomy,placement,new THREE.Vector3(.006,0,.085),.035,0);
const vertices=geometry.getAttribute('position');
for(let i=0;i<vertices.count;i++)for(const v of [vertices.getX(i),vertices.getY(i),vertices.getZ(i)])assert.ok(Number.isFinite(v));
const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(...placement.rotation,'YXZ'));
for(let i=0;i<=32;i++){
 const point=new THREE.Vector3().fromBufferAttribute(vertices,i).applyQuaternion(q).add(new THREE.Vector3(...placement.joint));
 assert.ok(Math.abs(Math.hypot(point.x,point.z)-.3)<.007,'graft root follows curved body, not a flat washer');
}
assert.ok(geometry.getAttribute('normal').count===vertices.count);
const appearance=sampleGraftAppearance(anatomy,placement,0);
assert.ok(appearance.color instanceof THREE.Color);
assert.equal(appearance.roughness,.28);
const organ=new THREE.Group();const mesh=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,.14),new THREE.MeshStandardMaterial({color:'#777777'}));organ.add(mesh);
const originalPosition=mesh.geometry.getAttribute('position').array.slice();
const coated=prepareGraftedOrgan(organ,placement,new THREE.Vector3(.006,0,.085),appearance);
const grown=coated.children[0] as THREE.Mesh;
const weights=grown.geometry.getAttribute('graftWeight');assert.ok(weights);
for(let i=0;i<weights.count;i++)assert.ok(weights.getX(i)>=0&&weights.getX(i)<=1);
assert.ok(Array.from(weights.array).some(x=>x>0));
assert.deepEqual(mesh.geometry.getAttribute('position').array,originalPosition,'cached model untouched');
assert.equal(mesh.geometry.getAttribute('graftWeight'),undefined,'graft coating is instance-local');
for(const g of [createRimGraft(anatomy,.045),createFootGraft(anatomy,new THREE.Vector3(.56,.2,.56))]){
 assert.ok(g.getAttribute('position').count>64);g.computeBoundingBox();assert.ok(!g.boundingBox!.isEmpty());
}
console.log('Graft checks passed: curved root contact, finite normals, inherited PBR, isolated graded coating, rim and foot transitions.');
const support=attachmentLayout(body,'cup',[{id:'legs',size:new THREE.Vector3(.5,.3,.5)}],anatomy);
assert.ok(support.parts[0].bounds.max.y-support.lift>=.04,'support overlaps the specimen enough to hide a butt-joint seam');
// A thin solar panel is a sheet: the transition must end behind it, not puncture the blue face.
const plane={point:new THREE.Vector3(0,0,.08),normal:new THREE.Vector3(0,.5,1).normalize()};
const behindPanel=(createSideGraft as any)(anatomy,placement,new THREE.Vector3(0,0,.12),.035,0,plane) as THREE.BufferGeometry;
const panelVertices=behindPanel.getAttribute('position');
for(let i=0;i<panelVertices.count;i++)assert.ok(panelVertices.getZ(i)<=.08-.5*panelVertices.getY(i)+1e-5,'fillet stays behind the active panel face');
