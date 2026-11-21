import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, statSync, renameSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'public/models';
const MANIFEST = join(DIR, 'manifest.json');
const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
let saved = 0;

for (const [key, rec] of Object.entries(manifest)) {
  const file = join(DIR, rec.file);
  if (!existsSync(file)) continue;
  const size = statSync(file).size;
  if (rec.optimized || size < 2_000_000) continue;
  const tmp = join(DIR, `tmp-${key}.glb`);
  console.log(`optimize ${rec.file} (${(size / 1048576).toFixed(1)} MB)`);
  execFileSync(
    process.execPath,
    ['node_modules/@gltf-transform/cli/bin/cli.js', 'optimize', file, tmp, '--texture-compress', 'webp', '--texture-size', '1024', '--simplify', 'false'],
    { stdio: 'inherit' },
  );
  const newSize = statSync(tmp).size;
  renameSync(tmp, file);
  rec.originalBytes = rec.originalBytes ?? size;
  rec.bytes = newSize;
  rec.optimized = true;
  saved += size - newSize;
  console.log(`  -> ${(newSize / 1024).toFixed(0)} KB`);
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
console.log(`saved ${(saved / 1048576).toFixed(1)} MB`);
