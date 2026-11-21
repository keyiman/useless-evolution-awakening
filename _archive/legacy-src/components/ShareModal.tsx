import { useMemo, useState } from 'react';
import { useApp } from '../store';
import { FAMILIES } from '../engine/families';
import { OPERATOR_META } from '../engine/operators';
import { runUselessTest } from '../engine/uselessTest';

export function ShareModal() {
  const setShowShare = useApp((s) => s.setShowShare);
  const shareLink = useApp((s) => s.shareLink);
  const nodes = useApp((s) => s.nodes);
  const currentId = useApp((s) => s.currentId);
  const seed = useApp((s) => s.seed);
  const [copied, setCopied] = useState<'link' | 'text' | null>(null);

  const link = useMemo(() => shareLink(), [shareLink]);
  const node = nodes[currentId];
  const meta = node ? FAMILIES[node.family] : FAMILIES.cup;

  const text = node
    ? `【废物进化论】${node.mutation?.title ?? '原始祖先'}｜${meta.name} G${node.generation}｜种子 ${seed}\n${runUselessTest(node.family, node.genes).verdict}\n#Aholo黑客松 #废物进化论`
    : '';

  const copy = async (kind: 'link' | 'text', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => setShowShare(false)}>
      <div className="modal share-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setShowShare(false)}>
          ×
        </button>
        <h2>分享这一支</h2>
        <p className="muted">链接里只包含种子与选择路径，打开后会在对方浏览器里重算出完全相同的谱系。</p>

        <div className="share-card">
          <div className="share-card-top">
            <span className="share-logo">废物进化论</span>
            <span className="share-gen">G{node?.generation ?? 0}</span>
          </div>
          <div className="share-title">{node?.mutation?.title ?? `${meta.name} G0`}</div>
          <div className="share-sub">
            {meta.name} · {node?.mutation ? `${OPERATOR_META[node.mutation.operator].name}` : '原始祖先'}
          </div>
          <div className="share-metrics">
            <span>U {node?.score.utility.toFixed(2)}</span>
            <span>A {node?.score.absurdity.toFixed(2)}</span>
            <span>Q {node?.score.q.toFixed(2)}</span>
          </div>
          <div className="share-seed">SEED {seed}</div>
        </div>

        <label className="field">
          <span>分享链接</span>
          <div className="field-row">
            <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
            <button className="btn" onClick={() => copy('link', link)}>
              {copied === 'link' ? '已复制' : '复制链接'}
            </button>
          </div>
        </label>

        <label className="field">
          <span>社交文案</span>
          <textarea readOnly value={text} rows={3} />
        </label>

        <div className="modal-actions">
          <button className="btn primary" onClick={() => copy('text', text)}>
            {copied === 'text' ? '已复制' : '复制分享文案'}
          </button>
          <button className="btn ghost" onClick={() => setShowShare(false)}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
