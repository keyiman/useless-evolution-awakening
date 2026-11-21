import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrganId } from '../engine/organs';
import { placementQuaternion, organContactPoint, type Anatomy, type Placement } from './attachment';

/** The socket stays on the specimen. Only the organ grows and articulates around that socket. */
export function MountedOrgan({ scene, id, placement, anatomy }: {
  scene: THREE.Object3D; id: OrganId; placement: Placement; anatomy: Anatomy;
}) {
  const growing = useRef<THREE.Group>(null);
  const aim = useRef<THREE.Group>(null);
  const progress = useRef(0);
  const quaternion = useMemo(() => placementQuaternion(placement), [placement]);
  const r = placement.radius;
  const connector=useMemo(()=>{
    if(placement.mode!=='side')return null;
    const start=new THREE.Vector3(0,0,.005);
    const end=organContactPoint(scene,placement.offset,placement.radius);
    const delta=end.clone().sub(start);const length=delta.length();
    if(length<.012)return null;
    return {position:start.add(end).multiplyScalar(.5),length,quaternion:new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize())};
  },[scene,placement]);
  useFrame((state, dt) => {
    progress.current = Math.min(1, progress.current + dt * 1.8);
    if (growing.current) growing.current.scale.setScalar(Math.max(.001, 1 - Math.pow(1 - progress.current, 3)));
    if (aim.current) {
      if (id === 'eye') aim.current.rotation.y = Math.sin(state.clock.elapsedTime * .9) * .075;
      if (id === 'solar') aim.current.rotation.x = Math.sin(state.clock.elapsedTime * .6) * .025;
    }
  });
  const bridge = placement.mode === 'top' && id !== 'seal' && (anatomy.family === 'cup' || anatomy.family === 'bin');
  return <group position={placement.joint} quaternion={quaternion}>
    {placement.mode === 'side' && <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh><cylinderGeometry args={[r * 1.1, r * 1.25, .018, 20]} /><meshStandardMaterial color="#89948b" metalness={.55} roughness={.5} /></mesh>
      <mesh position={[0, .010, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[r, .004, 5, 20]} /><meshStandardMaterial color="#48524b" roughness={.85} /></mesh>
    </group>}
    {connector&&<mesh position={connector.position} quaternion={connector.quaternion}>
      <cylinderGeometry args={[r*.52,r*.72,connector.length,12]}/><meshStandardMaterial color="#899b87" metalness={.35} roughness={.6}/>
    </mesh>}
    {placement.mode === 'bottom' && <group>
      {anatomy.family === 'chair' ? <mesh position={[0, .004, 0]}>
        <boxGeometry args={[anatomy.foot.width * .98, .022, anatomy.foot.depth * .98]} />
        <meshStandardMaterial color="#858e82" roughness={.6} metalness={.35} />
      </mesh> : <mesh position={[0, .002, 0]}>
        <cylinderGeometry args={[Math.min(anatomy.foot.width, anatomy.foot.depth) * .43, Math.min(anatomy.foot.width, anatomy.foot.depth) * .46, .022, 32]} />
        <meshStandardMaterial color="#636f65" roughness={.72} metalness={.25} />
      </mesh>}
    </group>}
    {bridge && <group>
      <mesh position={[0, -.006, 0]}><boxGeometry args={[.035, .018, anatomy.crown.depth * .96]} /><meshStandardMaterial color="#9fa99a" roughness={.55} metalness={.4} /></mesh>
      <mesh><cylinderGeometry args={[.025, .032, .025, 16]} /><meshStandardMaterial color="#7c897c" roughness={.65} metalness={.3} /></mesh>
    </group>}
    <group ref={growing}><group ref={aim}><group position={placement.offset}><primitive object={scene} /></group></group></group>
  </group>;
}
