import * as THREE from 'three';
import { placementQuaternion, type Anatomy, type Placement } from './attachment';

const SEGMENTS = 32;
const RINGS = 10;

function loft(point: (t: number, angle: number) => THREE.Vector3, reverse = false, bodyUv?: (angle:number)=>THREE.Vector2) {
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  for (let ring = 0; ring <= RINGS; ring++) for (let j = 0; j <= SEGMENTS; j++) {
    const p = point(ring / RINGS, j / SEGMENTS * Math.PI * 2);
    positions.push(p.x, p.y, p.z);
    const uv=bodyUv?.(j/SEGMENTS*Math.PI*2);uvs.push(uv?.x??j/SEGMENTS,uv?.y??ring/RINGS);
  }
  for (let ring = 0; ring < RINGS; ring++) for (let j = 0; j < SEGMENTS; j++) {
    const a = ring * (SEGMENTS + 1) + j, b = a + 1, c = a + SEGMENTS + 1, d = c + 1;
    if (reverse) indices.push(a, c, b, b, c, d);
    else indices.push(a, b, c, b, d, c);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const normals = geometry.getAttribute('normal');
  for (let ring = 0; ring <= RINGS; ring++) {
    const a = ring * (SEGMENTS + 1), b = a + SEGMENTS;
    const n = new THREE.Vector3().fromBufferAttribute(normals, a).add(new THREE.Vector3().fromBufferAttribute(normals, b)).normalize();
    normals.setXYZ(a, n.x, n.y, n.z); normals.setXYZ(b, n.x, n.y, n.z);
  }
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  geometry.userData.bodyUv=!!bodyUv;
  return geometry;
}

function resolvedUvs(uvs:(THREE.Vector2|null)[]){
  const first=uvs.find(p=>p!==null)??new THREE.Vector2(.5,.5);
  return (a:number)=>uvs[Math.round(a/(Math.PI*2)*SEGMENTS)]??first;
}
function perimeterUvs(anatomy:Anatomy,center:THREE.Vector3,y:number){
  const ray=new THREE.Raycaster();const uvs:(THREE.Vector2|null)[]=[];
  for(let j=0;j<=SEGMENTS;j++){
    const a=j/SEGMENTS*Math.PI*2,normal=new THREE.Vector3(Math.cos(a),0,Math.sin(a));
    ray.set(new THREE.Vector3(center.x,y,center.z).addScaledVector(normal,2),normal.clone().negate());
    uvs.push(ray.intersectObject(anatomy.local,true)[0]?.uv?.clone()??null);
  }
  return resolvedUvs(uvs);
}

/** Rounded fillet with its broad root projected onto the actual specimen, including its curvature. */
function axialGraft(anatomy: Anatomy, p: Placement, end: THREE.Vector3, endRadius: number, lift: number, axis: 'y' | 'z', clipPlane?:{point:THREE.Vector3;normal:THREE.Vector3}) {
  const q = placementQuaternion(p), inverse = q.clone().invert();
  const joint = new THREE.Vector3(...p.joint); joint.y -= lift;
  const normal = new THREE.Vector3(0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0).applyQuaternion(q);
  const rootRadius = endRadius * (axis === 'z' ? 1.7 : 1.35);
  const ray = new THREE.Raycaster();
  const roots: THREE.Vector3[] = [];
  const uvs:(THREE.Vector2|null)[]=[];
  for (let j = 0; j <= SEGMENTS; j++) {
    const a = j / SEGMENTS * Math.PI * 2;
    const local = axis === 'z' ? new THREE.Vector3(Math.cos(a) * rootRadius, Math.sin(a) * rootRadius, 0)
      : new THREE.Vector3(Math.cos(a) * rootRadius, 0, Math.sin(a) * rootRadius);
    const origin = local.clone().applyQuaternion(q).add(joint).addScaledVector(normal, .22);
    ray.set(origin, normal.clone().negate());
    const hit = ray.intersectObject(anatomy.local, true)[0];
    if (hit) {
      const surface = hit.point.clone().sub(joint).applyQuaternion(inverse);
      const depth = axis === 'z' ? surface.z : surface.y;
      if (Math.abs(depth) < Math.max(.065, rootRadius * 2)) {
        if (axis === 'z') local.z = depth - .003;
        else local.y = depth - .003;
      } else if (axis === 'z') local.z = -.003;
      else local.y = -.003;
    }
    roots.push(local);
    uvs.push(hit?.uv?.clone()??null);
  }
  return loft((t, angle) => {
    const j = Math.round(angle / (Math.PI * 2) * SEGMENTS);
    const root = roots[j];
    // Quarter-circle profile: tangent to the body at its root, tangent to the organ at its neck.
    const radial = endRadius + (rootRadius - endRadius) * (1 - Math.sin(t * Math.PI / 2));
    const z = 1 - Math.cos(t * Math.PI / 2), smooth = t * t * (3 - 2 * t);
    if (axis === 'z') {
      const point=new THREE.Vector3(Math.cos(angle) * radial + end.x * smooth, Math.sin(angle) * radial + end.y * smooth, THREE.MathUtils.lerp(root.z, end.z, z));
      if(clipPlane&&Math.abs(clipPlane.normal.z)>.15){
        const limit=clipPlane.point.z-(clipPlane.normal.x*(point.x-clipPlane.point.x)+clipPlane.normal.y*(point.y-clipPlane.point.y))/clipPlane.normal.z;
        point.z=Math.min(point.z,limit-.001);
      }
      return point;
    }
    return new THREE.Vector3(Math.cos(angle) * radial + end.x * smooth, THREE.MathUtils.lerp(root.y, end.y, z), Math.sin(angle) * radial + end.z * smooth);
  }, axis === 'y',resolvedUvs(uvs));
}

export function createSideGraft(anatomy: Anatomy, p: Placement, end: THREE.Vector3, radius: number, lift: number, clipPlane?:{point:THREE.Vector3;normal:THREE.Vector3}) {
  return axialGraft(anatomy, p, end, radius, lift, 'z',clipPlane);
}
export function createTopGraft(anatomy: Anatomy, p: Placement, end: THREE.Vector3, radius: number, lift: number) {
  return axialGraft(anatomy, p, end, radius, lift, 'y');
}

export function createRimGraft(anatomy: Anatomy, capHeight: number) {
  const rim = anatomy.family === 'chair' ? anatomy.seat : anatomy.crown;
  return loft((t, a) => {
    const radial = 1 - Math.cos(t * Math.PI / 2);
    const factor = THREE.MathUtils.lerp(.995, 1.034, radial);
    return new THREE.Vector3(Math.cos(a) * rim.width * .5 * factor, -.024 + (.024 + capHeight * .33) * Math.sin(t * Math.PI / 2), Math.sin(a) * rim.depth * .5 * factor);
  }, true,perimeterUvs(anatomy,rim.center,rim.y-.024));
}

export function createFootGraft(anatomy: Anatomy, size: THREE.Vector3) {
  const foot = anatomy.foot;
  return loft((t, a) => {
    const f = 1 - Math.cos(t * Math.PI / 2);
    const xRadius = THREE.MathUtils.lerp(foot.width * .485, Math.min(foot.width * .475, size.x * .44), f);
    const zRadius = THREE.MathUtils.lerp(foot.depth * .485, Math.min(foot.depth * .475, size.z * .44), f);
    const exponent = anatomy.family === 'chair' ? .42 : 1;
    const x = Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), exponent);
    const z = Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), exponent);
    return new THREE.Vector3(x * xRadius, .022 - .036 * Math.sin(t * Math.PI / 2), z * zRadius);
  },false,perimeterUvs(anatomy,foot.center,anatomy.bounds.min.y+.022));
}
