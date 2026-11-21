import { useMemo, useState } from 'react';
import { useApp } from '../store';
import { FAMILIES, METRIC_ORDER } from '../engine/families';
import { OPERATOR_META, RARE_META } from '../engine/operators';
import { ANCHOR_LABELS } from '../engine/families';

function Bar({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'score' | 'warn' }) {
  const pct = Math.round(value * 100);
  return (
    <div className={`bar-row ${tone}`}>
      <span className="bar-label">{label}</span>
      <span className="bar-track">
        <span className="bar-fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="bar-val">{pct}</span>
    </div>
  );
}

export function GenePanel() {
  const nodes = useApp((s) => s.nodes);
  const currentId = useApp((s) => s.currentId);
  const assets = useApp((s) => s.assets);
  const [copied, setCopied] = useState(false);
  const node = nodes[currentId];
  const asset = node ? assets[node.hash] : undefined;
  const meta = node ? FAMILIES[node.family] : FAMILIES.cup;
  const metrics = node ? METRIC_ORDER[node.family] : [];

  const lostMarks = useMemo(() => (node ? meta.marks.filter((m) => !node.genes.marks.includes(m)) : []), [node, meta]);

  if (!node) return null;
  const m = node.mutation;

  return (
    <div className="gene-panel">
      <div className="panel-title">
        <span>标本档案</span>
        <span className="muted">G{node.generation} / {meta.name}</span>
      </div>

      <div className="specimen-head">
        <div className="specimen-title">{m?.title ?? `${meta.name} G0`}</div>
        <div className="specimen-sub">
          {m ? (
            <>
              <span className="op-pill" style={{ background: OPERATOR_META[m.operator].color }}>
                {m.operator} {OPERATOR_META[m.operator].name}
              </span>
              <span>{m.subtitle}</span>
              {m.rare && <span className="rare-pill">★ {RARE_META[m.rare].name}</span>}
            </>
          ) : (
            <span>原始祖先 · 未被改造的对照组</span>
          )}
        </div>
        {m && <p className="specimen-blurb">{m.blurb}</p>}
      </div>

      <section className="gene-section">
        <h4>功能指标</h4>
        <div className="bars">
          {metrics.map((k) => (
            <Bar key={k} label={meta.metricLabels[k]} value={node.genes.metrics[k]} tone={node.genes.metrics[k] < 0.35 ? 'warn' : 'default'} />
          ))}
        </div>
      </section>

      <section className="gene-section">
        <h4>结构清单</h4>
        <div className="parts-list">
          {node.genes.parts.length === 0 && <p className="muted small">尚无附加部件，只有原始结构。</p>}
          {node.genes.parts.map((p) => (
            <div className="part-row" key={p.id}>
              <span className="part-dot" />
              <span className="part-name">{p.label}</span>
              <span className="part-meta">
                {ANCHOR_LABELS[p.anchor] ?? p.anchor}
                {p.foreign ? ' · 异物' : ''}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="gene-section">
        <h4>祖先记忆</h4>
        <div className="chips">
          {node.genes.marks.map((mk) => (
            <span className="chip pos" key={mk}>
              {mk}
            </span>
          ))}
          {lostMarks.map((mk) => (
            <span className="chip lost" key={mk}>
              {mk}（已失去）
            </span>
          ))}
        </div>
      </section>

      {node.genes.conflicts.length > 0 && (
        <section className="gene-section">
          <h4>结构冲突 · 无用性的原因</h4>
          {node.genes.conflicts.map((c) => (
            <div className="conflict" key={c.id}>
              <span className="conflict-mark">!</span>
              {c.label}
            </div>
          ))}
        </section>
      )}

      <section className="gene-section">
        <h4>四维评分</h4>
        <div className="bars">
          <Bar label="实用性 U" value={node.score.utility} tone="score" />
          <Bar label="新颖度 N" value={node.score.novelty} tone="score" />
          <Bar label="荒诞度 A" value={node.score.absurdity} tone="score" />
          <Bar label="辨识度 R" value={node.score.recognition} tone="score" />
          <Bar label="综合 Q" value={node.score.q} tone="score" />
        </div>
      </section>

      <section className="gene-section">
        <h4>Lux3D 资产</h4>
        <div className="asset-line">
          <span className={`dot ${asset?.status ?? 'idle'}`} />
          <span>
            {asset?.status === 'done' && '已缓存 GLB'}
            {asset?.status === 'running' && `生成中 · task ${asset.taskId}`}
            {asset?.status === 'queued' && '任务排队中'}
            {asset?.status === 'checking' && '查询缓存…'}
            {asset?.status === 'error' && `失败：${asset.error}`}
            {(!asset || asset.status === 'idle') && '未生成（当前为程序化草模）'}
          </span>
        </div>
        {asset?.status === 'done' && asset.url && (
          <a className="link" href={asset.url} target="_blank" rel="noreferrer">
            下载 {asset.url.split('/').pop()} ↗
          </a>
        )}
        <p className="muted tiny">提示词按五段式生成：身份 / 继承 / 突变 / 几何 / 风格。</p>
      </section>

      <details className="prompt-box">
        <summary>查看本代 Lux3D 提示词</summary>
        <pre>{node.prompt}</pre>
        <button
          className="btn ghost tiny-btn"
          onClick={() => {
            void navigator.clipboard?.writeText(node.prompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? '已复制' : '复制提示词'}
        </button>
      </details>
    </div>
  );
}
