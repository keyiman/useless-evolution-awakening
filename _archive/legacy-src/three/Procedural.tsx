import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { FamilyId, Genes, PartGene, PartKind } from '../engine/types';
import { MAT } from './materials';

export interface Dims {
  radius: number;
  height: number;
  topY: number;
  midY: number;
  depth: number;
}

function dimsFor(genes: Genes): Dims {
  const { width, height, rim } = genes.proportions;
  switch (genes.family) {
    case 'cup': {
      const r = 0.27 * width;
      const h = 0.6 * height;
      return { radius: r, height: h, topY: h, midY: h * 0.52, depth: r * 2 };
    }
    case 'chair': {
      const w = 0.55 * width;
      const h = 0.48 * height;
      return { radius: w * 0.5, height: h + 0.5, topY: h + 0.5, midY: h, depth: w * 0.9 };
    }
    case 'umbrella': {
      const r = 0.52 * rim;
      const h = 1.12 * height;
      return { radius: r, height: h, topY: h, midY: h * 0.55, depth: r * 2 };
    }
    default: {
      const r = 0.27 * width;
      const h = 0.66 * height;
      return { radius: r, height: h, topY: h, midY: h * 0.5, depth: r * 2 };
    }
  }
}

/* ------------------------------------------------------------------ */
/* 基础家族模型                                                         */
/* ------------------------------------------------------------------ */

function Cup({ genes, dims }: { genes: Genes; dims: Dims }) {
  const { radius: r, height: h } = dims;
  const sealed = genes.flags.rimSealed;
  const nested = genes.flags.nested;
  return (
    <group>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r * 0.9, h, 56, 1, true]} />
        <meshStandardMaterial {...MAT.ceramic} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.015, 0]} receiveShadow>
        <cylinderGeometry args={[r * 0.9, r * 0.9, 0.03, 56]} />
        <meshStandardMaterial {...MAT.ceramicInner} />
      </mesh>
      <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r, 0.012, 10, 56]} />
        <meshStandardMaterial {...MAT.ceramic} />
      </mesh>
      <mesh position={[r + 0.035, h * 0.55, 0]} rotation={[0, 0, 0]} castShadow>
        <torusGeometry args={[0.135 * genes.proportions.handle, 0.028, 14, 40]} />
        <meshStandardMaterial {...MAT.ceramic} />
      </mesh>
      <mesh position={[0, h * 0.45, 0]}>
        <cylinderGeometry args={[r * 0.92, r * 0.86, h * 0.86, 48]} />
        <meshStandardMaterial {...MAT.water} />
      </mesh>
      {sealed && (
        <group position={[0, h + 0.015, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[r + 0.012, r + 0.012, 0.035, 56]} />
            <meshStandardMaterial {...MAT.metal} />
          </mesh>
          <mesh position={[0, 0.022, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[r * 0.5, 40]} />
            <meshPhysicalMaterial
              color="#7fd0ff"
              roughness={0.06}
              metalness={0}
              transparent
              opacity={0.88}
              emissive="#2a7fbf"
              emissiveIntensity={1.5}
            />
          </mesh>
          <mesh position={[r * 0.62, 0.045, 0]}>
            <sphereGeometry args={[0.032, 16, 16]} />
            <meshStandardMaterial {...MAT.accent} />
          </mesh>
        </group>
      )}
      {[
        [0.6, 0.2, 1.0],
        [-0.55, 0.35, 1.01],
        [0.15, 0.55, 1.0],
        [-0.2, 0.25, 1.02],
        [0.75, 0.6, 1.0],
      ].map(([a, y, rr], i) => (
        <mesh key={`drop-${i}`} position={[Math.cos(a * 6.28) * r * rr, h * y, Math.sin(a * 6.28) * r * rr]}>
          <sphereGeometry args={[0.019 + (i % 3) * 0.004, 12, 12]} />
          <meshStandardMaterial {...MAT.water} />
        </mesh>
      ))}
      {Array.from({ length: Math.min(nested, 4) }).map((_, i) => (
        <mesh key={i} position={[0, h * 0.5, 0]} rotation={[Math.PI / 2, 0, (i * Math.PI) / 4]}>
          <torusGeometry args={[r * (1.35 + i * 0.22), 0.008, 8, 64]} />
          <meshStandardMaterial {...MAT.glass} />
        </mesh>
      ))}
    </group>
  );
}

function Chair({ genes, dims }: { genes: Genes; dims: Dims }) {
  const w = dims.radius * 2;
  const seatY = 0.46 * genes.proportions.height;
  const backH = 0.52;
  const flipped = genes.flags.seatFlipped;
  const nested = genes.flags.nested;
  return (
    <group>
      <group position={[0, seatY, 0]} rotation={flipped ? [Math.PI, 0, 0] : [0, 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[w, 0.06, w * 0.92]} />
          <meshStandardMaterial {...MAT.wood} />
        </mesh>
        <mesh position={[0, 0.045, 0]} castShadow>
          <boxGeometry args={[w * 0.9, 0.045, w * 0.8]} />
          <meshStandardMaterial {...MAT.fabric} />
        </mesh>
      </group>
      <mesh position={[0, seatY + backH / 2, -w * 0.42]} rotation={[-0.08, 0, 0]} castShadow>
        <boxGeometry args={[w, backH, 0.05]} />
        <meshStandardMaterial {...MAT.wood} />
      </mesh>
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * w * 0.4, seatY / 2, sz * w * 0.36]} castShadow>
            <cylinderGeometry args={[0.022, 0.026, seatY, 12]} />
            <meshStandardMaterial {...MAT.wood} />
          </mesh>
        )),
      )}
      {Array.from({ length: Math.min(nested, 3) }).map((_, i) => (
        <mesh key={i} position={[0, seatY + 0.05, 0]}>
          <boxGeometry args={[w * (1.15 + i * 0.18), 0.04, w * (1.15 + i * 0.18)]} />
          <meshStandardMaterial {...MAT.glass} />
        </mesh>
      ))}
    </group>
  );
}

function Umbrella({ genes, dims }: { genes: Genes; dims: Dims }) {
  const r = dims.radius;
  const h = dims.height;
  const inverted = genes.flags.canopyInverted;
  const nested = genes.flags.nested;
  const canopyY = inverted ? h * 0.82 : h * 0.9;
  const rot: [number, number, number] = inverted ? [Math.PI, 0, 0] : [0, 0, 0];
  return (
    <group>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, h, 10]} />
        <meshStandardMaterial {...MAT.metal} />
      </mesh>
      <group position={[0, canopyY, 0]} rotation={rot}>
        <mesh castShadow>
          <coneGeometry args={[r, 0.3, 10, 1, true]} />
          <meshStandardMaterial {...MAT.fabric} side={THREE.DoubleSide} />
        </mesh>
        {Array.from({ length: 10 }).map((_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * r * 0.5, -0.06, Math.sin(a) * r * 0.5]} rotation={[0, -a, Math.PI / 2 - 0.28]}>
              <cylinderGeometry args={[0.005, 0.005, r * 1.05, 6]} />
              <meshStandardMaterial {...MAT.metal} />
            </mesh>
          );
        })}
      </group>
      <mesh position={[0, 0.06, 0]} rotation={[0, 0, 0]} castShadow>
        <torusGeometry args={[0.085, 0.022, 12, 32, Math.PI]} />
        <meshStandardMaterial {...MAT.wood} />
      </mesh>
      {Array.from({ length: Math.min(nested, 3) }).map((_, i) => (
        <mesh key={i} position={[0, canopyY + 0.05 * (i + 1), 0]} rotation={rot}>
          <coneGeometry args={[r * (1.18 + i * 0.2), 0.3, 10, 1, true]} />
          <meshStandardMaterial {...MAT.glass} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function Bin({ genes, dims }: { genes: Genes; dims: Dims }) {
  const r = dims.radius;
  const h = dims.height;
  const sealed = genes.flags.rimSealed;
  return (
    <group>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r * 0.94, h, 48, 1, true]} />
        <meshStandardMaterial {...MAT.metal} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[r * 0.94, r * 0.94, 0.04, 48]} />
        <meshStandardMaterial {...MAT.darkMetal} />
      </mesh>
      <mesh position={[0, h * 0.55, 0]}>
        <cylinderGeometry args={[r * 0.88, r * 0.88, h * 0.8, 40]} />
        <meshStandardMaterial {...MAT.dark} />
      </mesh>
      <mesh position={[0, h + 0.02, 0]} castShadow>
        <cylinderGeometry args={[r + 0.015, r + 0.015, 0.045, 48]} />
        <meshStandardMaterial {...MAT.darkMetal} />
      </mesh>
      {!sealed && (
        <mesh position={[0, h + 0.045, 0]}>
          <torusGeometry args={[r * 0.8, 0.012, 8, 40]} />
          <meshStandardMaterial {...MAT.accent} />
        </mesh>
      )}
      {sealed && (
        <group position={[0, h + 0.07, 0]}>
          <mesh>
            <boxGeometry args={[r * 1.6, 0.16, 0.03]} />
            <meshStandardMaterial {...MAT.accent} />
          </mesh>
        </group>
      )}
      <mesh position={[0, 0.09, r + 0.02]} castShadow>
        <boxGeometry args={[0.14, 0.03, 0.1]} />
        <meshStandardMaterial {...MAT.darkMetal} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* 变异部件                                                             */
/* ------------------------------------------------------------------ */

function anchorTransform(part: PartGene, dims: Dims, family: FamilyId): { position: [number, number, number]; rotation: [number, number, number] } {
  const a = part.slot * 1.15 + (family === 'chair' ? 0.4 : 0.9);
  const sideR = dims.radius + 0.035;
  if (part.kind === 'ring') {
    if (family === 'umbrella') return { position: [0, dims.topY - 0.02, 0], rotation: [Math.PI / 2, 0, 0] };
    if (family === 'cup') return { position: [0, dims.midY, 0], rotation: [0, part.slot * 0.7, 0] };
    return { position: [0, dims.midY, 0], rotation: [Math.PI / 2, 0, 0] };
  }
  switch (part.anchor) {
    case 'side':
      return { position: [Math.cos(a) * sideR, dims.midY + part.slot * 0.05, Math.sin(a) * sideR], rotation: [0, -a, 0] };
    case 'rim':
      return { position: [Math.cos(a) * dims.radius * 0.82, dims.topY, Math.sin(a) * dims.radius * 0.82], rotation: [0, -a, 0] };
    case 'top':
      return { position: [Math.cos(a) * 0.06, dims.topY + 0.1 + part.slot * 0.05, Math.sin(a) * 0.06], rotation: [0, a, 0] };
    case 'bottom':
      return { position: [Math.cos(a) * dims.radius * 0.8, 0.045, Math.sin(a) * dims.radius * 0.8], rotation: [0, -a, 0] };
    case 'back':
      return { position: [0, dims.midY + 0.2, -dims.depth * 0.45], rotation: [0, 0, 0] };
    case 'handle':
      return { position: [dims.radius + 0.05, dims.midY, 0], rotation: [0, 0, 0] };
    case 'seat':
      return { position: [0, dims.midY, 0], rotation: [0, 0, 0] };
    default:
      return { position: [0, dims.topY + 0.1, 0], rotation: [0, a, 0] };
  }
}

function Arm({ s, accent }: { s: number; accent: boolean }) {
  const m = accent ? MAT.accent : MAT.metal;
  return (
    <group scale={s}>
      <mesh position={[0, 0.03, 0]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial {...MAT.darkMetal} />
      </mesh>
      <mesh position={[0.08, 0.03, 0]} rotation={[0, 0, -0.15]}>
        <boxGeometry args={[0.14, 0.045, 0.045]} />
        <meshStandardMaterial {...m} />
      </mesh>
      <mesh position={[0.17, 0.05, 0]}>
        <sphereGeometry args={[0.028, 12, 12]} />
        <meshStandardMaterial {...MAT.darkMetal} />
      </mesh>
      <mesh position={[0.24, 0.09, 0]} rotation={[0, 0, -0.55]}>
        <boxGeometry args={[0.13, 0.035, 0.035]} />
        <meshStandardMaterial {...m} />
      </mesh>
      <mesh position={[0.31, 0.13, 0]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[0.05, 0.02, 0.06]} />
        <meshStandardMaterial {...MAT.dark} />
      </mesh>
    </group>
  );
}

function PartShape({ part, dims, family }: { part: PartGene; dims: Dims; family: FamilyId }) {
  const s = part.scale;
  switch (part.kind) {
    case 'ring':
      return (
        <mesh>
          <torusGeometry args={[dims.radius * (family === 'cup' ? 1.3 : 1.12), 0.011, 8, 64]} />
          <meshStandardMaterial {...(family === 'umbrella' ? MAT.glass : MAT.metal)} />
        </mesh>
      );
    case 'arm':
      return <Arm s={s} accent={Boolean(part.foreign)} />;
    case 'leg':
      return (
        <group scale={s}>
          <mesh position={[0, -0.1, 0]}>
            <cylinderGeometry args={[0.016, 0.02, 0.2, 10]} />
            <meshStandardMaterial {...MAT.metal} />
          </mesh>
          <mesh position={[0, -0.21, 0]}>
            <sphereGeometry args={[0.028, 10, 10]} />
            <meshStandardMaterial {...MAT.rubber} />
          </mesh>
        </group>
      );
    case 'wheel':
      return (
        <mesh rotation={[0, 0, Math.PI / 2]} scale={s}>
          <cylinderGeometry args={[0.065, 0.065, 0.035, 20]} />
          <meshStandardMaterial {...MAT.rubber} />
        </mesh>
      );
    case 'tank':
      return (
        <group scale={s}>
          <mesh>
            <capsuleGeometry args={[0.06, 0.14, 8, 16]} />
            <meshStandardMaterial {...MAT.darkMetal} />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.04, 8]} />
            <meshStandardMaterial {...MAT.accent} />
          </mesh>
        </group>
      );
    case 'nozzle':
      return (
        <group scale={s} rotation={[0, 0, -Math.PI / 2]}>
          <mesh position={[0, 0.05, 0]}>
            <coneGeometry args={[0.035, 0.1, 12]} />
            <meshStandardMaterial {...MAT.accent} />
          </mesh>
          <mesh position={[0, -0.03, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.08, 8]} />
            <meshStandardMaterial {...MAT.metal} />
          </mesh>
        </group>
      );
    case 'sensor':
      return (
        <group scale={s}>
          <mesh>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshStandardMaterial {...MAT.dark} />
          </mesh>
          <mesh position={[0, 0, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.02, 12]} />
            <meshStandardMaterial color="#7fe3ff" emissive="#2a7f99" emissiveIntensity={0.6} />
          </mesh>
        </group>
      );
    case 'cage':
      return (
        <group scale={s}>
          {[0.15, 0.32, 0.49].map((y) => (
            <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[dims.radius * 1.45, 0.008, 6, 48]} />
              <meshStandardMaterial {...MAT.metal} />
            </mesh>
          ))}
          {Array.from({ length: 6 }).map((_, i) => {
            const a = (i / 6) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * dims.radius * 1.45, 0.32, Math.sin(a) * dims.radius * 1.45]}>
                <cylinderGeometry args={[0.006, 0.006, 0.66, 6]} />
                <meshStandardMaterial {...MAT.metal} />
              </mesh>
            );
          })}
        </group>
      );
    case 'panel':
      return (
        <mesh scale={s}>
          <boxGeometry args={[0.16, 0.1, 0.015]} />
          <meshStandardMaterial {...MAT.dark} />
        </mesh>
      );
    case 'claw':
      return (
        <group scale={s}>
          <mesh position={[0, 0.02, 0]}>
            <boxGeometry args={[0.05, 0.03, 0.05]} />
            <meshStandardMaterial {...MAT.darkMetal} />
          </mesh>
          <mesh position={[0.035, 0.06, 0]} rotation={[0, 0, -0.5]}>
            <boxGeometry args={[0.012, 0.1, 0.03]} />
            <meshStandardMaterial {...MAT.metal} />
          </mesh>
          <mesh position={[-0.035, 0.06, 0]} rotation={[0, 0, 0.5]}>
            <boxGeometry args={[0.012, 0.1, 0.03]} />
            <meshStandardMaterial {...MAT.metal} />
          </mesh>
        </group>
      );
    case 'track':
      return (
        <group scale={s}>
          <mesh>
            <boxGeometry args={[0.13, 0.05, 0.26]} />
            <meshStandardMaterial {...MAT.rubber} />
          </mesh>
          {[-0.09, 0, 0.09].map((z) => (
            <mesh key={z} position={[0, 0.03, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.028, 0.028, 0.15, 12]} />
              <meshStandardMaterial {...MAT.darkMetal} />
            </mesh>
          ))}
        </group>
      );
    case 'tube': {
      const pts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.12, 0.05, 0.06),
        new THREE.Vector3(0.06, 0.18, 0.12),
        new THREE.Vector3(-0.05, 0.26, 0.02),
      ];
      const curve = new THREE.CatmullRomCurve3(pts);
      return (
        <mesh scale={s}>
          <tubeGeometry args={[curve, 24, 0.012, 8, false]} />
          <meshStandardMaterial {...MAT.rubber} />
        </mesh>
      );
    }
    case 'shell':
      return (
        <mesh scale={s}>
          <sphereGeometry args={[dims.radius * 1.55, 24, 18]} />
          <meshStandardMaterial {...MAT.shell} />
        </mesh>
      );
    case 'rail':
      return (
        <group scale={s}>
          {[0.12, 0.24, 0.36].map((y) => (
            <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[dims.radius * 1.35, 0.01, 6, 40]} />
              <meshStandardMaterial {...MAT.metal} />
            </mesh>
          ))}
        </group>
      );
    case 'conveyor':
      return (
        <group scale={s} position={[0, 0.03, 0]}>
          <mesh>
            <boxGeometry args={[0.3, 0.03, 0.16]} />
            <meshStandardMaterial {...MAT.dark} />
          </mesh>
          {[-0.1, 0, 0.1].map((x) => (
            <mesh key={x} position={[x, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.15, 10]} />
              <meshStandardMaterial {...MAT.metal} />
            </mesh>
          ))}
        </group>
      );
    case 'camera':
      return (
        <group scale={s}>
          <mesh>
            <boxGeometry args={[0.07, 0.05, 0.05]} />
            <meshStandardMaterial {...MAT.dark} />
          </mesh>
          <mesh position={[0, 0, 0.035]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.02, 10]} />
            <meshStandardMaterial color="#7fe3ff" emissive="#2a7f99" emissiveIntensity={0.5} />
          </mesh>
        </group>
      );
    case 'valve':
      return (
        <group scale={s}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.05, 0.012, 8, 20]} />
            <meshStandardMaterial {...MAT.accent} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.06, 8]} />
            <meshStandardMaterial {...MAT.metal} />
          </mesh>
        </group>
      );
    case 'filter':
      return (
        <group scale={s}>
          <mesh>
            <cylinderGeometry args={[0.07, 0.07, 0.14, 16, 1, true]} />
            <meshStandardMaterial {...MAT.metal} side={THREE.DoubleSide} />
          </mesh>
          {[0.03, 0, -0.03].map((y) => (
            <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.07, 0.006, 6, 16]} />
              <meshStandardMaterial {...MAT.darkMetal} />
            </mesh>
          ))}
        </group>
      );
    case 'pump':
      return (
        <group scale={s}>
          <mesh>
            <boxGeometry args={[0.1, 0.08, 0.08]} />
            <meshStandardMaterial {...MAT.darkMetal} />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.06, 12]} />
            <meshStandardMaterial {...MAT.accent} />
          </mesh>
        </group>
      );
    case 'canopy':
      return (
        <mesh scale={s} position={[0, 0.1, 0]}>
          <coneGeometry args={[0.42, 0.22, 10, 1, true]} />
          <meshStandardMaterial {...MAT.fabric} side={THREE.DoubleSide} />
        </mesh>
      );
    case 'spike':
      return (
        <mesh scale={s}>
          <coneGeometry args={[0.02, 0.12, 8]} />
          <meshStandardMaterial {...MAT.metal} />
        </mesh>
      );
    case 'antenna':
      return (
        <group scale={s}>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.16, 6]} />
            <meshStandardMaterial {...MAT.metal} />
          </mesh>
          <mesh position={[0, 0.17, 0]}>
            <sphereGeometry args={[0.018, 10, 10]} />
            <meshStandardMaterial color="#ff6b5e" emissive="#ff3b2f" emissiveIntensity={0.7} />
          </mesh>
        </group>
      );
    case 'mirror':
      return (
        <mesh scale={s} rotation={[0, 0.4, 0]}>
          <planeGeometry args={[0.12, 0.16]} />
          <meshStandardMaterial color="#cfe8f0" metalness={1} roughness={0.05} />
        </mesh>
      );
    case 'lid':
      return (
        <mesh scale={s}>
          <cylinderGeometry args={[0.12, 0.12, 0.025, 24]} />
          <meshStandardMaterial {...MAT.metal} />
        </mesh>
      );
    case 'handle':
      return (
        <mesh scale={s}>
          <torusGeometry args={[0.08, 0.014, 8, 24, Math.PI]} />
          <meshStandardMaterial {...MAT.metal} />
        </mesh>
      );
    default:
      return null;
  }
}

function PartView({ part, dims, family }: { part: PartGene; dims: Dims; family: FamilyId }) {
  const ref = useRef<THREE.Group>(null);
  const { position, rotation } = anchorTransform(part, dims, family);
  useFrame((state, dt) => {
    if (!ref.current) return;
    if (part.spin) ref.current.rotation.y += dt * part.spin * 1.6;
    if (part.swing) ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.7 + part.slot) * 0.3 * part.swing;
  });
  return (
    <group position={position} rotation={rotation}>
      <group ref={ref}>
        <PartShape part={part} dims={dims} family={family} />
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */

export function ProceduralModel({ genes, scale = 1 }: { genes: Genes; scale?: number }) {
  const dims = useMemo(() => dimsFor(genes), [genes]);
  return (
    <group scale={scale}>
      {genes.family === 'cup' && <Cup genes={genes} dims={dims} />}
      {genes.family === 'chair' && <Chair genes={genes} dims={dims} />}
      {genes.family === 'umbrella' && <Umbrella genes={genes} dims={dims} />}
      {genes.family === 'bin' && <Bin genes={genes} dims={dims} />}
      {genes.parts.map((p) => (
        <PartView key={p.id} part={p} dims={dims} family={genes.family} />
      ))}
    </group>
  );
}
