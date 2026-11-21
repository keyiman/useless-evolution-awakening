import { Canvas } from '@react-three/fiber';
import type { Genes } from '../engine/types';
import { ProceduralModel } from '../three/Procedural';

export function Thumb({ genes }: { genes: Genes }) {
  return (
    <Canvas
      frameloop="demand"
      dpr={1}
      camera={{ position: [1.35, 0.95, 1.55], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={1.1} />
      <directionalLight position={[2.5, 4, 2]} intensity={2.2} />
      <directionalLight position={[-2, 1.4, -1.5]} intensity={0.7} color="#8fb3ff" />
      <group position={[0, -0.5, 0]} scale={0.86}>
        <ProceduralModel genes={genes} />
      </group>
    </Canvas>
  );
}
