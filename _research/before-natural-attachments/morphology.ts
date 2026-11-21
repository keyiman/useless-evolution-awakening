import * as THREE from 'three';
import type { OrganId } from '../engine/organs';

/** Deform inherited geometry in specimen coordinates; never mutate useGLTF's cached geometry. */
export function morphBody(source: THREE.Object3D, organs: OrganId[]): THREE.Object3D {
  const root=source.clone(true);
  root.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(root);
  const center=bounds.getCenter(new THREE.Vector3());
  const height=Math.max(.001,bounds.max.y-bounds.min.y);
  const walker=organs.includes('legs')||organs.includes('wheels');
  const aerial=organs.includes('balloon');
  const rooted=organs.includes('mycelium');
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
      p.applyMatrix4(inverse);
      position.setXYZ(i,p.x,p.y,p.z);
    }
    position.needsUpdate=true;
    mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();
  });
  return root;
}
