import assert from 'node:assert/strict';
import * as THREE from 'three';
import { normalizeModel, measureAnatomy, organModel, attachmentLayout } from '../src/lab/attachment';
const cup=new THREE.Group();
const body=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,1,64),new THREE.MeshBasicMaterial());body.position.y=.5;cup.add(body);
const handle=new THREE.Mesh(new THREE.TorusGeometry(.21,.035,12,36));handle.position.set(.41,.52,0);cup.add(handle);
const anatomy=measureAnatomy(cup,'cup');
assert.ok(Math.abs(anatomy.crown.center.x)<.02,'rim ignores handle');
assert.ok(Math.abs(anatomy.crown.width-.6)<.035,'lid fits opening, not full handle-inclusive bounds');
const dummyCap=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.2,32));
const cap=organModel(dummyCap,'seal',anatomy);
assert.ok(cap.size.x>=.6&&cap.size.x<.65);
const shapes=[{id:'eye' as const,size:new THREE.Vector3(.18,.18,.15)},{id:'jet' as const,size:new THREE.Vector3(.24,.20,.24)}];
const layout=attachmentLayout(cup,'cup',shapes);
cup.updateMatrixWorld(true);
for(const p of layout.parts){
  const point=new THREE.Vector3(...p.joint);point.y-=layout.lift;
  const radial=new THREE.Vector3(point.x,0,point.z).normalize();
  const ray=new THREE.Raycaster(point.clone().addScaledVector(radial,.1),radial.clone().negate());
  const hit=ray.intersectObject(body,true)[0];
  assert.ok(hit&&hit.point.distanceTo(point)<.015,'side organ attaches to actual mesh surface');
  assert.ok(p.rotation&&p.offset&&p.bounds);
}
const parent=new THREE.Group();parent.position.set(5,7,8);parent.rotation.y=.6;parent.add(cup);parent.updateMatrixWorld(true);
const moved=attachmentLayout(cup,'cup',shapes);
for(let i=0;i<layout.parts.length;i++)assert.ok(new THREE.Vector3(...layout.parts[i].position).distanceTo(new THREE.Vector3(...moved.parts[i].position))<1e-6,'placement independent of live parent transforms');
console.log('Natural attachment checks passed: rim fit, actual surface contact, orientation, local-space invariance.');

// An open inherited bin lid must not be mistaken for the opening or support a floating new cap.
const bin=new THREE.Group();
const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.65,48));barrel.position.y=.325;bin.add(barrel);
const openLid=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.025,48));openLid.rotation.x=-.85;openLid.position.set(0,.81,-.10);bin.add(openLid);
const binAnatomy=measureAnatomy(bin,'bin');
assert.ok(Math.abs(binAnatomy.crown.y-.65)<.035,'bin opening is the barrel rim, not the open lid tip');
assert.ok(Math.abs(binAnatomy.crown.center.z)<.02,'new cap centered on barrel');
console.log('Open-bin rim check passed: lid tip excluded from attachment surface.');
const crowded=attachmentLayout(cup,'cup',['eye','speaker','jet','gauge'].map(id=>({id:id as any,size:new THREE.Vector3(.24,.24,.20)})));
for(let i=0;i<crowded.parts.length;i++)for(let j=i+1;j<crowded.parts.length;j++){
 const a=crowded.parts[i].bounds,b=crowded.parts[j].bounds;
 const intersection=a.clone().intersect(b);
 const overlap=intersection.isEmpty()?new THREE.Vector3():intersection.getSize(new THREE.Vector3());
 const size=a.getSize(new THREE.Vector3());
 assert.ok(overlap.x*overlap.y*overlap.z/(size.x*size.y*size.z)<.15,'dense side organs do not occupy the same volume');
}
console.log('Clearance check passed: four crowded side organs separated.');
