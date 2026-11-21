import { useApp } from '../store';
import { OPERATOR_META, RARE_META } from '../engine/operators';
import { Thumb } from './Thumb';

export function Candidates() {
  const candidates = useApp((s) => s.candidates);
  const choose = useApp((s) => s.choose);

  return (
    <div className="candidates">
      <div className="candidates-head">
        <span className="section-kicker">本代候选 · 三选一</span>
        <span className="muted">同一父节点、同一世界种子下，三个候选永久可复现</span>
      </div>
      <div className="candidate-grid">
        {candidates.map((c) => {
          const op = OPERATOR_META[c.mutation.operator];
          return (
            <article className="candidate" key={c.slot} style={{ ['--op' as string]: op.color }}>
              <div className="candidate-op">
                <span className="op-code">{c.mutation.operator}</span>
                <span className="op-name">{op.name}</span>
                {c.mutation.rare && <span className="rare-badge">★ {RARE_META[c.mutation.rare].name}</span>}
              </div>
              <div className="candidate-body">
                <div className="candidate-thumb">
                  <Thumb genes={c.genes} />
                </div>
                <div className="candidate-info">
                  <h3>{c.mutation.title}</h3>
                  <p className="candidate-sub">{c.mutation.subtitle}</p>
                  <ul className="changes">
                    {c.mutation.changes.slice(0, 2).map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                  <div className="chips">
                    {c.mutation.consequences.slice(0, 3).map((t, i) => (
                      <span className={`chip ${t.includes('-') ? 'neg' : 'pos'}`} key={i}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="candidate-foot">
                <div className="mini-scores">
                  <span title="实用性">U {c.score.utility.toFixed(2)}</span>
                  <span title="荒诞度">A {c.score.absurdity.toFixed(2)}</span>
                  <span title="祖先辨识度">R {c.score.recognition.toFixed(2)}</span>
                  <span className="q" title="综合评分">Q {c.score.q.toFixed(2)}</span>
                </div>
                <button className="btn primary" onClick={() => choose(c.slot)}>
                  让这一支活下来
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
