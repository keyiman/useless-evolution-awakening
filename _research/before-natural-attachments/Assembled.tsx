import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ORGAN_MAP, type OrganId } from '../engine/organs';
import type { FamilyId } from '../engine/types';
import { normalizeModel, organModel, attachmentLayout } from './attachment';

function prepare(scene: THREE.Object3D) {
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      const std = mat as THREE.MeshStandardMaterial;
      if ('envMapIntensity' in std) std.envMapIntensity = 1.25;
      std.needsUpdate = true;
    }
  });
}

export function Assembled({
  family,
  organs,
  baseUrl,
  organUrls,
  secondUrl,
  secondFamily,
  test,
}: {
  family: FamilyId;
  organs: OrganId[];
  baseUrl: string;
  organUrls: Record<string, string>;
  secondUrl?: string | null;
  secondFamily?: FamilyId | null;
  test?: { kind: string; run?: number } | null;
}) {
  const baseGltf = useGLTF(baseUrl);
  const secondGltf = useGLTF(secondUrl ?? baseUrl);
  const active = useMemo(
    () =>
      organs
        .map((id) => ({ id, url: organUrls[id] }))
        .filter((o): o is { id: OrganId; url: string } => !!o.url),
    [organs, organUrls],
  );
  const urls = useMemo(() => (active.length ? active.map((a) => a.url) : [baseUrl]), [active, baseUrl]);
  const organGltfs = useGLTF(urls);
  const group = useRef<THREE.Group>(null);
  const start = useRef(-1);

  const base = useMemo(() => {
    const scene = normalizeModel(baseGltf.scene, .98, 1.2);
    prepare(scene);
    return scene;
  }, [baseGltf]);
  const models = useMemo(() => {
    const width = new THREE.Box3().setFromObject(base).getSize(new THREE.Vector3()).x;
    return active.map((entry, i) => {
      const model = organModel(organGltfs[i].scene, entry.id, width);
      prepare(model.scene);
      return { id: entry.id, ...model };
    });
  }, [active, organGltfs, base]);
  const layout = useMemo(() => attachmentLayout(base, family, models), [base, family, models]);
  const lift = layout.lift;
  const parts = useMemo(() => models.map(m => ({ id: m.id, scene: m.scene, position: layout.parts.find(p => p.id === m.id)!.position })), [models, layout]);
  const second = useMemo(() => {
    if (!secondUrl || !secondFamily) return null;
    const scene = normalizeModel(secondGltf.scene, .58, .6);
    prepare(scene);
    scene.position.set(layout.dims.x*.35, .18, -.12);
    return scene;
  }, [secondGltf, secondUrl, secondFamily, layout.dims.x]);

  useFrame((state) => {
    if (!group.current) return;
    if (start.current < 0) start.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - start.current;
    const g = group.current;
    g.position.set(0, 0, 0);
    g.rotation.set(0, 0, 0);
    if (!test) return;
    if (test.kind === 'sealed') {
      g.rotation.z = -Math.min(0.85, t * 0.9);
    } else if (test.kind === 'stable') {
      // 稳定环把每一次倾倒都拉回来：只允许很小的摆动
      g.rotation.z = Math.sin(t * 3.2) * 0.045;
    } else if (test.kind === 'autonomous') {
      const p = Math.min(1, t * 0.35);
      g.position.x = p * 1.1;
      g.rotation.y = -p * 0.4;
    } else if (test.kind === 'caged') {
      g.rotation.y = Math.sin(t * 0.6) * 0.2;
    } else if (test.kind === 'collect') {
      g.rotation.z = Math.sin(t * 0.8) * 0.06;
    } else if (test.kind === 'parasite') {
      g.position.x = Math.sin(t * 24) * 0.008;
      g.rotation.z = Math.sin(t * 19) * 0.012;
    } else if (test.kind === 'fusion') {
      g.rotation.y = Math.sin(t * 0.5) * 0.35;
    } else if (test.kind === 'handle') {
      g.rotation.z = Math.sin(t * 2.2) * 0.09;
    } else if (test.kind === 'float') {
      g.position.y = Math.min(0.5, t * 0.18) + Math.sin(t * 1.6) * 0.03;
      g.rotation.y = Math.sin(t * 0.5) * 0.12;
    } else if (test.kind === 'thrust') {
      g.position.x = Math.sin(t * 1.7) * 0.5;
      g.rotation.z = Math.sin(t * 1.7) * 0.2;
    } else if (test.kind === 'burrow') {
      g.position.y = -Math.min(0.55, t * 0.16);
    } else if (test.kind === 'anchor') {
      g.position.x = Math.sin(t * 28) * 0.006;
      g.rotation.z = Math.sin(t * 24) * 0.008;
    } else if (test.kind === 'bounce') {
      g.position.y = Math.abs(Math.sin(t * 3.2)) * 0.3;
    } else if (test.kind === 'spin') {
      g.rotation.y = t * 2.2;
    } else if (test.kind === 'fold') {
      g.rotation.z = Math.min(0.7, t * 0.5);
    } else {
      g.rotation.z = Math.sin(t * 1.5) * 0.04;
    }
  });

  useEffect(() => {
    start.current = -1;
  }, [test?.kind, test?.run]);

  return (
    <group ref={group}>
      <group position={[0, lift, 0]}>
        <primitive object={base} />
        {second && <primitive object={second} />}
      </group>
      {parts.map((p) => (
        <group key={p.id} position={p.position}>
          <primitive object={p.scene} />
        </group>
      ))}
    </group>
  );
}
