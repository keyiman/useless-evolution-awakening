import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from './store';
import { FAMILIES, FAMILY_IDS } from './engine/families';
import { OPERATOR_META } from './engine/operators';
import { runUselessTest } from './engine/uselessTest';
import { Studio } from './three/Studio';
import { Lineage } from './components/Lineage';
import { GenePanel } from './components/GenePanel';
import { Candidates } from './components/Candidates';
import { TestPanel } from './components/TestPanel';
import { Intro } from './components/Intro';
import { ShareModal } from './components/ShareModal';

function randomSeed(family: string) {
  return `${family.slice(0, 3).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export default function App() {
  const seed = useApp((s) => s.seed);
  const family = useApp((s) => s.family);
  const nodes = useApp((s) => s.nodes);
  const currentId = useApp((s) => s.currentId);
  const assets = useApp((s) => s.assets);
  const mode = useApp((s) => s.mode);
  const testRun = useApp((s) => s.testRun);
  const showIntro = useApp((s) => s.showIntro);
  const showShare = useApp((s) => s.showShare);
  const toast = useApp((s) => s.toast);
  const setSeed = useApp((s) => s.setSeed);
  const setFamily = useApp((s) => s.setFamily);
  const setMode = useApp((s) => s.setMode);
  const restartTest = useApp((s) => s.restartTest);
  const generate = useApp((s) => s.generate);
  const fusion = useApp((s) => s.fusion);
  const setShowIntro = useApp((s) => s.setShowIntro);
  const setShowShare = useApp((s) => s.setShowShare);
  const loadShare = useApp((s) => s.loadShare);
  const init = useApp((s) => s.init);
  const loadShowcase = useApp((s) => s.loadShowcase);

  const [seedInput, setSeedInput] = useState(seed);
  const [showGlb, setShowGlb] = useState(true);
  const [fusionMode, setFusionMode] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const booted = useRef(false);

  const node = nodes[currentId];
  const asset = node ? assets[node.hash] : undefined;
  const testResult = useMemo(() => (node ? runUselessTest(node.family, node.genes) : null), [node]);
  const meta = node ? FAMILIES[node.family] : FAMILIES.cup;

  useEffect(() => setSeedInput(seed), [seed]);
  useEffect(() => setShowGlb(true), [currentId]);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const params = new URLSearchParams(location.search);
    if (params.get('demo')) {
      const fam = (params.get('demo') as typeof family) || 'cup';
      const gen = params.get('gen');
      loadShowcase(fam, gen ? Number(gen) : undefined);
      return;
    }
    if (params.get('play') === '1') {
      const fam = (params.get('family') as typeof family) || 'cup';
      init(fam, params.get('seed') || 'UE-2026');
      return;
    }
    const hash = location.hash;
    if (hash.startsWith('#s=')) {
      loadShare(hash.slice(3));
    }
  }, [loadShare, init, family]);

  useEffect(() => {
    if (asset?.status !== 'running' || !asset.startedAt) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - (asset.startedAt ?? Date.now())) / 1000)), 1000);
    return () => clearInterval(id);
  }, [asset?.status, asset?.startedAt]);

  if (!node) {
    return <div className="app">{showIntro && <Intro />}</div>;
  }

  const glbUrl = (() => {
    const forced = new URLSearchParams(location.search).get('glb');
    if (forced) return forced;
    return asset?.status === 'done' && showGlb && mode === 'evolve' ? asset.url : undefined;
  })();
  const busy = Object.values(assets).some((a) => a.status === 'queued' || a.status === 'running');

  const assetText = (() => {
    switch (asset?.status) {
      case 'checking':
        return '正在查询资产缓存…';
      case 'queued':
        return '任务已提交，等待 Lux3D 接收…';
      case 'running':
        return `Lux3D 正在生成 · task ${asset.taskId} · 已等待 ${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;
      case 'done':
        return `Lux3D 模型已缓存${asset.taskId ? ` · task ${asset.taskId}` : ''} · /models`;
      case 'error':
        return `生成失败：${asset.error}`;
      default:
        return '当前为程序化草模 · 尚未调用 Lux3D';
    }
  })();

  const stageOnly = new URLSearchParams(location.search).get('stage') === '1';
  if (stageOnly) {
    return (
      <div className="stage solo">
        <Studio genes={node.genes} glbUrl={glbUrl} mode="evolve" testRun={testRun} />
        <div className="stage-mark">
          Lux3D · G1-Turbo · {meta.name} G{node.generation}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand" onClick={() => setShowIntro(true)}>
          <span className="brand-mark">🧬</span>
          <span className="brand-text">
            <strong>废物进化论</strong>
            <em>USELESS EVOLUTION</em>
          </span>
        </div>

        <div className="family-tabs">
          {FAMILY_IDS.map((id) => (
            <button key={id} className={`tab ${family === id ? 'active' : ''}`} onClick={() => setFamily(id)}>
              <span>{FAMILIES[id].emoji}</span>
              {FAMILIES[id].name}
            </button>
          ))}
        </div>

        <div className="seed-box">
          <span className="seed-label">SEED</span>
          <input
            value={seedInput}
            onChange={(e) => setSeedInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setSeed(seedInput)}
            spellCheck={false}
          />
          <button className="icon-btn" title="应用种子" onClick={() => setSeed(seedInput)}>
            ↵
          </button>
          <button className="icon-btn" title="随机新种子" onClick={() => setSeed(randomSeed(family))}>
            ⟳
          </button>
        </div>

        <div className="top-actions">
          <button className="btn ghost" onClick={() => loadShowcase(family)} title="载入预生成的标准进化链">
            示范路线
          </button>
          <button className={`btn ghost ${fusionMode ? 'active' : ''}`} onClick={() => setFusionMode((v) => !v)}>
            {fusionMode ? '点选另一标本…' : '杂交'}
          </button>
          <button className="btn ghost" onClick={() => setShowShare(true)}>
            分享
          </button>
          <button className="btn ghost" onClick={() => setShowIntro(true)}>
            说明
          </button>
        </div>
      </header>

      <main className="layout">
        <aside className="panel lineage-panel">
          <Lineage
            onSelect={(id) => {
              if (fusionMode) {
                fusion(id);
                setFusionMode(false);
              } else {
                useApp.getState().goto(id);
              }
            }}
          />
        </aside>

        <section className="stage-col">
          <div className="stage">
            <Studio
              genes={node.genes}
              glbUrl={glbUrl}
              mode={mode}
              testResult={testResult ?? undefined}
              testRun={testRun}
            />

            <div className="hud hud-left">
              <div className="hud-gen">G{node.generation}</div>
              <div>
                <div className="hud-title">{node.mutation?.title ?? `${meta.name} G0`}</div>
                <div className="hud-sub">
                  {meta.name} · {node.mutation ? `${node.mutation.operator} ${OPERATOR_META[node.mutation.operator].name}` : '原始祖先'}
                  {node.mutation?.rare ? ` · ★ ${node.mutation.rare}` : ''}
                </div>
              </div>
            </div>

            <div className="hud hud-right">
              <div className="mode-switch">
                <button className={mode === 'evolve' ? 'active' : ''} onClick={() => setMode('evolve')}>
                  观察
                </button>
                <button className={mode === 'test' ? 'active' : ''} onClick={() => setMode('test')}>
                  无用性测试
                </button>
              </div>
              <div className="hud-scores">
                <span>U {node.score.utility.toFixed(2)}</span>
                <span>A {node.score.absurdity.toFixed(2)}</span>
                <span>R {node.score.recognition.toFixed(2)}</span>
                <span className="q">Q {node.score.q.toFixed(2)}</span>
              </div>
            </div>

            <div className="hud hud-hint">拖拽旋转 · 滚轮缩放 · 右键平移已禁用</div>

            <div className="asset-bar">
              <span className={`dot ${asset?.status ?? 'idle'}`} />
              <span className="asset-text">{assetText}</span>
              {asset?.status === 'done' && (
                <button className="btn ghost small" onClick={() => setShowGlb((v) => !v)}>
                  {showGlb ? '查看程序化草模' : '查看 Lux3D 模型'}
                </button>
              )}
              {(asset?.status === 'idle' || asset?.status === 'error') && (
                <button className="btn primary small" disabled={busy} onClick={() => generate(node)}>
                  {asset?.status === 'error' ? '重试生成' : '用 Lux3D 生成'}
                </button>
              )}
              {asset?.status === 'running' && (
                <span className="asset-note">首次生成约 3–8 分钟，完成后写入本地缓存</span>
              )}
            </div>

            {mode === 'test' && testResult && (
              <TestPanel result={testResult} run={testRun} onReplay={restartTest} onBack={() => setMode('evolve')} />
            )}

            {fusionMode && <div className="fusion-banner">杂交模式：在左侧谱系中点击另一个标本作为第二亲本</div>}
          </div>

          {mode === 'evolve' && <Candidates />}
        </section>

        <aside className="panel gene-panel-wrap">
          <GenePanel />
        </aside>
      </main>

      {showIntro && <Intro />}
      {showShare && <ShareModal />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
