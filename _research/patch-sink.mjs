import fs from 'node:fs';
let s = fs.readFileSync('src/three/Studio.tsx','utf8');
s = s.replace("sink={genes.family === 'umbrella' ? 0.006 : 0}", "sink={genes.family === 'umbrella' ? 0.02 : 0.004}");
fs.writeFileSync('src/three/Studio.tsx', s);
console.log('ok');
