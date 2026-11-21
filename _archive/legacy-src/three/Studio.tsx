import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Genes } from '../engine/types';
import type { TestResult } from '../engine/uselessTest';
import { ProceduralModel } from './Procedural';
import { MAT } from './materials';

class GLBBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function GltfModel({ url, sink = 0 }: { url: string; sink?: number }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  const box = useMemo(() => new THREE.Box3().setFromObject(cloned), [cloned]);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.z, size.y);
  const scale = Math.min(0.98 / Math.max(0.0001, size.y), 1.35 / Math.max(0.0001, maxDim));
  const group = useRef<THREE.Group>(null);
  const reveal = useRef(0);
  useEffect(() => {
    reveal.current = 0;
  }, [url]);
  useFrame((_, dt) => {
    if (!group.current) return;
    reveal.current = Math.min(1, reveal.current + dt * 2.6);
    const e = 1 - Math.pow(1 - reveal.current, 3);
    group.current.scale.setScalar(scale * (0.93 + 0.07 * e));
    group.current.position.y = (1 - e) * 0.035;
  });
  useEffect(() => {
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        const std = mat as THREE.MeshStandardMaterial;
        if ('envMapIntensity' in std) std.envMapIntensity = 1.3;
        std.needsUpdate = true;
      }
    });
  }, [cloned]);
  return (
    <group ref={group}>
      <primitive object={cloned} position={[-center.x, -box.min.y - sink, -center.z]} />
    </group>
  );
}

/** 程序化室内环境贴图，让 GLB 的金属/釉面有真实反射，且不依赖外网 HDR。 */
function StudioEnvironment() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const rt = pmrem.fromScene(room, 0.04);
    scene.environment = rt.texture;
    return () => {
      scene.environment = null;
      rt.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

function Floor() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const g = c.getContext('2d');
    if (g) {
      const grd = g.createRadialGradient(256, 256, 24, 256, 256, 256);
      grd.addColorStop(0, '#242b34');
      grd.addColorStop(0.5, '#161b22');
      grd.addColorStop(1, '#0b0e13');
      g.fillStyle = grd;
      g.fillRect(0, 0, 512, 512);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.052, 0]} receiveShadow>
      <circleGeometry args={[9, 96]} />
      <meshStandardMaterial map={tex} roughness={0.7} metalness={0.3} />
    </mesh>
  );
}

function Pedestal() {
  return (
    <group>
      <mesh position={[0, -0.035, 0]} receiveShadow>
        <cylinderGeometry args={[1.15, 1.2, 0.07, 64]} />
        <meshStandardMaterial color="#2a3038" roughness={0.55} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.02, 1.06, 64]} />
        <meshStandardMaterial color="#c9643a" emissive="#c9643a" emissiveIntensity={0.16} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.02, 64]} />
        <meshStandardMaterial color="#23282f" roughness={0.82} metalness={0.12} />
      </mesh>
    </group>
  );
}

function Rain({ active }: { active: boolean }) {
  const ref = useRef<THREE.LineSegments>(null);
  const drops = useMemo(() => {
    const n = 650;
    const arr = new Float32Array(n * 6);
    const len = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (Math.random() - 0.5) * 4.2;
      const z = (Math.random() - 0.5) * 4.2;
      const y = Math.random() * 4;
      const l = 0.09 + Math.random() * 0.14;
      arr[i * 6] = x;
      arr[i * 6 + 1] = y;
      arr[i * 6 + 2] = z;
      arr[i * 6 + 3] = x + 0.03;
      arr[i * 6 + 4] = y + l;
      arr[i * 6 + 5] = z;
      len[i] = l;
    }
    return { arr, len };
  }, []);
  useFrame((_, dt) => {
    if (!active || !ref.current) return;
    const attr = ref.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const a = attr.array as Float32Array;
    for (let i = 0; i < drops.len.length; i++) {
      let y = a[i * 6 + 1] - dt * 4.4;
      if (y < 0) y = 4;
      a[i * 6 + 1] = y;
      a[i * 6 + 4] = y + drops.len[i];
    }
    attr.needsUpdate = true;
  });
  if (!active) return null;
  return (
    <lineSegments ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[drops.arr, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#b7dcff" transparent opacity={0.48} />
    </lineSegments>
  );
}

function TestMotion({ genes, result, run }: { genes: Genes; result: TestResult; run: number }) {
  const group = useRef<THREE.Group>(null);
  const start = useRef<number>(-1);
  const paper = useRef<THREE.Mesh>(null);
  const human = useRef<THREE.Group>(null);
  const stream = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!group.current) return;
    if (start.current < 0) start.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - start.current;
    const g = group.current;
    g.position.set(0, 0, 0);
    g.rotation.set(0, 0, 0);

    if (result.animation === 'walkaway') {
      const p = Math.max(0, Math.min(1, (t - 0.5) * 0.55));
      g.position.x = p * 1.5;
      g.rotation.y = -p * 0.5;
    }
    if (result.animation === 'gimbal') {
      const tilt = Math.max(0, 0.55 - t * 0.35);
      g.rotation.z = Math.sin(t * 5) * tilt * 0.5;
    }
    if (result.animation === 'sealed') {
      const tilt = Math.min(0.9, t);
      g.rotation.z = -tilt;
    }
    if (result.animation === 'funnel') {
      g.rotation.z = Math.sin(t * 0.8) * 0.05;
    }
    if (result.animation === 'flip') {
      g.rotation.y = Math.sin(t * 0.5) * 0.25;
    }
    if (result.animation === 'nested') {
      g.position.y = -Math.min(0.12, t * 0.05);
    }

    if (paper.current) {
      const p = Math.min(1, t / 1.1);
      if (result.animation === 'ok' || result.animation === 'reject' || result.animation === 'claw') {
        paper.current.visible = t < 2.4;
        const x = -1.1 + p * 1.05;
        const y = 1.0 + Math.sin(p * Math.PI) * 0.55 - (result.animation === 'ok' ? p * p * 0.45 : 0);
        paper.current.position.set(x, y, 0.15);
        if (result.animation === 'reject' && p >= 1) {
          paper.current.position.set(-0.6 + (t - 1.1) * -0.4, 1.0, 0.2);
        }
      } else {
        paper.current.visible = false;
      }
    }

    if (human.current) {
      const p = Math.min(1, t / 1.3);
      human.current.visible = result.animation !== 'walkaway' || t < 0.6;
      human.current.position.set(-1.35 + p * 0.75, Math.abs(Math.sin(t * 7)) * 0.025 * (1 - p * 0.5), 0.35);
      human.current.rotation.y = 0.4;
      human.current.rotation.x = Math.min(0.22, Math.max(0, (t - 1.1) * 0.5));
    }

    if (stream.current) {
      stream.current.visible = result.animation === 'ok' && genes.family === 'cup';
      if (stream.current.visible) {
        stream.current.scale.y = Math.min(1, t * 2);
      }
    }
  });

  return (
    <group key={run}>
      <group ref={group}>
        <ProceduralModel genes={genes} />
      </group>
      <Rain active={genes.family === 'umbrella' && result.animation !== 'ok'} />
      {genes.family === 'cup' && (
        <mesh ref={stream} position={[0.12, 0.36, 0]}>
          <cylinderGeometry args={[0.012, 0.02, 0.62, 8, 1, true]} />
          <meshStandardMaterial {...MAT.water} side={THREE.DoubleSide} />
        </mesh>
      )}
      {genes.family === 'chair' && (
        <group ref={human}>
          <mesh position={[0, 0.44, 0]} castShadow>
            <capsuleGeometry args={[0.125, 0.38, 8, 16]} />
            <meshStandardMaterial color="#7d8a99" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.8, 0]} castShadow>
            <sphereGeometry args={[0.105, 20, 20]} />
            <meshStandardMaterial {...MAT.skin} />
          </mesh>
          {[-1, 1].map((sx) => (
            <group key={sx}>
              <mesh position={[sx * 0.07, 0.15, 0]} castShadow>
                <capsuleGeometry args={[0.045, 0.26, 6, 10]} />
                <meshStandardMaterial color="#3f4650" roughness={0.85} />
              </mesh>
              <mesh position={[sx * 0.16, 0.42, 0]} rotation={[0, 0, sx * 0.18]} castShadow>
                <capsuleGeometry args={[0.035, 0.3, 6, 10]} />
                <meshStandardMaterial color="#7d8a99" roughness={0.8} />
              </mesh>
            </group>
          ))}
        </group>
      )}
      {(genes.family === 'bin' || genes.family === 'cup') && (
        <mesh ref={paper} position={[-1.1, 1, 0.15]}>
          <icosahedronGeometry args={[0.07, 0]} />
          <meshStandardMaterial {...MAT.paper} flatShading />
        </mesh>
      )}
    </group>
  );
}

export function SceneShell({
  children,
  target = [0, 0.5, 0],
  autoRotate = true,
  fallback = null,
  cameraPosition = [1.5, 1.05, 1.75],
  variant = 'studio',
}: {
  children: ReactNode;
  target?: [number, number, number];
  autoRotate?: boolean;
  fallback?: ReactNode;
  cameraPosition?: [number, number, number];
  variant?: 'studio' | 'experiment';
}) {
  const spin = useMemo(() => new URLSearchParams(window.location.search).get('spin') !== '0', []);
  const cameraConfig = useMemo(() => ({ position: cameraPosition, fov: 35, near: .05, far: 40 }), [cameraPosition[0], cameraPosition[1], cameraPosition[2]]);
  const controlsTarget = useMemo(() => new THREE.Vector3(...target), [target[0], target[1], target[2]]);
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
      camera={cameraConfig}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.12;
      }}
    >
      <fog attach="fog" args={[variant === 'experiment' ? '#101713' : '#0b0e13', 3.6, 9]} />
      <StudioEnvironment />
      <ambientLight intensity={0.28} />
      <directionalLight
        position={[3.2, 5.2, 3.4]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00035}
        shadow-normalBias={0.02}
      >
        <orthographicCamera attach="shadow-camera" args={[-2.6, 2.6, 2.6, -2.6, 0.1, 20]} />
      </directionalLight>
      <directionalLight position={[-3.4, 2.2, -2.6]} intensity={0.7} color="#8fb3ff" />
      <directionalLight position={[0, 2.4, -3.8]} intensity={1.35} color="#ffb489" />
      <directionalLight position={[0.4, 0.9, 3.6]} intensity={0.35} color="#dfe9ff" />
      <Suspense fallback={fallback}>{children}</Suspense>
      {variant === 'studio' ? <><Pedestal /><Floor /></> : <group>
        <mesh position={[0,-.025,0]} receiveShadow><cylinderGeometry args={[.91,.94,.05,80]}/><meshBasicMaterial color="#1c2c22"/></mesh>
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,.002,0]}><ringGeometry args={[.87,.875,80]}/><meshBasicMaterial color="#9cbda5" transparent opacity={.5}/></mesh>
      </group>}
      <ContactShadows position={[0, 0.003, 0]} opacity={0.92} scale={5} blur={1.7} far={1.2} resolution={1024} color="#000000" />
      <OrbitControls
        makeDefault
        target={controlsTarget}
        enablePan={false}
        minDistance={1.1}
        maxDistance={variant === 'experiment' ? 6 : 4.2}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.02}
        autoRotate={autoRotate && spin}
        autoRotateSpeed={0.55}
      />
    </Canvas>
  );
}

export function Studio({
  genes,
  glbUrl,
  mode,
  testResult,
  testRun,
}: {
  genes: Genes;
  glbUrl?: string;
  mode: 'evolve' | 'test';
  testResult?: TestResult;
  testRun: number;
}) {
  const target: [number, number, number] = glbUrl ? [0, 0.5, 0] : genes.family === 'umbrella' ? [0, 0.72, 0] : [0, 0.45, 0];
  return (
    <SceneShell
      target={target}
      autoRotate={!!glbUrl && mode === 'evolve'}
      fallback={<ProceduralModel genes={genes} />}
    >
      {glbUrl ? (
        <GLBBoundary key={glbUrl} fallback={<ProceduralModel genes={genes} />}>
          <GltfModel url={glbUrl} sink={genes.family === 'umbrella' ? 0.025 : 0.004} />
        </GLBBoundary>
      ) : mode === 'test' && testResult ? (
        <TestMotion genes={genes} result={testResult} run={testRun} />
      ) : (
        <ProceduralModel genes={genes} />
      )}
    </SceneShell>
  );
}

