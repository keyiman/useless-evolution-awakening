import fs from 'node:fs';
let s = fs.readFileSync('scripts/record-demo.mjs','utf8');
s = s.replace("每一代，三种结构变异：增生 / 变比 / 反转 / 递归 / 融合 / 寄生", "每一代，从六种结构变异中三选一：增生 / 变比 / 反转 / 递归 / 融合 / 寄生");
s = s.replace("await wait(4500);\n\nawait cap('同一个种子", "await wait(7000);\n\nawait cap('同一个种子");
s = s.replace("await wait(2500);\n\nconst video", "await wait(3500);\n\nconst video");
fs.writeFileSync('scripts/record-demo.mjs', s);
console.log('ok');
