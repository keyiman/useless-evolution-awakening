import { useState } from 'react';
import { useApp } from '../store';
import { FAMILIES, FAMILY_IDS } from '../engine/families';
import { RULE_VERSION } from '../engine/types';
import type { FamilyId } from '../engine/types';

const STEPS = [
  { n: '01', t: '选祖先，输入种子', d: '水杯、椅子、雨伞或垃圾桶。种子决定这一条进化线的全部随机决策。' },
  { n: '02', t: '每一代，三选一', d: '增生、变比、反转、递归、融合、寄生。三个候选永远可复现，随时可以回头。' },
  { n: '03', t: '让 Lux3D 把它做出来', d: '选中的分支交给 Aholo Lux3D 生成 GLB；再进入无用性测试，看它如何拒绝被使用。' },
];

export function Intro() {
  const setShowIntro = useApp((s) => s.setShowIntro);
  const init = useApp((s) => s.init);
  const loadShowcase = useApp((s) => s.loadShowcase);
  const seed = useApp((s) => s.seed);
  const hasNode = useApp((s) => Boolean(s.nodes[s.currentId]));
  const [family, setFamily] = useState<FamilyId>('cup');
  const [localSeed, setLocalSeed] = useState(seed || 'UE-2026');

  return (
    <div className="intro">
      <div className="intro-inner">
        <div className="intro-top">
          <div className="intro-eyebrow">2026 Aholo 全球 3D AI 黑客松 · 参赛作品</div>
          <h1>
            废物进化论
            <span>不适者生存</span>
          </h1>
          <p className="intro-en">USELESS EVOLUTION — SURVIVAL OF THE LEAST USEFUL</p>
          <p className="intro-lead">
            一台由随机种子驱动的 3D 物品进化器。每一次“合理升级”都会留下一个结构代价；
            五代之后，你会得到一只仍然装满了水、却拒绝让任何人喝到的杯子。
          </p>
        </div>

        <div className="intro-steps">
          {STEPS.map((s) => (
            <div className="intro-step" key={s.n}>
              <span className="step-n">{s.n}</span>
              <strong>{s.t}</strong>
              <p>{s.d}</p>
            </div>
          ))}
        </div>

        <div className="intro-pick">
          <span className="section-kicker">选择你的祖先</span>
          <div className="family-grid">
            {FAMILY_IDS.map((id) => (
              <button
                key={id}
                className={`family-card ${family === id ? 'active' : ''}`}
                onClick={() => setFamily(id)}
              >
                <span className="family-emoji">{FAMILIES[id].emoji}</span>
                <span className="family-name">{FAMILIES[id].name}</span>
                <span className="family-tag">{FAMILIES[id].tagline}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="intro-start">
          <label className="seed-field">
            <span>世界种子</span>
            <input
              value={localSeed}
              onChange={(e) => setLocalSeed(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  init(family, localSeed.trim() || 'UE-2026');
                }
              }}
              spellCheck={false}
            />
          </label>
          <button className="btn primary big" onClick={() => init(family, localSeed.trim() || 'UE-2026')}>
            开始进化 →
          </button>
          <button className="btn" onClick={() => loadShowcase(family)}>
            直接看示范路线
          </button>
          {hasNode && (
            <button className="btn ghost" onClick={() => setShowIntro(false)}>
              返回当前标本
            </button>
          )}
        </div>

        <div className="intro-foot">
          <span>核心工具：Aholo Lux3D（G1 / G1-Turbo 文生 3D）</span>
          <span>渲染：Three.js / React Three Fiber</span>
          <span>同种子同路径 · 规则版本 {RULE_VERSION}</span>
        </div>
      </div>
    </div>
  );
}
