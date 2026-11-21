import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SceneShell } from '../three/Studio';
import { Assembled } from './Assembled';
import { BASE_LIST, BASE_MAP, ORGAN_LIST, ORGAN_MAP, TEST_RULES, type OrganId } from '../engine/organs';
import { makeRoot } from '../engine/evolve';
import type { FamilyId } from '../engine/types';
import './lab.css';

const BASE_U: Record<FamilyId, number> = { cup: 0.9, chair: 0.82, umbrella: 0.88, bin: 0.76 };
const MAX_ORGANS = 4;
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

async function lookup(prompt: string): Promise<string | null> {
  try {
    const res = await fetch('/api/assets/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url ?? null;
  } catch {
    return null;
  }
}

function encode(family: FamilyId, organs: OrganId[], seed: string, second: FamilyId | null) {
  const json = JSON.stringify({ f: family, o: organs, s: seed, x: second });
  return btoa(unescape(encodeURIComponent(json))).replace(/=+$/, '');
}

function decode(hash: string): { f: FamilyId; o: OrganId[]; s: string; x: FamilyId | null } | null {
  try {
    const data = JSON.parse(decodeURIComponent(escape(atob(hash))));
    if (!data.f || !Array.isArray(data.o)) return null;
    return {
      f: data.f,
      o: data.o.filter((x: string) => ORGAN_MAP[x as OrganId]),
      s: String(data.s ?? 'LAB-001'),
      x: BASE_MAP[data.x as FamilyId] ? (data.x as FamilyId) : null,
    };
  } catch {
    return null;
  }
}

export function Lab() {
  const initial = useMemo(() => {
    const h = location.hash.startsWith('#lab=') ? location.hash.slice(5) : '';
    return h ? decode(h) : null;
  }, []);
  const [family, setFamily] = useState<FamilyId>(initial?.f ?? 'cup');
  const [organs, setOrgans] = useState<OrganId[]>(initial?.o ?? ['seal', 'arm']);
  const [seed] = useState(initial?.s ?? 'LAB-001');
  const [second, setSecond] = useState<FamilyId | null>(initial?.x ?? null);
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [secondUrl, setSecondUrl] = useState<string | null>(null);
  const [organUrls, setOrganUrls] = useState<Record<string, string>>({});
  const [auto, setAuto] = useState(false);
  const [cat, setCat] = useState<'all' | 'top' | 'side' | 'bottom' | 'around'>('all');
  const [testKind, setTestKind] = useState<string | null>(null);
  const [history, setHistory] = useState<{ organs: OrganId[]; at: number }[]>([]);
  const [toast, setToast] = useState('');
  const [note, setNote] = useState('');
  const timer = useRef<number | null>(null);
  const organsRef = useRef<OrganId[]>(organs);
  useEffect(() => {
    organsRef.current = organs;
  }, [organs]);

  // 读取器官库（全部是事前生成的 Lux3D 资产）
  useEffect(() => {
    let alive = true;
    (async () => {
      const entries = await Promise.all(
        ORGAN_LIST.map(async (o) => [o.id, await lookup(o.prompt)] as const),
      );
      if (!alive) return;
      setOrganUrls(Object.fromEntries(entries.filter(([, url]) => url)) as Record<string, string>);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 读取基础物体
  useEffect(() => {
    let alive = true;
    setBaseUrl(null);
    (async () => {
      const prompt = makeRoot(family, seed).prompt;
      const url = await lookup(prompt);
      if (alive) setBaseUrl(url);
    })();
    return () => {
      alive = false;
    };
  }, [family, seed]);

  // 融合的第二个物体
  useEffect(() => {
    let alive = true;
    if (!second || second === family) {
      setSecondUrl(null);
      return;
    }
    setSecondUrl(null);
    (async () => {
      const url = await lookup(makeRoot(second, seed).prompt);
      if (alive) setSecondUrl(url);
    })();
    return () => {
      alive = false;
    };
  }, [second, family, seed]);

  // 自主变异：每隔几秒自己长出一个器官
  useEffect(() => {
    if (!auto) return;
    timer.current = window.setInterval(() => {
      const ready = ORGAN_LIST.map((o) => o.id).filter((id) => organUrls[id]);
      if (!ready.length) return;
      const prev = organsRef.current;
      let next = [...prev];
      let action = '';
      const roll = Math.random();
      if (next.length > 0 && (next.length >= MAX_ORGANS || roll < 0.32)) {
        const i = Math.floor(Math.random() * next.length);
        action = `掉落了「${ORGAN_MAP[next[i]].name}」`;
        next.splice(i, 1);
      }
      if (next.length < MAX_ORGANS && (roll >= 0.32 || next.length === 0)) {
        const pool = ready.filter((id) => !next.includes(id));
        if (pool.length) {
          const pick = pool[Math.floor(Math.random() * pool.length)];
          next.push(pick);
          action = action ? `${action}，又长出了「${ORGAN_MAP[pick].name}」` : `自己长出了「${ORGAN_MAP[pick].name}」`;
        }
      }
      if (!next.length) {
        const pick = ready[Math.floor(Math.random() * ready.length)];
        next = [pick];
        action = `重新长出了「${ORGAN_MAP[pick].name}」`;
      }
      setOrgans(next);
      setTestKind(null);
      setHistory((h) => [...h.slice(-7), { organs: next, at: Date.now() }]);
      if (action) {
        setNote(action);
        window.setTimeout(() => setNote(''), 2400);
      }
    }, 4800);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [auto, organUrls]);

  const toggle = (id: OrganId) => {
    if (!organUrls[id]) {
      setToast('这个器官还没有预生成资产');
      window.setTimeout(() => setToast(''), 1800);
      return;
    }
    setTestKind(null);
    setOrgans((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_ORGANS
          ? [...prev.slice(1), id]
          : [...prev, id];
      setHistory((h) => [...h.slice(-7), { organs: next, at: Date.now() }]);
      return next;
    });
  };

  const randomize = () => {
    const pool = ORGAN_LIST.map((o) => o.id).filter((id) => organUrls[id]);
    const count = 1 + Math.floor(Math.random() * Math.min(3, pool.length));
    const next: OrganId[] = [];
    while (next.length < count && pool.length) {
      const i = Math.floor(Math.random() * pool.length);
      next.push(pool.splice(i, 1)[0]);
    }
    setTestKind(null);
    setOrgans(next);
    setHistory((h) => [...h.slice(-7), { organs: next, at: Date.now() }]);
  };

  const flags = useMemo(() => {
    const set = new Set<string>();
    for (const id of organs) for (const f of ORGAN_MAP[id].effects.flags ?? []) set.add(f);
    if (second && second !== family) set.add('fusion');
    return set;
  }, [organs, second, family]);

  const rule = useMemo(() => TEST_RULES.find((r) => flags.has(r.flag)) ?? null, [flags]);

  const score = useMemo(() => {
    let u = BASE_U[family];
    let a = 0.08;
    let r = 1;
    for (const id of organs) {
      const e = ORGAN_MAP[id].effects;
      u += e.utility;
      a += e.absurdity;
      r += e.recognition;
    }
    if (second && second !== family) {
      u -= 0.12;
      a += 0.3;
      r -= 0.18;
    }
    u = clamp(u);
    a = clamp(a);
    r = clamp(r);
    const q = 0.4 * u + 0.3 * a + 0.2 * r + 0.1 * Math.min(1, organs.length / 8);
    return { u, a, r, q };
  }, [family, organs, second]);

  const runTest = () => {
    setTestKind(rule ? rule.flag : 'ok');
  };

  const share = useCallback(async () => {
    const url = `${location.origin}${location.pathname}#lab=${encode(family, organs, seed, second)}`;
    try {
      await navigator.clipboard.writeText(url);
      setToast('链接已复制');
    } catch {
      setToast(url);
    }
    window.setTimeout(() => setToast(''), 2200);
  }, [family, organs, seed, second]);

  const base = BASE_MAP[family];
  const missing = ORGAN_LIST.filter((o) => !organUrls[o.id]).length;
  const cats: { id: 'all' | 'top' | 'side' | 'bottom' | 'around'; label: string }[] = [
    { id: 'all', label: '全部' },
    { id: 'top', label: '顶部' },
    { id: 'side', label: '侧面' },
    { id: 'bottom', label: '底部' },
    { id: 'around', label: '环绕' },
  ];
  const shown = cat === 'all' ? ORGAN_LIST : ORGAN_LIST.filter((o) => o.anchor === cat);
  const catCount = (id: string) => (id === 'all' ? ORGAN_LIST.length : ORGAN_LIST.filter((o) => o.anchor === id).length);

  return (
    <div className="lab">
      <header className="lab-head">
        <div className="lab-title">
          <span className="lab-kicker">AHOLO LUX3D · 器官组合实验</span>
          <h1>废物进化论 <em>器官库</em></h1>
          <p className="lab-sub">给日常物品装上本不该属于它的器官，看它如何一步步拒绝原来的用途。</p>
        </div>
        <div className="lab-actions">
          <span className="lab-seed">SEED {seed}</span>
          <button className={`btn ${auto ? 'primary' : 'ghost'}`} onClick={() => setAuto((v) => !v)}>
            {auto ? '自主变异中…' : '让它自己变异'}
          </button>
          <button className="btn ghost" onClick={randomize}>随机组合</button>
          <button className="btn ghost" onClick={() => { setOrgans([]); setTestKind(null); }}>清空器官</button>
          <button className="btn ghost" onClick={share}>分享</button>
        </div>
      </header>

      <main className="lab-main">
        <aside className="lab-left">
          <div className="lab-section-title">基础物体</div>
          {BASE_LIST.map((b) => (
            <button
              key={b.family}
              className={`base-card ${b.family === family ? 'on' : ''}`}
              onClick={() => {
                setFamily(b.family);
                setTestKind(null);
                if (second === b.family) setSecond(null);
              }}
            >
              <strong>{b.name}</strong>
              <span>{b.blurb}</span>
            </button>
          ))}
          <div className="lab-section-title" style={{ marginTop: 14 }}>跨物种融合</div>
          <div className="fusion-row">
            <button className={`fusion-chip ${!second ? 'on' : ''}`} onClick={() => setSecond(null)}>
              不融合
            </button>
            {BASE_LIST.filter((b) => b.family !== family).map((b) => (
              <button
                key={b.family}
                className={`fusion-chip ${second === b.family ? 'on' : ''}`}
                onClick={() => {
                  setSecond(second === b.family ? null : b.family);
                  setTestKind(null);
                }}
              >
                {b.name}
              </button>
            ))}
          </div>
          <div className="lab-section-title" style={{ marginTop: 18 }}>变异记录</div>
          <div className="lab-history">
            {history.length === 0 && <p className="muted">还没有记录。</p>}
            {history.slice().reverse().map((h, i) => (
              <button key={`${h.at}-${i}`} className="history-row" onClick={() => { setOrgans(h.organs); setTestKind(null); }}>
                <span>{h.organs.map((id) => ORGAN_MAP[id].name).join(' + ') || '原始'}</span>
                <em>{new Date(h.at).toLocaleTimeString('zh-CN', { hour12: false })}</em>
              </button>
            ))}
          </div>
          <a className="lab-legacy" href="?tree=1">
            <span>拓展模式</span>
            原来的「三选一进化树」仍然保留，点这里进入 →
          </a>
        </aside>

        <section className="lab-stage">
          {baseUrl ? (
            <SceneShell target={[0, 0.5, 0]} autoRotate={!testKind}>
              <Assembled
                family={family}
                organs={organs}
                baseUrl={baseUrl}
                organUrls={organUrls}
                secondUrl={secondUrl}
                secondFamily={second}
                test={testKind ? { kind: testKind } : null}
              />
            </SceneShell>
          ) : (
            <div className="lab-loading">正在读取 Lux3D 基础资产…</div>
          )}
          <div className="lab-hint">点下方器官卡片叠加 · 拖拽旋转 · 右上角可让它自己变异</div>
          {second && second !== family && (
            <div className="lab-fusion-tag">融合 · {BASE_MAP[family].name} × {BASE_MAP[second].name}</div>
          )}
          {note && <div className="lab-note">{note}</div>}
          {missing > 0 && <div className="lab-missing">还有 {missing} 个器官资产未就绪（赛前预生成）</div>}
        </section>

        <aside className="lab-right">
          <div className="lab-section-title">组合评价</div>
          <div className="lab-score">
            <div><span>可用性 U</span><strong>{score.u.toFixed(2)}</strong></div>
            <div><span>荒诞度 A</span><strong>{score.a.toFixed(2)}</strong></div>
            <div><span>辨识度 R</span><strong>{score.r.toFixed(2)}</strong></div>
            <div className="q"><span>综合 Q</span><strong>{score.q.toFixed(2)}</strong></div>
          </div>
          <p className="lab-basis">
            基础 {base.name} U={BASE_U[family].toFixed(2)}；每个器官按可见结构加减分，不是凭空的随机数。Q = 0.4U + 0.3A + 0.2R + 0.1×组合度。
          </p>
          <div className="lab-formula">
            <span>U</span>
            {BASE_U[family].toFixed(2)}
            {organs.map((id) => (
              <em key={id}>
                {ORGAN_MAP[id].effects.utility >= 0 ? ' + ' : ' − '}
                {Math.abs(ORGAN_MAP[id].effects.utility).toFixed(2)}
              </em>
            ))}
            {second && second !== family && <em> − 0.12</em>}
            <strong>= {score.u.toFixed(2)}</strong>
          </div>

          <div className="lab-section-title">结构 → 功能</div>
          <ul className="lab-effects">
            {organs.length === 0 && <li className="muted">还没有器官，它就是原来的样子。</li>}
            {organs.map((id) => {
              const o = ORGAN_MAP[id];
              return (
                <li key={id}>
                  <span className="dot" style={{ background: o.color }} />
                  <div>
                    <strong>{o.name}</strong>
                    <em>{o.blurb}</em>
                    <span className="eff">
                      可用性 {o.effects.utility >= 0 ? '+' : ''}{o.effects.utility.toFixed(2)} · 荒诞 +{o.effects.absurdity.toFixed(2)} · 辨识 {o.effects.recognition >= 0 ? '+' : ''}{o.effects.recognition.toFixed(2)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          <button className="btn primary wide" onClick={runTest}>运行无用性测试</button>
          {testKind && (
            <div className="lab-test">
              <strong>{testKind === 'ok' ? `它暂时还是一只${base.name}` : rule?.headline}</strong>
              <p>{testKind === 'ok' ? `结构没有阻止你使用它。至少这一代，它还记得自己是${base.name}。` : rule?.verdict}</p>
              {testKind !== 'ok' && (
                <p className="lab-test-why">
                  触发结构：
                  {organs
                    .filter((id) => rule && (ORGAN_MAP[id].effects.flags ?? []).includes(rule.flag))
                    .map((id) => ORGAN_MAP[id].name)
                    .join(' + ') || '跨物种融合'}
                </p>
              )}
              <button className="btn ghost small" onClick={() => setTestKind(null)}>返回观察</button>
            </div>
          )}
        </aside>
      </main>

      <section className="lab-tray">
        <div className="tray-head">
          <div className="tray-heading">
            <span className="lab-section-title">器官库 · {ORGAN_LIST.length} 个</span>
            <span className="tray-sub">
              最多选 {MAX_ORGANS} 个 · 4.1 万种组合 × 4 个基础物体 · 全部赛前 Lux3D 预生成
            </span>
          </div>
          <div className="tray-cats">
            {cats.map((c) => (
              <button
                key={c.id}
                className={`tray-cat ${cat === c.id ? 'on' : ''}`}
                onClick={() => setCat(c.id)}
              >
                {c.label} <em>{catCount(c.id)}</em>
              </button>
            ))}
          </div>
        </div>
        <div className="tray-grid">
          {shown.map((o) => {
            const on = organs.includes(o.id);
            const ready = !!organUrls[o.id];
            return (
              <button
                key={o.id}
                className={`organ-card ${on ? 'on' : ''} ${ready ? '' : 'pending'}`}
                style={{ ['--organ' as string]: o.color }}
                onClick={() => toggle(o.id)}
              >
                <span className="organ-anchor">{o.anchor === 'top' ? '顶部' : o.anchor === 'side' ? '侧面' : o.anchor === 'bottom' ? '底部' : '环绕'}</span>
                <strong>{o.name}</strong>
                <em>{o.blurb}</em>
                <span className="organ-effect">
                  可用性 {o.effects.utility >= 0 ? '+' : ''}{o.effects.utility.toFixed(2)}
                </span>
                {!ready && <span className="organ-pending">未就绪</span>}
              </button>
            );
          })}
        </div>
      </section>

      {toast && <div className="lab-toast">{toast}</div>}
    </div>
  );
}
