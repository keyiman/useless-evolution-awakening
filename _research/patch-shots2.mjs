import fs from 'node:fs';
let s = fs.readFileSync('scripts/shots.mjs','utf8');
s = s.replace("?demo=cup&gen=5'", "?demo=cup&gen=5&spin=0'");
s = s.replace("await shot('fig-test', 2600);", "await shot('fig-test', 1500);");
fs.writeFileSync('scripts/shots.mjs', s);
console.log('ok');
