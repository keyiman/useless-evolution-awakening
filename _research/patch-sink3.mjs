import fs from 'node:fs';
let s = fs.readFileSync('src/three/Studio.tsx','utf8');
s = s.replace("genes.family === 'umbrella' ? 0.08 : 0.004", "genes.family === 'umbrella' ? 0.025 : 0.004");
fs.writeFileSync('src/three/Studio.tsx', s);
console.log('ok');
