const fs = require('fs');
const catalog = JSON.parse(fs.readFileSync('src/lab/assetCatalog.json', 'utf8'));
const keep = new Set(Object.values(catalog.bases).map((url) => url.split('/').pop()));
const manifest = JSON.parse(fs.readFileSync('public/models/manifest.json', 'utf8'));
const trimmed = {};
for (const [key, entry] of Object.entries(manifest)) {
  if (keep.has(entry.file)) trimmed[key] = entry;
}
fs.writeFileSync('public/models/manifest.json', JSON.stringify(trimmed, null, 2) + '\n');
fs.writeFileSync('src/lab/assetCatalog.json', JSON.stringify({ bases: catalog.bases }, null, 2) + '\n');
console.log('manifest entries:', Object.keys(trimmed).length);
console.log('catalog bases:', Object.keys(catalog.bases).length);