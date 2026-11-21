import fs from 'node:fs';
let s = fs.readFileSync('src/three/Studio.tsx','utf8');
s = s.replace("function GltfModel({ url }: { url: string }) {", "function GltfModel({ url, sink = 0 }: { url: string; sink?: number }) {");
s = s.replace("<primitive object={cloned} position={[-center.x, -box.min.y, -center.z]} />", "<primitive object={cloned} position={[-center.x, -box.min.y - sink, -center.z]} />");
s = s.replace("<GltfModel url={glbUrl} />", "<GltfModel url={glbUrl} sink={genes.family === 'umbrella' ? 0.006 : 0} />");
s = s.replace("  const target: [number, number, number] = glbUrl ? [0, 0.5, 0] : genes.family === 'umbrella' ? [0, 0.72, 0] : [0, 0.45, 0];", "  const target: [number, number, number] = glbUrl ? [0, 0.5, 0] : genes.family === 'umbrella' ? [0, 0.72, 0] : [0, 0.45, 0];\n  const spin = useMemo(() => new URLSearchParams(window.location.search).get('spin') !== '0', []);");
s = s.replace("autoRotate={!!glbUrl && mode === 'evolve'}", "autoRotate={!!glbUrl && mode === 'evolve' && spin}");
fs.writeFileSync('src/three/Studio.tsx', s);
console.log('ok');
