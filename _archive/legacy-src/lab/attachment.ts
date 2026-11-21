import * as THREE from 'three';
import { ORGAN_MAP, type OrganId } from '../engine/organs';
import { MUTATION_MAP } from '../engine/expedition';
import type { FamilyId } from '../engine/types';

type V3 = [number, number, number];
const bounded = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export function normalizeModel(source: THREE.Object3D, height: number, span: number, rotation: V3 = [0, 0, 0]): THREE.Group {
  const rotated = new THREE.Group();
  rotated.add(source.clone(true));
  rotated.rotation.set(...rotation);
  rotated.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(rotated);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = Math.min(height / Math.max(size.y, .00001), span / Math.max(size.x, size.z, .00001));
  const offset = new THREE.Group();
  offset.add(rotated);
  offset.position.set(-center.x, -box.min.y, -center.z);
  const result = new THREE.Group();
  result.add(offset);
  result.scale.setScalar(scale);
  result.updateMatrixWorld(true);
  return result;
}

export function mountSlot(id: OrganId): string {
  return MUTATION_MAP[id]?.slot ?? ({ top: 'crown', side: 'right', bottom: 'feet', around: 'skin' }[ORGAN_MAP[id].anchor]);
}

export interface SurfaceProfile {
  center: THREE.Vector3;
  width: number;
  depth: number;
  y: number;
  samples: number;
}
export interface Anatomy {
  family: FamilyId;
  local: THREE.Object3D;
  bounds: THREE.Box3;
  dims: THREE.Vector3;
  crown: SurfaceProfile;
  waist: SurfaceProfile;
  foot: SurfaceProfile;
  seat: SurfaceProfile;
}

/** Specimen coordinates stay invariant when its rendered parent moves or rotates. */
export function measureAnatomy(base: THREE.Object3D, family: FamilyId): Anatomy {
  const local = base.clone(true);
  local.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(local);
  const dims = bounds.getSize(new THREE.Vector3());
  const points: THREE.Vector3[] = [];
  local.traverse(o => {
    const m = o as THREE.Mesh;
    const position = m.geometry?.getAttribute('position');
    if (!m.isMesh || !position) return;
    const stride = Math.max(1, Math.floor(position.count / 18000));
    for (let i = 0; i < position.count; i += stride) {
      points.push(new THREE.Vector3().fromBufferAttribute(position, i).applyMatrix4(m.matrixWorld));
    }
  });
  const profile = (fraction: number, band = .035): SurfaceProfile => {
    const y = bounds.min.y + dims.y * fraction;
    const slice = points.filter(p => Math.abs(p.y - y) <= dims.y * band);
    const box = slice.length > 3 ? new THREE.Box3().setFromPoints(slice) : bounds;
    const center = box.getCenter(new THREE.Vector3());
    center.y = y;
    return { center, width: Math.max(.02, box.max.x - box.min.x), depth: Math.max(.02, box.max.z - box.min.z), y, samples: slice.length };
  };
  const crown = profile(.988, .018);
  crown.y = bounds.max.y;
  crown.center.y = bounds.max.y;
  if(family==='bin'){
    const mid=profile(.4,.06);
    const reference=mid.samples>=8?mid:profile(.025,.04);
    for(let f=.40;f<.99;f+=.0075){
      const p=profile(f,.008);
      if(p.samples>=8&&p.width>=reference.width*.93&&p.depth>=reference.depth*.93&&p.width/p.depth>.72&&p.width/p.depth<1.4){
        crown.y=p.y;crown.center.set(reference.center.x,p.y,reference.center.z);
        crown.width=Math.min(p.width,reference.width*1.08);
        crown.depth=Math.min(p.depth,reference.depth*1.08);
      }
    }
  }
  let seat = profile(.48, .025);
  if (family === 'chair') {
    let area = 0;
    for (let fraction = .12; fraction <= .61; fraction += .015) {
      const candidate = profile(fraction, .014);
      const candidateArea = candidate.width * candidate.depth;
      if (candidateArea >= area * .97) { seat = candidate; area = Math.max(area, candidateArea); }
    }
    const ray = new THREE.Raycaster(new THREE.Vector3(seat.center.x, bounds.max.y + 1, seat.center.z), new THREE.Vector3(0, -1, 0));
    const hit = ray.intersectObject(local, true)[0];
    if (hit && hit.point.y <= bounds.min.y + dims.y * .68) { seat.y = hit.point.y; seat.center.y = seat.y; }
  }
  const foot = profile(.025, .035);
  let waist = profile(family === 'chair' ? .47 : family === 'umbrella' ? .55 : .52, .04);
  if(family==='umbrella'){
    let area=0;
    for(let f=.58;f<.91;f+=.012){const p=profile(f,.014);const a=p.width*p.depth;if(p.samples>=8&&a>area){waist=p;area=a;}}
  }
  if (family === 'cup' || family === 'bin') {
    waist.center.x = crown.center.x;
    waist.center.z = crown.center.z;
    waist.width = Math.min(waist.width, crown.width);
    waist.depth = Math.min(waist.depth, crown.depth);
    foot.center.x = crown.center.x;
    foot.center.z = crown.center.z;
    foot.width = Math.min(foot.width, crown.width);
    foot.depth = Math.min(foot.depth, crown.depth);
  }
  return { family, local, bounds, dims, crown, waist, foot, seat };
}

/** Size to the opening or supporting footprint, never to a handle-inclusive bounding box. */
export function organModel(source: THREE.Object3D, id: OrganId, anatomyOrWidth: Anatomy | number) {
  const anatomy = typeof anatomyOrWidth === 'number' ? null : anatomyOrWidth;
  const slot = mountSlot(id);
  const body = anatomy?.family === 'chair' ? anatomy.seat : anatomy?.waist;
  const width = bounded(body?.width ?? Number(anatomyOrWidth), .22, .86);
  const bodyHeight = anatomy?.dims.y ?? .98;
  let height = slot === 'feet' ? .26 : slot === 'crown' ? .32 : bounded(bodyHeight * .22, .15, .25);
  let span = slot === 'feet' ? width : slot === 'skin' ? width * 1.12 : bounded(width * .46, .16, .28);
  if (id === 'balloon') { height = .38; span = .32; }
  if (id === 'parachute') { height = .30; span = .50; }
  if (id === 'eye') { height = .15; span = .16; }
  if (id === 'solar') { height = .27; span = .29; }
  if (id === 'jet') { height = .19; span = .22; }
  if (id === 'arm' || id === 'handle') { height = .34; span = .34; }
  if (id === 'mycelium') { height = .10; span = width; }
  const rotation: V3 = id === 'feathers' ? [Math.PI / 2, 0, 0]
    : id === 'parachute' || id === 'eye' || id === 'jet' ? [0, 0, 0]
    : id === 'solar' ? [-.3, 0, 0] : ORGAN_MAP[id].rot;
  const model = normalizeModel(source, height, span, rotation);
  if(id==='solar'||id==='eye'){
    const box=new THREE.Box3().setFromObject(model);
    const cutoff=box.min.y+(box.max.y-box.min.y)*.22;
    model.traverse(o=>{
      const m=o as THREE.Mesh;if(!m.isMesh)return;
      const original=m.geometry;
      const position=original.getAttribute('position'),index=original.getIndex();
      if(!position)return;
      const kept:number[]=[];const point=new THREE.Vector3();
      for(let i=0;i<(index?.count??position.count);i+=3){
        const triangle=[0,1,2].map(j=>index?index.getX(i+j):i+j);
        let y=0;for(const k of triangle)y+=point.fromBufferAttribute(position,k).applyMatrix4(m.matrixWorld).y;
        if(y/3>=cutoff)kept.push(...triangle);
      }
      const copy=original.clone();copy.setIndex(kept);
      m.geometry=copy.toNonIndexed();copy.dispose();
      m.geometry.userData.organOwned=true;
      m.geometry.computeBoundingBox();m.geometry.computeBoundingSphere();
    });
  }
  const fit = (x: number | null, y: number | null, z: number | null) => {
    const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
    model.scale.multiply(new THREE.Vector3(x === null ? 1 : x / Math.max(size.x, .0001), y === null ? 1 : y / Math.max(size.y, .0001), z === null ? 1 : z / Math.max(size.z, .0001)));
    model.updateMatrixWorld(true);
  };
  if (id === 'seal') {
    const rim = anatomy?.family === 'chair' ? anatomy.seat : anatomy?.crown;
    fit(anatomy?.family==='umbrella'?anatomy.waist.width*.25:(rim?.width ?? width)*1.035, .045, anatomy?.family==='umbrella'?anatomy.waist.depth*.25:(rim?.depth ?? width)*1.035);
  } else if (slot === 'feet') {
    const foot = anatomy?.foot;
    const footprintX = anatomy?.family === 'umbrella' ? .35 : bounded((foot?.width ?? width) * 1.04, .30, .76);
    const footprintZ = anatomy?.family === 'umbrella' ? .32 : bounded((foot?.depth ?? width) * 1.04, .28, .72);
    if (id === 'wheels' || id === 'legs') fit(footprintX, id === 'legs' ? .25 : null, footprintZ);
    if (id === 'suction') fit(footprintX * .85, .14, footprintZ * .85);
    if (id === 'spring') fit(Math.min(footprintX, .31), .22, Math.min(footprintZ, .31));
  } else if (slot === 'skin') {
    const profile = anatomy?.family === 'chair' ? anatomy.seat : anatomy?.waist;
    const w = profile?.width ?? width, d = profile?.depth ?? width;
    fit(w * 1.15, id === 'shell' ? bodyHeight * .94 : id === 'feathers' ? .14 : id === 'gimbal' ? .075 : .20, d * 1.15);
  }
  const finalBox = new THREE.Box3().setFromObject(model);
  const size = finalBox.getSize(new THREE.Vector3());
  const centered = new THREE.Group();
  centered.add(model);
  model.position.sub(finalBox.getCenter(new THREE.Vector3()));
  centered.updateMatrixWorld(true);
  return { scene: centered, size };
}

export interface PartShape { id: OrganId; size: THREE.Vector3 }
export interface Placement {
  id: OrganId;
  position: V3;
  joint: V3;
  offset: V3;
  rotation: V3;
  normal: V3;
  mode: 'side' | 'top' | 'bottom' | 'wrap';
  bounds: THREE.Box3;
  radius: number;
}
export function placementQuaternion(p: Pick<Placement, 'rotation'>) {
  return new THREE.Quaternion().setFromEuler(new THREE.Euler(...p.rotation, 'YXZ'));
}
/** A rear bounding plane can contain empty space between a panel's two feet. Find solid hardware. */
export function organContactFrame(scene:THREE.Object3D,offset:V3,radius:number){
  const local=scene.clone(true);local.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(local);
  const ray=new THREE.Raycaster();
  for(const [x,y] of [[0,0],[radius,0],[-radius,0],[0,-radius],[0,radius]]){
    ray.set(new THREE.Vector3(x,y,box.min.z-.1),new THREE.Vector3(0,0,1));
    const hit=ray.intersectObject(local,true)[0];
    if(hit)return {
      point:hit.point.clone().add(new THREE.Vector3(...offset)),
      normal:(hit.face?.normal.clone().applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld))??new THREE.Vector3(0,0,-1)).normalize()
    };
  }
  return {point:new THREE.Vector3(...offset),normal:new THREE.Vector3(0,0,-1)};
}
export function organContactPoint(scene:THREE.Object3D,offset:V3,radius:number){
  return organContactFrame(scene,offset,radius).point;
}
function boxFor(center: THREE.Vector3, size: THREE.Vector3, rotation: V3) {
  const box = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(), size);
  const matrix = new THREE.Matrix4().compose(center, placementQuaternion({ rotation }), new THREE.Vector3(1, 1, 1));
  return box.applyMatrix4(matrix);
}
function overlap(a: THREE.Box3, b: THREE.Box3) {
  const intersection = a.clone().intersect(b);
  if (intersection.isEmpty()) return 0;
  const size = intersection.getSize(new THREE.Vector3());
  return size.x * size.y * size.z;
}

function sideSurface(anatomy: Anatomy, y: number, angle: number) {
  const radial = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
  const center = anatomy.family === 'cup' || anatomy.family === 'bin' ? anatomy.crown.center : anatomy.waist.center;
  const radius = Math.max(anatomy.dims.x, anatomy.dims.z, 1) * 2;
  const ray = new THREE.Raycaster();
  for (const delta of [0, .025, -.025, .05, -.05]) {
    const origin = new THREE.Vector3(center.x, y + delta * anatomy.dims.y, center.z).addScaledVector(radial, radius);
    ray.set(origin, radial.clone().negate());
    const hit = ray.intersectObject(anatomy.local, true)[0];
    if (!hit) continue;
    const normal = hit.face?.normal.clone().applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld)) ?? radial.clone();
    if (normal.dot(radial) < 0) normal.negate();
    return { point: hit.point.clone(), normal: normal.normalize() };
  }
  return null;
}

export function attachmentLayout(base: THREE.Object3D, family: FamilyId, shapes: PartShape[], measured?: Anatomy) {
  const anatomy = measured ?? measureAnatomy(base, family);
  const { dims } = anatomy;
  const h = dims.y;
  const feet = shapes.filter(p => mountSlot(p.id) === 'feet');
  const lift = Math.max(0, ...feet.map(p => Math.max(0, p.size.y - Math.min(.05,p.size.y*.23))));
  const counts = new Map<string, number>();
  const parts: Placement[] = [];
  const cap = shapes.find(p => p.id === 'seal');
  const make = (shape: PartShape, mode: Placement['mode'], joint: THREE.Vector3, offset: THREE.Vector3, rotation: V3, normal: THREE.Vector3): Placement => {
    const center = offset.clone().applyQuaternion(placementQuaternion({ rotation })).add(joint);
    return { id: shape.id, mode, position: center.toArray() as V3, joint: joint.toArray() as V3, offset: offset.toArray() as V3,
      rotation, normal: normal.toArray() as V3, bounds: boxFor(center, shape.size, rotation), radius: bounded(Math.min(shape.size.x, shape.size.y) * .17, .016, .035) };
  };
  const priority = (p: PartShape) => mountSlot(p.id) === 'feet' ? 0 : p.id === 'seal' ? 1 : mountSlot(p.id) === 'crown' ? 2 : mountSlot(p.id) === 'skin' ? 3 : 4;
  for (const shape of shapes.slice().sort((a, b) => priority(a) - priority(b))) {
    const { id, size } = shape;
    const slot = mountSlot(id);
    const n = counts.get(slot) ?? 0;
    counts.set(slot, n + 1);
    if (slot === 'feet') {
      const x = anatomy.foot.center.x + (feet.length > 1 ? (n - (feet.length - 1) / 2) * .25 : 0);
      const joint = new THREE.Vector3(x, lift, anatomy.foot.center.z);
      parts.push(make(shape, 'bottom', joint, new THREE.Vector3(0, size.y / 2 - lift, 0), [0, 0, 0], new THREE.Vector3(0, -1, 0)));
    } else if (slot === 'crown') {
      const surface = family === 'chair' && id === 'seal' ? anatomy.seat : anatomy.crown;
      const capLift = cap && id !== 'seal' && family !== 'chair' ? cap.size.y - .012 : 0;
      const crownIndex = n - (cap && id !== 'seal' ? 1 : 0);
      const crownCount = shapes.filter(p => mountSlot(p.id) === 'crown' && p.id !== 'seal').length;
      const spread = crownCount > 1 && id !== 'seal' ? Math.max(0, Math.min(surface.width * .23, .18)) : 0;
      const angle = crownIndex * Math.PI * 2 / Math.max(1, crownCount);
      const joint = new THREE.Vector3(surface.center.x + Math.cos(angle) * spread, surface.y + lift + capLift, surface.center.z + Math.sin(angle) * spread);
      if((family==='cup'||family==='bin')&&id!=='seal'&&!cap){
        const rimAngle=2.18+crownIndex*Math.PI*2/Math.max(1,crownCount);
        joint.x=surface.center.x+Math.cos(rimAngle)*surface.width*.48;
        joint.z=surface.center.z+Math.sin(rimAngle)*surface.depth*.48;
      }
      parts.push(make(shape, 'top', joint, new THREE.Vector3(0, size.y / 2 - Math.min(.012, size.y * .18), 0), [0, 0, 0], new THREE.Vector3(0, 1, 0)));
    } else if (slot === 'skin') {
      const profile = family === 'chair' ? anatomy.seat : anatomy.waist;
      const y = id === 'shell' ? h * .5 : id === 'mycelium' ? .04 : id === 'feathers' ? (family === 'chair' ? anatomy.seat.y - .07 : family==='umbrella'?anatomy.waist.y:h*.24) : h * .53;
      const joint = new THREE.Vector3(profile.center.x, y + lift, profile.center.z);
      parts.push(make(shape, 'wrap', joint, new THREE.Vector3(), [0, 0, 0], new THREE.Vector3(0, 1, 0)));
    } else {
      const defaults = id === 'eye' ? { angle: -.40, y: family === 'chair' ? .74 : .67 }
        : id === 'solar' ? { angle: .48, y: family === 'chair' ? .80 : .76 }
        : id === 'jet' ? { angle: .60, y: family === 'chair' ? anatomy.seat.y / h - .03 : .39 }
        : { angle: (slot === 'left' ? -.65 : .65) + n * .65, y: family === 'chair' ? .47 : .53 };
      let best: Placement | null = null;
      let score = Infinity;
      for (const dy of [0, .10, -.10, .19, -.19]) for (const da of [0, -.32, .32, -.68, .68, -1.0, 1.0]) {
        const hit = sideSurface(anatomy, bounded(defaults.y + dy, .16, .86) * (family==='bin'?anatomy.crown.y:h), defaults.angle + da);
        if (!hit) continue;
        const yaw = Math.atan2(hit.normal.x, hit.normal.z);
        const pitch = -Math.asin(bounded(hit.normal.y, -.65, .65));
        const joint = hit.point.clone(); joint.y += lift;
        const candidate = make(shape, 'side', joint, new THREE.Vector3(0, 0, size.z / 2 - Math.min(.025,size.z*.40)), [pitch, yaw, 0], hit.normal);
        const padded = candidate.bounds.clone().expandByScalar(.014);
        let collision = 0;
        for (const other of parts) if (other.id !== 'mycelium' && other.id !== 'shell') collision += overlap(padded, other.bounds);
        const candidateScore = collision * 10000 + Math.abs(dy) * .30 + Math.abs(da) * .035;
        if (candidateScore < score) { best = candidate; score = candidateScore; }
      }
      if (best) parts.push(best);
      else {
        const joint = anatomy.waist.center.clone(); joint.y += lift;
        parts.push(make(shape, 'side', joint, new THREE.Vector3(0, 0, size.z / 2), [0, 0, 0], new THREE.Vector3(0, 0, 1)));
      }
    }
  }
  return { lift, parts, dims, anatomy };
}
