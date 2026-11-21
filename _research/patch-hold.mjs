import fs from 'node:fs';
let s = fs.readFileSync('src/three/Studio.tsx','utf8');
s = s.replace("const tilt = t < 0.9 ? t : t < 2.4 ? 0.9 : Math.max(0, 0.9 - (t - 2.4) * 1.1);", "const tilt = t < 0.9 ? t : t < 4.2 ? 0.9 : Math.max(0, 0.9 - (t - 4.2) * 1.1);");
fs.writeFileSync('src/three/Studio.tsx', s);
console.log('ok');
