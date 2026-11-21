const fs = require('fs');
const path='src/lab/Assembled.tsx';
let text=fs.readFileSync(path,'utf8');
text=text.replace("import type { FamilyId } from '../engine/types';", "import type { FamilyId } from '../engine/types';\nimport { normalizeModel, organModel, attachmentLayout } from './attachment';");
const start=text.indexOf('  const base = useMemo');
const end=text.indexOf('  useFrame((state)',start);
const replacement=`  const base = useMemo(() => {
    const scene = normalizeModel(baseGltf.scene, .98, 1.2);
    prepare(scene);
    return scene;
  }, [baseGltf]);
  const models = useMemo(() => {
    const width = new THREE.Box3().setFromObject(base).getSize(new THREE.Vector3()).x;
    return active.map((entry, i) => {
      const model = organModel(organGltfs[i].scene, entry.id, width);
      prepare(model.scene);
      return { id: entry.id, ...model };
    });
  }, [active, organGltfs, base]);
  const layout = useMemo(() => attachmentLayout(base, family, models), [base, family, models]);
  const lift = layout.lift;
  const parts = useMemo(() => models.map(m => ({ id: m.id, scene: m.scene, position: layout.parts.find(p => p.id === m.id)!.position })), [models, layout]);
  const second = useMemo(() => {
    if (!secondUrl || !secondFamily) return null;
    const scene = normalizeModel(secondGltf.scene, .58, .6);
    prepare(scene);
    scene.position.set(layout.dims.x*.35, .18, -.12);
    return scene;
  }, [secondGltf, secondUrl, secondFamily, layout.dims.x]);

`;
text=text.slice(0,start)+replacement+text.slice(end);
text=text.replace('test?: { kind: string } | null;', 'test?: { kind: string; run?: number } | null;');
text=text.replace('[test?.kind]);','[test?.kind, test?.run]);');
fs.writeFileSync(path,text);
let lab=fs.readFileSync('src/lab/Lab.tsx','utf8');
lab=lab.replace("const [testKind, setTestKind] = useState<string | null>(null);", "const [testKind, setTestKind] = useState<string | null>(null);\n  const [testRun, setTestRun] = useState(0);");
lab=lab.replace("  const runTest = () => {", "  const runTest = () => {\n    setTestRun(n => n + 1);");
lab=lab.replace("test={testKind ? { kind: testKind } : null}","test={testKind ? { kind: testKind, run: testRun } : null}");
lab=lab.replace('<div className="lab-actions">','<div className="lab-actions">\n          <a className="btn ghost" href="./">返回逃离实验 ↗</a>');
lab=lab.replace('跨物种融合</div>','跨物种拼接 · 实验功能</div>');
fs.writeFileSync('src/lab/Lab.tsx',lab);
