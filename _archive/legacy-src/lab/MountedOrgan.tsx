import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrganId } from '../engine/organs';
import { placementQuaternion, organContactFrame, type Anatomy, type Placement } from './attachment';
import { createSideGraft, createTopGraft, createRimGraft, createFootGraft } from './graftGeometry';
import { sampleGraftAppearance, prepareGraftedOrgan, disposeGraftedOrgan } from './graftMaterial';

/** A conformal growth seam replaces generic mounting hardware. The visible organ details stay intact. */
export function MountedOrgan({ scene, id, placement, anatomy, lift = 0 }: {
  scene: THREE.Object3D; id: OrganId; placement: Placement; anatomy: Anatomy; lift?: number;
}) {
  const growing = useRef<THREE.Group>(null);
  const aim = useRef<THREE.Group>(null);
  const progress = useRef(0);
  const quaternion = useMemo(() => placementQuaternion(placement), [placement]);
  const graft = useMemo(() => {
    if (placement.mode === 'wrap') return null;
    const size = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
    const appearance = sampleGraftAppearance(anatomy, placement, lift);
    let contact: THREE.Vector3;
    let geometry: THREE.BufferGeometry;
    if (placement.mode === 'side') {
      const frame=organContactFrame(scene, placement.offset, placement.radius);
      contact = frame.point.clone();
      contact.z = id==='solar'?contact.z-.001:Math.max(.014,contact.z+.012);
      geometry = createSideGraft(anatomy, placement, contact, THREE.MathUtils.clamp(Math.min(size.x, size.y) * .23, .018, .05), lift,id==='solar'?frame:undefined);
    } else if (placement.mode === 'bottom') {
      contact = new THREE.Vector3(0, .018, 0);
      geometry = createFootGraft(anatomy, size);
    } else if (id === 'seal') {
      contact = new THREE.Vector3(0, .008, 0);
      geometry = createRimGraft(anatomy, size.y);
    } else {
      contact = new THREE.Vector3(0, .022, 0);
      geometry = createTopGraft(anatomy, placement, contact, Math.min(.022, Math.min(size.x, size.z) * .09), lift);
    }
    const organ = prepareGraftedOrgan(scene, placement, contact, appearance);
    const textured=geometry.userData.bodyUv&&appearance.map;
    const material = new THREE.MeshStandardMaterial({
      color:textured?(appearance.baseColor??appearance.color):appearance.color,
      map:textured?appearance.map:null,roughnessMap:textured?appearance.roughnessMap:null,metalnessMap:textured?appearance.metalnessMap:null,
      roughness:textured?(appearance.rawRoughness??appearance.roughness):appearance.roughness,
      metalness:textured?(appearance.rawMetalness??appearance.metalness):appearance.metalness,
      envMapIntensity: appearance.envMapIntensity
    });
    return { geometry, material, organ };
  }, [scene, id, placement, anatomy, lift]);
  useEffect(() => () => {
    if (graft) { graft.geometry.dispose(); graft.material.dispose(); disposeGraftedOrgan(graft.organ); }
  }, [graft]);
  useFrame((state, dt) => {
    progress.current = Math.min(1, progress.current + dt * 1.8);
    if (growing.current) growing.current.scale.setScalar(Math.max(.001, 1 - Math.pow(1 - progress.current, 3)));
    if (aim.current && id === 'eye') aim.current.rotation.y = Math.sin(state.clock.elapsedTime * .9) * .025;
  });
  return <group position={placement.joint} quaternion={quaternion}>
    <group ref={growing}>
      {graft && <mesh geometry={graft.geometry} material={graft.material} castShadow receiveShadow />}
      <group ref={aim}><group position={placement.offset}><primitive object={graft?.organ ?? scene} /></group></group>
    </group>
  </group>;
}
