import * as THREE from 'three';
import { ORGAN_MAP, type OrganId } from '../engine/organs';
import { MUTATION_MAP } from '../engine/expedition';
import type { FamilyId } from '../engine/types';
export function normalizeModel(source: THREE.Object3D, height: number, span: number, rotation: [number,number,number] = [0,0,0]): THREE.Group {
  // Wrap instead of replacing the imported root's scale/position: GLBs may have root transforms.
  const rotated = new THREE.Group();
  rotated.add(source.clone(true));
  rotated.rotation.set(...rotation);
  rotated.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(rotated);
  const size = b.getSize(new THREE.Vector3());
  const center = b.getCenter(new THREE.Vector3());
  const scale = Math.min(height / Math.max(size.y, .00001), span / Math.max(size.x, size.z, .00001));
  const offset = new THREE.Group(); offset.add(rotated);
  offset.position.set(-center.x, -b.min.y, -center.z);
  const result = new THREE.Group(); result.add(offset); result.scale.setScalar(scale);
  result.updateMatrixWorld(true);
  return result;
}
export function mountSlot(id: OrganId): string {
  return MUTATION_MAP[id]?.slot ?? ({ top: 'crown', side: 'right', bottom: 'feet', around: 'skin' }[ORGAN_MAP[id].anchor]);
}
export function organModel(source: THREE.Object3D, id: OrganId, bodyWidth: number) {
  const slot = mountSlot(id);
  const width = Math.max(.35, Math.min(.9, bodyWidth));
  let height = slot === 'feet' ? .30 : slot === 'crown' ? .38 : .28;
  let span = slot === 'feet' ? width * 1.1 : slot === 'skin' ? width * 1.1 : .38;
  if (id === 'balloon') { height = .46; span = .48; }
  if (id === 'mycelium') { height = .16; span = width * 1.15; }
  if (id === 'parachute') { height = .38; span = .68; }
  if (id === 'eye') { height = .22; span = .23; }
  if (id === 'solar') { height = .33; span = .38; }
  if (slot === 'skin' && id !== 'mycelium') height = .32;
  const rotation: [number,number,number] = id === 'feathers' ? [Math.PI/2,0,0] : id === 'parachute' ? [0,0,0] : ORGAN_MAP[id].rot;
  const model = normalizeModel(source, height, span, rotation);
  if(id === 'seal') {
    const cap = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
    const diameter = Math.max(.28, width*.8);
    model.scale.multiply(new THREE.Vector3(diameter/Math.max(cap.x,.001), .09/Math.max(cap.y,.001), diameter/Math.max(cap.z,.001)));
    model.updateMatrixWorld(true);
  }
  const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
  const centered = new THREE.Group(); centered.add(model); model.position.y = -size.y / 2;
  centered.updateMatrixWorld(true);
  return { scene: centered, size };
}
export interface PartShape { id: OrganId; size: THREE.Vector3 }
export interface Placement { id: OrganId; position: [number,number,number]; joint: [number,number,number]; }
// Sample the actual cross-section. Umbrella canopy and chair back are not attachment surfaces for feet/side organs.
function section(base: THREE.Object3D, y: number, height: number) {
  const points: THREE.Vector3[] = [];
  base.updateMatrixWorld(true);
  base.traverse(o => {
    const m = o as THREE.Mesh;
    const p = m.geometry?.getAttribute('position');
    if (!m.isMesh || !p) return;
    for (let i = 0; i < p.count; i += Math.max(1, Math.floor(p.count / 6000))) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld);
      if (Math.abs(v.y-y) < height*.07) points.push(v);
    }
  });
  if (points.length < 4) return new THREE.Box3().setFromObject(base);
  return new THREE.Box3().setFromPoints(points);
}
export function attachmentLayout(base: THREE.Object3D, family: FamilyId, shapes: PartShape[]) {
  const bounds = new THREE.Box3().setFromObject(base);
  const dims = bounds.getSize(new THREE.Vector3());
  const h = dims.y;
  const sideY = h * ({ cup: .58, chair: .46, umbrella: .62, bin: .60 }[family]);
  const profile = section(base, sideY, h);
  const center = profile.getCenter(new THREE.Vector3());
  const topProfile = section(base, h*.94, h);
  const topCenter = topProfile.getCenter(new THREE.Vector3());
  const feet = shapes.filter(p => mountSlot(p.id) === 'feet');
  const lift = Math.max(0, ...feet.map(p => Math.max(0, p.size.y-.02)));
  const counts = new Map<string, number>();
  const parts: Placement[] = shapes.map(({ id, size }) => {
    const slot = mountSlot(id);
    const n = counts.get(slot) ?? 0; counts.set(slot, n+1);
    let position: [number,number,number];
    let joint: [number,number,number];
    if (slot === 'feet') {
      const x = feet.length > 1 ? (n-(feet.length-1)/2)*.22 : 0;
      position = [x,size.y/2,0]; joint = [x,lift+.015,0];
    } else if (slot === 'crown') {
      const onSeat = family === 'chair' && id === 'seal';
      const crownY = onSeat ? h*.48 : h;
      const crownCenter = onSeat ? section(base,crownY,h).getCenter(new THREE.Vector3()) : topCenter;
      const x = crownCenter.x + (n ? (n%2 ? 1 : -1)*.22 : 0);
      position = [x,crownY+lift+size.y/2-.025,crownCenter.z]; joint = [x,crownY+lift-.035,crownCenter.z];
    } else if (slot === 'skin') {
      const y = id === 'mycelium' ? .06 + lift : h*.56+lift;
      position = [center.x,y,center.z]; joint = [center.x,y,center.z];
    } else {
      // Opposite sides and then alternating azimuth, rather than a vertical stack.
      const angle = (slot === 'left' ? -Math.PI/4 : Math.PI/3) + n * 1.1;
      const rx = Math.max(.07,(profile.max.x-profile.min.x)/2);
      const rz = Math.max(.07,(profile.max.z-profile.min.z)/2);
      const dx = Math.sin(angle), dz = Math.cos(angle);
      joint = [center.x+dx*rx,sideY+lift,center.z+dz*rz];
      position = [joint[0]+dx*(size.x/2-.02),joint[1],joint[2]+dz*(size.z/2-.02)];
    }
    return { id, position, joint };
  });
  return { lift, parts, dims };
}
