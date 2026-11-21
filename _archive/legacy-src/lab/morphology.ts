import * as THREE from 'three';
import type { OrganId } from '../engine/organs';
import type { FamilyId } from '../engine/types';
import { measureAnatomy, mountSlot } from './attachment';

/** Deform inherited geometry in specimen coordinates; never mutate useGLTF's cached geometry. */
export function morphBody(source: THREE.Object3D, organs: OrganId[], family?: FamilyId): THREE.Object3D {
  const root=source.clone(true);
  root.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(root);
  const center=bounds.getCenter(new THREE.Vector3());
  const height=Math.max(.001,bounds.max.y-bounds.min.y);
  const walker=organs.includes('legs')||organs.includes('wheels');
  const aerial=organs.includes('balloon');
  const rooted=organs.includes('mycelium');
  const mechanicalChair=family==='chair'&&organs.some(id=>['legs','wheels','suction','spring','drill'].includes(id));
  const foldY=mechanicalChair?measureAnatomy(root,'chair').seat.y-height*.035:0;
  const replaceBinLid=family==='bin'&&organs.some(id=>mountSlot(id)==='crown');
  const lidCut=replaceBinLid?measureAnatomy(root,'bin').crown.y+height*.022:Infinity;
  root.traverse(o=>{
    const mesh=o as THREE.Mesh;
    if(!mesh.isMesh)return;
    mesh.geometry=mesh.geometry.clone();
    const original=mesh.geometry.getAttribute('position');
    // Quantized GLBs store normalized Int16s. Expanding those in place wraps at ±1.
    const position=new THREE.Float32BufferAttribute(new Float32Array(original.count*3),3);
    for(let i=0;i<original.count;i++)position.setXYZ(i,original.getX(i),original.getY(i),original.getZ(i));
    mesh.geometry.setAttribute('position',position);
    mesh.geometry.deleteAttribute('normal');
    mesh.geometry.deleteAttribute('tangent');
    const inverse=mesh.matrixWorld.clone().invert();
    const p=new THREE.Vector3();
    for(let i=0;i<position.count;i++) {
      p.fromBufferAttribute(position,i).applyMatrix4(mesh.matrixWorld);
      const y=THREE.MathUtils.clamp((p.y-bounds.min.y)/height,0,1);
      let radial=1;
      if(walker)radial-=.22*Math.pow(1-y,2);
      if(aerial)radial+=.12*Math.sin(y*Math.PI);
      if(rooted)radial+=Math.sin(y*17+Math.atan2(p.z-center.z,p.x-center.x)*3)*.035*Math.sin(y*Math.PI);
      if(organs.includes('seal'))radial-=.1*Math.pow(y,5);
      p.x=center.x+(p.x-center.x)*radial;
      p.z=center.z+(p.z-center.z)*radial;
      if(mechanicalChair&&p.y<foldY)p.y=foldY-(foldY-p.y)*.18;
      p.applyMatrix4(inverse);
      position.setXYZ(i,p.x,p.y,p.z);
    }
    position.needsUpdate=true;
    if(replaceBinLid){
      const geometry=mesh.geometry;
      const index=geometry.getIndex();
      const count=index?.count??position.count;
      const kept:number[]=[];
      const vertex=new THREE.Vector3();
      for(let i=0;i<count;i+=3){
        const indices=[0,1,2].map(j=>index?index.getX(i+j):i+j);
        let y=0;
        for(const k of indices)y+=vertex.fromBufferAttribute(position,k).applyMatrix4(mesh.matrixWorld).y;
        if(y/3<=lidCut)kept.push(...indices);
      }
      if(kept.length<count){
        if(!kept.length){mesh.geometry=new THREE.BufferGeometry();mesh.visible=false;}
        else{
          geometry.setIndex(kept);
          mesh.geometry=geometry.toNonIndexed();
          if(mesh.geometry.groups.length){mesh.geometry.clearGroups();mesh.geometry.addGroup(0,mesh.geometry.getAttribute('position').count,0);}
        }
        geometry.dispose();
      }
    }
    mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();
  });
  if(mechanicalChair){
    root.updateMatrixWorld(true);
    root.position.y-=new THREE.Box3().setFromObject(root).min.y;
    root.updateMatrixWorld(true);
  }
  return root;
}
