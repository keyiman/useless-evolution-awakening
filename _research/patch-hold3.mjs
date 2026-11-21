import fs from 'node:fs';
let s = fs.readFileSync('src/three/Studio.tsx','utf8');
s = s.replace("const tilt = t < 0.9 ? t : t < 8.5 ? 0.9 : Math.max(0, 0.9 - (t - 8.5) * 1.1);", "const tilt = Math.min(0.9, t);");
fs.writeFileSync('src/three/Studio.tsx', s);
console.log('ok');
