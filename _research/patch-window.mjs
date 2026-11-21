import fs from 'node:fs';
let s = fs.readFileSync('src/three/Procedural.tsx','utf8');
s = s.replace('color="#bfe3ff"\n              roughness={0.08}\n              metalness={0}\n              transparent\n              opacity={0.42}\n              emissive="#2f6f9e"\n              emissiveIntensity={0.25}', 'color="#7fd0ff"\n              roughness={0.06}\n              metalness={0}\n              transparent\n              opacity={0.88}\n              emissive="#2a7fbf"\n              emissiveIntensity={1.5}');
s = s.replace('<sphereGeometry args={[0.011 + (i % 3) * 0.003, 10, 10]} />', '<sphereGeometry args={[0.019 + (i % 3) * 0.004, 12, 12]} />');
fs.writeFileSync('src/three/Procedural.tsx', s);
console.log('ok');
