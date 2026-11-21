import { useEffect, useMemo, useRef } from 'react';
import { useApp } from '../store';
import type { EvolutionNode } from '../engine/types';
import { FAMILIES } from '../engine/families';

const COL_W = 132;
const ROW_H = 100;
const NODE_W = 112;
const NODE_H = 58;
const PAD_X = 26;
const PAD_Y = 26;

export function Lineage({ onSelect }: { onSelect?: (id: string) => void }) {
  const nodes = useApp((s) => s.nodes);
  const currentId = useApp((s) => s.currentId);
  const goto = useApp((s) => s.goto);
  const wrapRef = useRef<HTMLDivElement>(null);
  const curRef = useRef<SVGGElement>(null);

  const { list, pos, width, height } = useMemo(() => {
    const byGen = new Map<number, EvolutionNode[]>();
    for (const n of Object.values(nodes)) {
      const arr = byGen.get(n.generation) ?? [];
      arr.push(n);
      byGen.set(n.generation, arr);
    }
    const p = new Map<string, { x: number; y: number }>();
    let maxX = 0;
    let maxY = 0;
    for (const [gen, arr] of byGen) {
      arr.sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
      arr.forEach((n, i) => {
        const x = PAD_X + i * COL_W;
        const y = PAD_Y + gen * ROW_H;
        p.set(n.id, { x, y });
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      });
    }
    return {
      list: Object.values(nodes).sort((a, b) => a.generation - b.generation || a.createdAt - b.createdAt),
      pos: p,
      width: maxX + NODE_W + PAD_X,
      height: maxY + NODE_H + PAD_Y,
    };
  }, [nodes]);

  useEffect(() => {
    curRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [currentId]);

  return (
    <div className="lineage-wrap" ref={wrapRef}>
      <div className="panel-title">
        <span>进化谱系</span>
        <span className="muted">{list.length} 个标本</span>
      </div>
      <div className="lineage-scroll">
        <svg width={Math.max(width, 200)} height={Math.max(height, 160)} className="lineage-svg">
          {list.map((n) =>
            n.parentIds.map((pid) => {
              const a = pos.get(pid);
              const b = pos.get(n.id);
              if (!a || !b) return null;
              const x1 = a.x + NODE_W / 2;
              const y1 = a.y + NODE_H;
              const x2 = b.x + NODE_W / 2;
              const y2 = b.y;
              const mid = (y1 + y2) / 2;
              return (
                <path
                  key={`${pid}-${n.id}`}
                  d={`M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`}
                  className={`lineage-edge ${n.parentIds.length > 1 ? 'fusion' : ''}`}
                />
              );
            }),
          )}
          {list.map((n) => {
            const p = pos.get(n.id)!;
            const isCur = n.id === currentId;
            const isRoot = n.parentIds.length === 0;
            return (
              <g
                key={n.id}
                ref={isCur ? curRef : undefined}
                transform={`translate(${p.x}, ${p.y})`}
                className={`lineage-node ${isCur ? 'current' : ''} ${isRoot ? 'root' : ''}`}
                onClick={() => (onSelect ? onSelect(n.id) : goto(n.id))}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && (onSelect ? onSelect(n.id) : goto(n.id))}
              >
                <rect width={NODE_W} height={NODE_H} rx={8} />
                <text x={8} y={15} className="ln-gen">
                  G{n.generation} · {FAMILIES[n.family].name}
                </text>
                <text x={8} y={31} className="ln-title">
                  {(n.mutation?.title ?? '原始祖先').slice(0, 9)}
                </text>
                <text x={8} y={46} className="ln-score">
                  U {n.score.utility.toFixed(2)} · A {n.score.absurdity.toFixed(2)}
                </text>
                {n.mutation?.rare && (
                  <text x={NODE_W - 8} y={15} textAnchor="end" className="ln-rare">
                    ★
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <p className="lineage-hint">点击任意标本回溯 · 回溯不会删除已生成的分支</p>
    </div>
  );
}
