import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ORGAN_MAP, type OrganId } from '../engine/organs';
import type { FamilyId } from '../engine/types';

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
  test?: { kind: string } | null;
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
    const scene = baseGltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = 0.98 / Math.max(0.0001, size.y);
    scene.scale.setScalar(s);
    scene.position.set(-center.x * s, -box.min.y * s, -center.z * s);
    prepare(scene);
    if (import.meta.env.DEV) console.log('[base]', family, 'size', size.toArray().map((n) => n.toFixed(2)).join(','), 'scale', s.toFixed(2));
    return scene;
  }, [baseGltf, family]);

  const baseDims = useMemo(() => {
    const box = new THREE.Box3().setFromObject(baseGltf.scene);
    const size = box.getSize(new THREE.Vector3());
    const s = 0.98 / Math.max(0.0001, size.y);
    return {
      width: size.x * s,
      depth: size.z * s,
      halfX: (size.x * s) / 2,
      halfZ: (size.z * s) / 2,
      bodyX: Math.min(Math.abs(box.min.x * s), Math.abs(box.max.x * s)),
      bodyZ: Math.min(Math.abs(box.min.z * s), Math.abs(box.max.z * s)),
    };
  }, [baseGltf]);

  const BOTTOM_LIFT: Record<string, number> = { wheels: 0.34, suction: 0.59, drill: 0.39, legs: 0.67, spring: 0.3, mycelium: 0.18 };
  const lift = useMemo(() => {
    const max = Math.max(0, ...organs.map((id) => BOTTOM_LIFT[id] ?? 0));
    return max * (baseDims.width / 1.13);
  }, [organs, baseDims]);

  const second = useMemo(() => {
    if (!secondUrl || !secondFamily) return null;
    const scene = secondGltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = 0.62 / Math.max(0.0001, size.y);
    scene.scale.setScalar(s);
    scene.position.set(-center.x * s, -box.min.y * s, -center.z * s);
    prepare(scene);
    const holder = new THREE.Group();
    holder.add(scene);
    holder.position.set(0.3, 0, 0.04);
    holder.rotation.y = -0.5;
    return holder;
  }, [secondGltf, secondUrl, secondFamily]);

  const parts = useMemo(() => {
    const seen = new Map<string, number>();
    return active
      .map((entry, i) => {
        const id = entry.id;
        const def = ORGAN_MAP[id];
        const gltf = organGltfs[i];
        if (!def || !gltf) return null;
        const slot = seen.get(def.anchor) ?? 0;
        seen.set(def.anchor, slot + 1);
        const holder = new THREE.Group();
        holder.add(gltf.scene.clone(true));
        holder.rotation.set(...def.rot);
        holder.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(holder);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const axis = def.fit === 'height' ? size.y : size.x;
        const target = def.fit === 'height' ? def.size * 0.98 : def.size * baseDims.width;
        const s = target / Math.max(0.0001, axis);
        holder.scale.setScalar(s);
        holder.position.set(-center.x * s, -center.y * s, -center.z * s);
        prepare(holder);

        const w = size.x * s;
        const h = size.y * s;
        let [x, y, z] = def.pos;
        y *= 0.98;
        if (def.anchor === 'side') {
          x = Math.sign(x || 1) * (baseDims.bodyX + w * 0.45);
        } else if (def.anchor === 'top') {
          y = 0.98 + h / 2 - 0.05;
        } else if (def.anchor === 'bottom') {
          y = h / 2;
        } else {
          y = Math.max(0.49, h / 2);
        }
        if (def.anchor !== 'bottom') y += lift;
        // 同锚点器官沿高度错开，避免多个顶置/侧置器官完全重叠
        if (def.anchor === 'top') y += slot * 0.16;
        else if (def.anchor === 'side') y += slot * 0.18;
        else if (def.anchor === 'bottom') y -= slot * 0.06;
        else y += slot * 0.04;
        if (import.meta.env.DEV) {
          const probe = new THREE.Group();
          probe.position.set(x, y, z);
          probe.add(holder.clone(true));
          probe.updateMatrixWorld(true);
          const wb = new THREE.Box3().setFromObject(probe);
          console.log(
            '[bbox]',
            id,
            'x',
            wb.min.x.toFixed(2),
            wb.max.x.toFixed(2),
            'y',
            wb.min.y.toFixed(2),
            wb.max.y.toFixed(2),
            'z',
            wb.min.z.toFixed(2),
            wb.max.z.toFixed(2),
          );
        }
        return { id, scene: holder, position: [x, y, z] as [number, number, number] };
      })
      .filter(Boolean) as { id: OrganId; scene: THREE.Object3D; position: [number, number, number] }[];
  }, [active, organGltfs, baseDims, lift]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    for (const p of parts) {
      console.log('[organ]', p.id, 'pos', p.position.map((n) => n.toFixed(2)).join(','));
    }
  }, [parts]);

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
  }, [test?.kind]);

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
