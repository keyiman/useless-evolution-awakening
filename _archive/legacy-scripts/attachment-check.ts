import assert from 'node:assert/strict';
import * as THREE from 'three';
import { normalizeModel, attachmentLayout } from '../src/lab/attachment';
const raw = new THREE.Group();
const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2));
mesh.position.set(7, 9, -3); raw.add(mesh); raw.position.set(12, -4, 8); raw.scale.setScalar(2);
const base = normalizeModel(raw, .98, 1.2);
const box = new THREE.Box3().setFromObject(base);
assert.ok(Math.abs(box.min.y) < 1e-6, 'grounded despite source transforms');
assert.ok(Math.abs(box.getCenter(new THREE.Vector3()).x) < 1e-6);
assert.ok(Math.abs(box.getCenter(new THREE.Vector3()).z) < 1e-6);
assert.ok(Math.abs(box.getSize(new THREE.Vector3()).y - .98) < 1e-6);
assert.equal(raw.position.x, 12, 'cached source is not mutated');
for (const family of ['cup','chair','umbrella','bin'] as const) {
 const layout = attachmentLayout(base, family, [
 { id: 'legs', size: new THREE.Vector3(.5,.3,.4) },
 { id: 'eye', size: new THREE.Vector3(.2,.2,.2) },
 { id: 'balloon', size: new THREE.Vector3(.3,.4,.3) },
 ]);
 assert.ok(Math.abs(layout.lift - .25) < 1e-6);
 const feet = layout.parts.find(p => p.id === 'legs')!;
 assert.ok(Math.abs(feet.position[1] - .15) < 1e-6, 'feet touch floor');
 for (const p of layout.parts) assert.ok(p.position.every(Number.isFinite));
 const top = layout.parts.find(p => p.id === 'balloon')!;
 assert.ok(top.position[1] > .98, 'crown above body');
}
console.log('Attachment checks passed: transformed source, grounding, four families, contact planes.');
