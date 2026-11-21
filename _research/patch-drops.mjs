import fs from 'node:fs';
let s = fs.readFileSync('src/three/Procedural.tsx','utf8');
s = s.replace('[0.6, 0.2, 0.72],\n        [-0.55, 0.35, 0.75],\n        [0.15, 0.55, 0.9],\n        [-0.2, 0.25, 0.95],\n        [0.75, 0.6, 0.35],', '[0.6, 0.2, 1.0],\n        [-0.55, 0.35, 1.01],\n        [0.15, 0.55, 1.0],\n        [-0.2, 0.25, 1.02],\n        [0.75, 0.6, 1.0],');
fs.writeFileSync('src/three/Procedural.tsx', s);
console.log('ok');
