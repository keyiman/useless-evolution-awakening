import fs from 'node:fs';
let s = fs.readFileSync('src/three/Studio.tsx','utf8');
s = s.replace('color="#e2703a" emissive="#e2703a" emissiveIntensity={0.35}', 'color="#c9643a" emissive="#c9643a" emissiveIntensity={0.16}');
s = s.replace('position={[0, 0.008, 0]} opacity={0.72} scale={5} blur={2.1} far={1.6} resolution={512}', 'position={[0, 0.003, 0]} opacity={0.92} scale={5} blur={1.7} far={1.2} resolution={1024}');
s = s.replace('color="#20242a" roughness={0.85} metalness={0.1}', 'color="#23282f" roughness={0.82} metalness={0.12}');
fs.writeFileSync('src/three/Studio.tsx', s);
console.log('patched');
