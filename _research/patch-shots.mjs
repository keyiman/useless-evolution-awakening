import fs from 'node:fs';
let s = fs.readFileSync('scripts/shots.mjs','utf8');
s = s.replace("?demo=cup&gen=${gen}&stage=1", "?demo=cup&gen=${gen}&stage=1&spin=0");
fs.writeFileSync('scripts/shots.mjs', s);
console.log('ok');
