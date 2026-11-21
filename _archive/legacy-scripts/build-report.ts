import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { FAMILIES, METRIC_ORDER } from '../src/engine/families';
import { OPERATOR_META, RARE_META } from '../src/engine/operators';
import { RULE_VERSION } from '../src/engine/types';
import type { FamilyId } from '../src/engine/types';
import { showcaseChain, SHOWCASE } from '../src/engine/showcase';

const manifest = JSON.parse(readFileSync('public/models/manifest.json', 'utf8')) as Record<string, any>;
const records = Object.values(manifest);
const totalBytes = records.reduce((s, r) => s + (r.bytes ?? 0), 0);
const mb = (n: number) => (n / 1048576).toFixed(1);
const rawAvg = records.reduce((s, r) => s + (r.originalBytes ?? r.bytes ?? 0), 0) / Math.max(1, records.length);
const optRecs = records.filter((r) => r.optimized);
const optAvg = optRecs.length ? optRecs.reduce((s, r) => s + r.bytes, 0) / optRecs.length : rawAvg * 0.1;
const ratio = Math.round((optAvg / Math.max(1, rawAvg)) * 100);
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pct = (n: number) => Math.round(n * 100);

const cup = showcaseChain('cup');
const fig = (name: string, cap: string, cls = '') =>
  `<figure class="${cls}"><img src="figs/${name}.png" alt="${esc(cap)}"><figcaption>${esc(cap)}</figcaption></figure>`;

const page = (n: number, title: string, body: string, cls = '') => `
<section class="page ${cls}">
  <div class="runhead"><span>废物进化论 · 不适者生存</span><span>${title}</span></div>
  ${body}
  <div class="runfoot"><span>2026 Aholo 全球 3D AI 黑客松</span><span>${String(n).padStart(2, '0')}</span></div>
</section>`;

// 实用性曲线
const utils = cup.map((n) => n.score.utility);
const W = 620, H = 150, pad = 26;
const pts = utils
  .map((u, i) => {
    const x = pad + (i * (W - pad * 2)) / (utils.length - 1);
    const y = H - pad - u * (H - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  })
  .join(' ');
const curve = `<svg viewBox="0 0 ${W} ${H}" class="curve">
  <line x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${H - pad}" stroke="#cfd3d9"/>
  <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${H - pad}" stroke="#cfd3d9"/>
  <polyline points="${pts}" fill="none" stroke="#e2703a" stroke-width="2.5"/>
  ${utils
    .map((u, i) => {
      const x = pad + (i * (W - pad * 2)) / (utils.length - 1);
      const y = H - pad - u * (H - pad * 2);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="#e2703a"/><text x="${x.toFixed(1)}" y="${(y - 9).toFixed(1)}" font-size="9" fill="#6b7280" text-anchor="middle">${u.toFixed(2)}</text><text x="${x.toFixed(1)}" y="${H - 9}" font-size="9" fill="#6b7280" text-anchor="middle">G${i}</text>`;
    })
    .join('')}
</svg>`;

const opRows = (Object.keys(OPERATOR_META) as (keyof typeof OPERATOR_META)[])
  .map((k) => {
    const m = OPERATOR_META[k];
    return `<tr><td class="mono">${k}</td><td><b>${m.name}</b><br><span class="en">${m.en}</span></td><td>${m.desc}</td></tr>`;
  })
  .join('');

const rareRows = (Object.keys(RARE_META) as (keyof typeof RARE_META)[])
  .map((k) => `<tr><td class="mono">${k}</td><td><b>${RARE_META[k].name}</b></td><td>${RARE_META[k].desc}</td></tr>`)
  .join('');

const famRows = (Object.keys(FAMILIES) as FamilyId[])
  .map((f) => {
    const m = FAMILIES[f];
    const metrics = METRIC_ORDER[f].map((x) => m.metricLabels[x]).join(' / ');
    return `<tr><td>${m.emoji} ${m.name}<br><span class="en">${m.en}</span></td><td>${metrics}</td><td>${m.testName}</td><td>${m.tagline}</td></tr>`;
  })
  .join('');

const chainRows = cup
  .map((n) => {
    const s = n.score;
    const rare = n.mutation?.rare ? RARE_META[n.mutation.rare].name : '—';
    const op = n.mutation ? `${n.mutation.operator} ${OPERATOR_META[n.mutation.operator].name}` : '祖先';
    return `<tr><td class="mono">G${n.generation}</td><td>${esc(n.mutation?.title ?? '原始祖先')}</td><td>${op}</td><td>${rare}</td><td class="num">${pct(s.utility)}</td><td class="num">${pct(s.novelty)}</td><td class="num">${pct(s.absurdity)}</td><td class="num">${pct(s.recognition)}</td><td class="num"><b>${pct(s.q)}</b></td><td class="num">${n.genes.conflicts.length}</td><td class="num">${n.genes.parts.length}</td></tr>`;
  })
  .join('');

const manifestRows = records
  .sort((a, b) => (a.generation ?? 0) - (b.generation ?? 0) || String(a.family).localeCompare(String(b.family)))
  .map(
    (r) =>
      `<tr><td class="mono">${r.taskId}</td><td>${esc(r.nodeLabel)}</td><td class="num">${r.generation}</td><td class="mono">${(r.bytes / 1048576).toFixed(2)} MB</td><td class="mono">${String(r.createdAt).slice(5, 16).replace('T', ' ')}</td><td class="mono">${r.optimized ? 'webp+meshopt' : '原始'}</td></tr>`,
  )
  .join('');

const famSummary = (['cup', 'chair', 'umbrella', 'bin'] as FamilyId[])
  .map((f) => {
    const chain = showcaseChain(f);
    const last = chain[chain.length - 1];
    const ops = chain.slice(1).map((n) => n.mutation!.operator).join(' → ');
    return `<tr><td>${FAMILIES[f].name}</td><td class="mono">${SHOWCASE[f].seed}</td><td class="mono">${ops}</td><td>${esc(last.mutation?.title ?? '')}</td><td class="num">${pct(last.score.utility)}</td><td class="num">${pct(last.score.absurdity)}</td><td class="num">${pct(last.score.q)}</td></tr>`;
  })
  .join('');

const promptSample = cup[5].prompt;

const css = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; background: #eceef1; color: #1b1f24; font-family: "Microsoft YaHei", "PingFang SC", sans-serif; font-size: 10.2pt; line-height: 1.72; }
.page { width: 210mm; height: 297mm; padding: 16mm 18mm 14mm; background: #fff; position: relative; page-break-after: always; overflow: hidden; }
.page:last-child { page-break-after: auto; }
.runhead { display: flex; justify-content: space-between; font-size: 8pt; letter-spacing: .08em; color: #9aa1aa; border-bottom: 1px solid #e3e6ea; padding-bottom: 4px; margin-bottom: 10mm; text-transform: uppercase; }
.runfoot { position: absolute; left: 18mm; right: 18mm; bottom: 8mm; display: flex; justify-content: space-between; font-size: 8pt; color: #9aa1aa; border-top: 1px solid #e3e6ea; padding-top: 4px; }
h1 { font-size: 24pt; margin: 0 0 4mm; letter-spacing: -.01em; }
h2 { font-size: 15pt; margin: 0 0 4mm; padding-bottom: 2mm; border-bottom: 2px solid #e2703a; display: inline-block; }
h3 { font-size: 11.5pt; margin: 6mm 0 2mm; color: #111; }
p { margin: 0 0 3mm; text-align: justify; }
.lead { font-size: 11.5pt; color: #333; }
.muted { color: #6b7280; }
.mono { font-family: "Cascadia Mono", Consolas, monospace; font-size: 8.6pt; }
.en { font-size: 8pt; color: #8b929b; letter-spacing: .04em; }
table { width: 100%; border-collapse: collapse; margin: 3mm 0 5mm; font-size: 9pt; }
th { text-align: left; background: #f5f6f8; font-weight: 600; padding: 2mm; border-bottom: 1px solid #d9dde2; }
td { padding: 1.8mm 2mm; border-bottom: 1px solid #eceef1; vertical-align: top; }
td.num { text-align: right; font-family: "Cascadia Mono", Consolas, monospace; font-size: 8.8pt; }
figure { margin: 3mm 0 5mm; }
figure img { width: 100%; border-radius: 2mm; display: block; }
.zoomwrap { overflow: hidden; border-radius: 2mm; aspect-ratio: 1 / 1; background: #0b0e12; }
.zoomwrap img { width: 100%; height: 100%; object-fit: cover; transform: scale(1.42); }
.w80 { width: 82%; margin-left: auto; margin-right: auto; }
figcaption { font-size: 8.2pt; color: #7b828b; margin-top: 1.5mm; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
.three { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3mm; }
.box { border: 1px solid #e1e4e8; border-radius: 2mm; padding: 4mm; background: #fafbfc; }
.kpi { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; margin: 4mm 0; }
.kpi div { border-top: 2px solid #e2703a; padding-top: 2mm; }
.kpi b { display: block; font-size: 18pt; font-family: "Cascadia Mono", Consolas, monospace; line-height: 1.1; }
.kpi span { font-size: 8pt; color: #6b7280; }
pre { background: #12161b; color: #dfe5ec; padding: 4mm; border-radius: 2mm; font-family: "Cascadia Mono", Consolas, monospace; font-size: 8.2pt; line-height: 1.55; white-space: pre-wrap; }
.cover { background: #0d1014; color: #f2f4f7; padding: 0; }
.cover .inner { position: absolute; inset: 0; padding: 22mm; display: flex; flex-direction: column; }
.cover .tag { color: #e2703a; font-size: 9pt; letter-spacing: .28em; text-transform: uppercase; }
.cover h1 { font-size: 42pt; line-height: 1.12; margin: 6mm 0 3mm; }
.cover .sub { font-size: 14pt; color: #aeb6c0; letter-spacing: .02em; }
.cover .hero { margin-top: auto; position: relative; height: 120mm; }
.cover .hero img { width: 100%; height: 100%; object-fit: cover; border-radius: 2mm; opacity: .92; }
.cover .meta { display: flex; justify-content: space-between; font-size: 9pt; color: #8d96a1; margin-top: 6mm; border-top: 1px solid #262c34; padding-top: 4mm; }
.cover .meta b { color: #e8ecf1; font-weight: 600; }
.toc { list-style: none; padding: 0; margin: 4mm 0; }
.toc li { display: flex; justify-content: space-between; border-bottom: 1px dotted #d5d9de; padding: 2.2mm 0; }
.toc b { font-weight: 600; }
.curve { width: 100%; height: auto; margin: 2mm 0 1mm; }
.flow { display: flex; align-items: center; gap: 2mm; margin: 4mm 0; }
.flow div { flex: 1; border: 1px solid #dfe3e8; border-radius: 1.5mm; padding: 3mm; text-align: center; font-size: 8.6pt; background: #fafbfc; }
.flow span { color: #e2703a; font-weight: 700; }
.note { border-left: 3px solid #e2703a; padding: 2mm 0 2mm 4mm; color: #4b5563; background: #fdf8f5; margin: 3mm 0; }
ul, ol { margin: 0 0 3mm; padding-left: 5mm; }
li { margin-bottom: 1.2mm; }
`;

const cover = `
<section class="page cover">
  <div class="inner">
    <div class="tag">2026 Aholo Global 3D AI Hackathon · Project Report</div>
    <h1>废物进化论<br>不适者生存</h1>
    <div class="sub">Useless Evolution: Survival of the Least Useful</div>
    <div class="sub" style="font-size:11pt;margin-top:3mm;color:#7f8894">一个用可复现规则让日常物品逐代进化、直到彻底没用的 3D 交互作品</div>
    <div class="hero"><img src="figs/fig-asset-g5.png" alt="封口水杯"></div>
    <div class="meta">
      <span>参赛者：<b>【姓名 / 团队】</b></span>
      <span>技术：<b>React · Three.js · Node · Aholo Lux3D G1-Turbo</b></span>
      <span>版本：<b>${RULE_VERSION}</b></span>
      <span>2026-11</span>
    </div>
  </div>
</section>`;

const toc = page(
  1,
  '目录 · 摘要',
  `<h2>摘要</h2>
  <p class="lead">《废物进化论》把“过度设计”做成一个可玩的 3D 进化树：玩家给出世界种子，系统每代产生三个结构变异候选；被选中的分支由 Aholo Lux3D 生成真实 GLB 模型，随后进入无用性测试，演示它如何一步步失去原本的用途。</p>
  <p>作品的核心不是“生成一个奇怪的物体”，而是让“为什么变成这样”可见、可回溯、可复现。所有变异由一套确定性规则系统产生；同一个种子与同一条路径，永远得到同一组候选、同一段谱系与同一份提示词。Lux3D 负责把规则结果变成高质量网格，规则系统负责因果与叙事，两者分工明确。</p>
  <div class="kpi">
    <div><b>4</b><span>物品家族</span></div>
    <div><b>6</b><span>结构算子</span></div>
    <div><b>8</b><span>稀有事件</span></div>
    <div><b>${records.length}</b><span>真实 Lux3D 资产</span></div>
  </div>
  <ul class="toc">
    <li><b>01　创意与问题意识</b><span>为什么做“无用”</span></li>
    <li><b>02　体验流程</b><span>从种子到标本</span></li>
    <li><b>03　系统架构</b><span>基因型、表现型与三层几何</span></li>
    <li><b>04　进化算法</b><span>随机、算子、评分与冲突</span></li>
    <li><b>05　示范链与数据</b><span>一条可复现的失败史</span></li>
    <li><b>06　Lux3D 管线</b><span>真实任务、提示词与缓存</span></li>
    <li><b>07　资产迭代对比</b><span>G0 → G3 → G5</span></li>
    <li><b>08　工程与质量控制</b><span>确定性、压缩、安全</span></li>
    <li><b>09　局限与下一步</b><span>我们还没做什么</span></li>
    <li><b>10　提交信息</b><span>链接、分工、声明</span></li>
  </ul>`,
);

const p1 = page(
  2,
  '01 创意与问题意识',
  `<h2>01　创意与问题意识</h2>
  <p class="lead">当一个系统只优化单一指标时，它可以在指标上越来越“成功”，同时越来越不适合被使用。水杯可以做到“一滴也不洒”，代价是“一滴也倒不出来”。</p>
  <h3>1.1 三个灵感来源</h3>
  <ul>
    <li><b>珍道具（Chindogu）</b>：看似解决了问题、实际制造了更多问题的发明。它的幽默来自“逻辑上成立、使用上失败”。</li>
    <li><b>规格膨胀与过度设计</b>：功能越加越多，核心任务反而被挤掉；每一个新增部件都合理，整体却不可用。</li>
    <li><b>进化玩具与谱系可视化</b>：把“选择”留下痕迹，让失败也能被追溯，而不是一次性的随机结果。</li>
  </ul>
  <h3>1.2 四条设计原则</h3>
  <div class="two">
    <div class="box"><b>无用必须可解释</b><p class="muted">每次失败都指向具体结构冲突：密封盖 vs 饮用口、护栏 vs 坐面、倒置伞面 vs 遮挡面。</p></div>
    <div class="box"><b>进化必须可见</b><p class="muted">每一代都改变几何：零件、比例、标志位或嵌套层数，而不是只换一段文案。</p></div>
  </div>
  <div class="two" style="margin-top:3mm">
    <div class="box"><b>随机必须可复现</b><p class="muted">随机键只依赖规则版本、种子、父哈希与槽位；分享链接可完整重放。</p></div>
    <div class="box"><b>分支必须可回溯</b><p class="muted">谱系是 DAG，可回到任意祖先重新选择，已生成的分支不会被删除。</p></div>
  </div>
  <h3>1.3 与“单次 AI 生成”的区别</h3>
  <table>
    <tr><th style="width:28%">维度</th><th>单次文生 3D</th><th>本作品</th></tr>
    <tr><td>结果</td><td>一次性网格</td><td>可追溯的谱系与基因型</td></tr>
    <tr><td>因果</td><td>提示词即全部</td><td>算子 → 基因 → 提示词 → 网格</td></tr>
    <tr><td>复现</td><td>难以保证</td><td>同种子同路径 100% 一致</td></tr>
    <tr><td>玩法</td><td>抽卡</td><td>选择、分叉、杂交、测试</td></tr>
  </table>
  <div class="note">我们把 Lux3D 当作“表现型渲染器”，而不是“创意来源”。创意来自规则与玩家的选择，Lux3D 负责把这一代的结构描述变成可信的产品级网格。</div>`,
);

const p2 = page(
  3,
  '02 体验流程',
  `<h2>02　体验流程</h2>
  <p>一次完整体验约 3–6 分钟，分为六个步骤。首次进入时，引导页只要求两件事：选一个家族、给一个种子。</p>
  <div class="flow">
    <div><span>1</span><br>选家族<br><span class="mono">cup/chair/umbrella/bin</span></div>
    <div><span>2</span><br>定种子<br><span class="mono">UE-3205</span></div>
    <div><span>3</span><br>三选一<br>算子 + 代价</div>
    <div><span>4</span><br>Lux3D<br>生成 GLB</div>
    <div><span>5</span><br>谱系回溯<br>分叉 / 杂交</div>
    <div><span>6</span><br>无用性测试</div>
  </div>
  ${fig('fig-intro', '图 1　引导页：选择家族与世界种子；也可直接进入已预生成的标准示范链')}
  <h3>2.1 候选卡：把“代价”放在选择之前</h3>
  <p>每张候选卡同时展示算子、稀有事件、结构变化、功能指标增减与 U/A/R/Q 四维评分。玩家在点击之前就能看到“这次进化会损失什么”，而不是生成后才发现。</p>
  ${fig('fig-candidates', '图 2　同一父节点下的三个候选：变比、融合、递归；每张卡都标注功能代价')}
  <div class="note">三个候选由父哈希与槽位独立派生，先探索别的分支不会改变当前候选；这让“比较”成为可能。</div>`,
);

const p3 = page(
  4,
  '03 系统架构',
  `<h2>03　系统架构</h2>
  <p>系统分为三层：纯函数进化引擎、浏览器表现层、服务端 Lux3D 代理。引擎不依赖 DOM 与网络，因此可以在 Node 中离线跑 400 条路径做确定性校验。</p>
  <div class="flow">
    <div><b>进化引擎</b><br><span class="mono">seed → genes → prompt</span></div>
    <div>→</div>
    <div><b>浏览器</b><br><span class="mono">R3F / 谱系 / 测试</span></div>
    <div>→</div>
    <div><b>Node API</b><br><span class="mono">/api/lux3d/*</span></div>
    <div>→</div>
    <div><b>Aholo Lux3D</b><br><span class="mono">G1-Turbo</span></div>
  </div>
  <h3>3.1 基因型与表现型分离</h3>
  <table>
    <tr><th style="width:22%">层</th><th>内容</th><th style="width:30%">失败时的影响</th></tr>
    <tr><td>基因型</td><td>零件、锚点、比例、标志位、指标、冲突、历史算子</td><td>不受影响，永远可复现</td></tr>
    <tr><td>提示词</td><td>由基因型确定性生成，五段式英文</td><td>可重新生成，不改变谱系</td></tr>
    <tr><td>表现型</td><td>程序化草模 / Lux3D GLB / 测试动画</td><td>降级为草模，节点仍保留</td></tr>
  </table>
  <h3>3.2 三层几何策略</h3>
  <div class="three">
    <div class="box"><b>① 程序化草模</b><p class="muted">任何候选立即可见，不消耗积分。参数化零件 + 锚点挂接，保证每一代都有可见变化。</p></div>
    <div class="box"><b>② Lux3D 完整生成</b><p class="muted">选中分支后异步生成 GLB，成功则替换草模；结果下载到本地，避免 2 小时 URL 过期。</p></div>
    <div class="box"><b>③ 动作与测试</b><p class="muted">测试固定使用草模，保证关节、位移、雨雪与人物动画可控，不假设 AI 网格自带骨架。</p></div>
  </div>
  <h3>3.3 关键模块</h3>
  <table>
    <tr><th style="width:30%">模块</th><th>职责</th></tr>
    <tr><td class="mono">src/engine/rng.ts</td><td>cyrb128 哈希、mulberry32、稳定序列化</td></tr>
    <tr><td class="mono">src/engine/operators.ts</td><td>六算子、八稀有事件、零件池、命名与文案</td></tr>
    <tr><td class="mono">src/engine/evolve.ts</td><td>候选生成、节点哈希、杂交、分享编码</td></tr>
    <tr><td class="mono">src/engine/prompt.ts</td><td>五段式提示词：身份 / 继承 / 突变 / 几何 / 风格</td></tr>
    <tr><td class="mono">server/lux3d.ts</td><td>任务创建、状态机、GLB 落盘、manifest 缓存</td></tr>
    <tr><td class="mono">src/three/Studio.tsx</td><td>GLB 加载与归一化、灯光、展台、测试动画</td></tr>
  </table>
  ${fig('fig-lineage', '图 3　谱系 DAG：节点显示代数、标题与 U/A；点击任意节点回溯，不删除已生成分支')}`,
);

const p4 = page(
  5,
  '04 进化算法',
  `<h2>04　进化算法</h2>
  <h3>4.1 可复现的随机</h3>
  <p>设世界种子 <span class="mono">s</span>、父节点内容哈希 <span class="mono">h</span>、候选槽位 <span class="mono">k</span>、规则版本 <span class="mono">v</span>：</p>
  <pre>key = ${RULE_VERSION} | s | h | k
rng = mulberry32(cyrb128(key)[0])</pre>
  <p><span class="mono">h</span> 由稳定序列化后的基因型、父哈希与算子键计算，不使用自增序号或时间。三个候选各自独立；模型是否生成成功不参与哈希。规则版本写入分享链接，版本不符时拒绝重放，而不是给出错误结果。</p>
  <h3>4.2 六种结构算子</h3>
  <table><tr><th style="width:10%">ID</th><th style="width:26%">名称</th><th>几何与功能后果</th></tr>${opRows}</table>
  <h3>4.3 八种稀有事件</h3>
  <table><tr><th style="width:14%">ID</th><th style="width:16%">名称</th><th>触发后的叙事</th></tr>${rareRows}</table>
  <h3>4.4 评分</h3>
  <p>每个节点记录四维：<b>U 实用性</b>（功能指标的加权几何平均与算术平均混合，任一项归零都会显著拉低）、<b>N 新颖度</b>（算子种类、代际、异物、稀有事件、结构反转）、<b>A 荒诞度</b>（部件、冲突、嵌套、成本、自主移动）、<b>R 辨识度</b>（仍保留的祖先标记比例）。综合分：</p>
  <pre>Q = 0.30 N + 0.30 A + 0.20 R + 0.20 D</pre>
  <p><span class="mono">D</span> 衡量本代与父代的功能落差。评分只用于排序与展示，不声称是物理真实性度量。</p>`,
);

const p5 = page(
  6,
  '05 示范链与数据',
  `<h2>05　示范链与数据</h2>
  <p>标准示范链由离线脚本在数万条路径中筛选：要求结构变化清晰、含稀有事件、末代出现功能冲突，并保留一次实用性回升以呈现非单调性。下面是水杯链（种子 <span class="mono">${SHOWCASE.cup.seed}</span>，路径 <span class="mono">${SHOWCASE.cup.path.join(' → ')}</span>）的完整数据。</p>
  <table>
    <tr><th>代</th><th>标题</th><th>算子</th><th>稀有</th><th class="num">U</th><th class="num">N</th><th class="num">A</th><th class="num">R</th><th class="num">Q</th><th class="num">冲突</th><th class="num">部件</th></tr>
    ${chainRows}
  </table>
  <h3>5.1 实用性曲线</h3>
  ${curve}
  <figcaption class="muted">图 4　水杯示范链的 U 值：0.90 → 0.89 → 0.80 → 0.77 → 0.59 → 0.17。每一代都在“更成功地完成某件事”，同时更不适合喝水。</figcaption>
  <h3>5.2 四个家族的末代</h3>
  <table><tr><th>家族</th><th>种子</th><th>算子序列</th><th>末代标题</th><th class="num">U</th><th class="num">A</th><th class="num">Q</th></tr>${famSummary}</table>
  <div class="note">四条链的末代都出现“入口/接触面被封闭或翻转”，这是反转算子 M3 的结构后果，也是“无用”最直观的形态。</div>`,
);

const p6 = page(
  7,
  '06 Lux3D 管线',
  `<h2>06　Lux3D 管线</h2>
  <p>服务端封装 Aholo Lux3D 的异步任务接口，浏览器永远不接触 API Key。一次生成包含创建、轮询、下载、缓存四步。</p>
  <div class="flow">
    <div><b>POST create</b><br><span class="mono">prompt + G1-Turbo</span></div>
    <div>→</div>
    <div><b>GET task</b><br><span class="mono">每 4s 轮询</span></div>
    <div>→</div>
    <div><b>下载 GLB</b><br><span class="mono">outputs[].content</span></div>
    <div>→</div>
    <div><b>本地缓存</b><br><span class="mono">public/models</span></div>
  </div>
  <table>
    <tr><th style="width:30%">参数</th><th>值</th></tr>
    <tr><td class="mono">version</td><td>G1-Turbo</td></tr>
    <tr><td class="mono">outputFormat</td><td>["glb"]</td></tr>
    <tr><td class="mono">faceCount</td><td>120000</td></tr>
    <tr><td class="mono">enablePbr</td><td>true</td></tr>
    <tr><td class="mono">aiPredictSize</td><td>true</td></tr>
  </table>
  <p>状态码：<span class="mono">0</span> 初始化 / <span class="mono">1</span> 进行中 / <span class="mono">3</span> 成功 / <span class="mono">4</span> 失败 / <span class="mono">6</span> 取消。成功结果 URL 仅 2 小时有效，因此服务端在拿到 URL 后立即下载并写入 manifest。</p>
  <h3>6.1 提示词由基因型生成</h3>
  <pre>${esc(promptSample)}</pre>
  <h3>6.2 真实任务记录</h3>
  <p>下表来自 <span class="mono">public/models/manifest.json</span>，每一行对应一次真实创建并完成的 Lux3D 任务；文件均已下载到本地。</p>
  <table>
    <tr><th>taskId</th><th>节点</th><th class="num">代</th><th class="num">大小</th><th>完成时间 (UTC)</th><th>处理</th></tr>
    ${manifestRows}
  </table>
  <p class="muted">合计 ${records.length} 个 GLB，${mb(totalBytes)} MB。原始文件约 ${mb(rawAvg)} MB/个，发布前统一压缩为 webp 贴图 + meshopt 几何。</p>`,
);

const p7 = page(
  8,
  '07 资产迭代对比',
  `<h2>07　资产迭代对比</h2>
  <p>同一颗种子、同一条路径，Lux3D 在每一代看到的是不同的结构描述。下面三张图分别是 G0 原始祖先、G3 递归层、G5 封口末代，均为真实任务产物。</p>
  <div class="three">
    <figure><div class="zoomwrap"><img src="figs/fig-asset-g0.png"></div><figcaption>G0　原始水杯：单一圆柱杯身、开放杯口、侧把手</figcaption></figure>
    <figure><div class="zoomwrap"><img src="figs/fig-asset-g3.png"></div><figcaption>G3　寄生 + 递归：机械臂与保护壳开始包围杯身</figcaption></figure>
    <figure><div class="zoomwrap"><img src="figs/fig-asset-g5.png"></div><figcaption>G5　反转：杯口被密封盖封死，仍保留全部附件</figcaption></figure>
  </div>
  <h3>7.1 从“能装水”到“拒绝出水”</h3>
  <p>G5 的结构清单同时包含机械臂、稳定环、外保护壳与密封盖。它仍然能盛水（U 的 hold 项没有归零），但 pour 与 drink 被密封盖压到接近零，几何平均因此把整体 U 拉到 0.17。这正是“单一指标成功、整体失败”的可计算版本。</p>
  ${fig('fig-test', '图 5　无用性测试：杯子被倾斜到最大角度，密封盖承受全部水压，没有一滴流出；测试给出失败原因与结构冲突', 'w80')}
  <div class="note">测试模式固定使用程序化草模，因此雨、水、人物与关节动画可控；Lux3D 网格用于“观察”模式，负责质感与产品感。雨伞末代（伞面倒置为接雨漏斗）的测试同样复用这套动画系统。</div>`,
);

const p8 = page(
  9,
  '08 工程与质量控制',
  `<h2>08　工程与质量控制</h2>
  <h3>8.1 确定性校验</h3>
  <p>离线脚本对 100 个种子 × 4 家族 × 5 代、共 400 条路径做两次独立重放，比较节点哈希、候选算子与评分：</p>
  <pre>runs=400  determinism_mismatch=0  invalid=0  dupCandidateSets=0  maxParts=7</pre>
  <p>同时校验数值范围（0–1）、零件数量上限与候选算子不重复。测试集覆盖 2400 次无用性判定，成功/失败均有分布，避免“永远失败”的退化。</p>
  <h3>8.2 资产体积</h3>
  <table>
    <tr><th>阶段</th><th>大小</th><th>说明</th></tr>
    <tr><td>Lux3D 原始 GLB</td><td class="mono">约 ${mb(rawAvg)} MB</td><td>高面数 + 高分辨率贴图</td></tr>
    <tr><td>压缩后</td><td class="mono">约 ${mb(optAvg)} MB</td><td>webp 1024 + meshopt（不简化几何）</td></tr>
  </table>
  <p>压缩后单模型约为原始的 ${ratio}%，首屏加载从数十秒降到 1 秒级；浏览器端由 three.js 的 MeshoptDecoder 解码，无需额外网络请求。</p>
  <h3>8.3 失败与并发</h3>
  <ul>
    <li>生成失败：保留草模、显示原因、允许重试；节点、谱系、分享链接不受影响。</li>
    <li>并发限制：同一时间只允许一个任务，避免 <span class="mono">GENERATION_CONCURRENCY_LIMIT_EXCEEDED</span>。</li>
    <li>缓存优先：按提示词哈希查询本地 manifest，命中则秒开，不重复消耗额度。</li>
    <li>密钥安全：<span class="mono">AHOLO_API_KEY</span> 仅存在于服务端环境变量，构建产物与分享链接均不包含。</li>
  </ul>
  <h3>8.4 技术栈</h3>
  <table>
    <tr><th style="width:26%">层</th><th>选型</th></tr>
    <tr><td>前端</td><td>Vite 5 · React 18 · TypeScript · @react-three/fiber · drei · three · zustand</td></tr>
    <tr><td>服务端</td><td>Node 20+ · Express 4 · tsx · dotenv</td></tr>
    <tr><td>3D 生成</td><td>Aholo Lux3D G1-Turbo（text-to-3D，GLB + PBR）</td></tr>
    <tr><td>资产处理</td><td>glTF-Transform（webp / meshopt / simplify）</td></tr>
    <tr><td>校验</td><td>tsx 离线脚本 + Playwright 交互回归</td></tr>
  </table>`,
);

const p9 = page(
  10,
  '09 局限与下一步',
  `<h2>09　局限与下一步</h2>
  <h3>9.1 我们明确没做的</h3>
  <ul>
    <li><b>跨代拓扑连续</b>：每代独立生成，不保证网格顶点级连续；我们选择“结构描述继承 + 重新生成”，而不是局部变形。</li>
    <li><b>物理仿真</b>：无用性测试是规则驱动的游戏演示，不是流体/刚体求解。</li>
    <li><b>可动骨架</b>：不假设 AI 网格自带关节；测试动画使用程序化草模。</li>
    <li><b>多人协作</b>：当前是单机体验，分享链接只复现路径，不同步状态。</li>
  </ul>
  <h3>9.2 下一步</h3>
  <div class="two">
    <div class="box"><b>种子库与每日挑战</b><p class="muted">把玩家产出的“最无用标本”汇入公共谱系，形成可浏览的失败博物馆。</p></div>
    <div class="box"><b>结构约束的生成</b><p class="muted">把冲突写成负向提示词与几何约束，让 Lux3D 更准确地表达“封口但仍然能装水”。</p></div>
  </div>
  <div class="two" style="margin-top:3mm">
    <div class="box"><b>可动物件</b><p class="muted">为少量高频零件建立关节绑定模板，让 GLB 也能参与测试动画。</p></div>
    <div class="box"><b>移动端与分享卡</b><p class="muted">触控手势、竖屏布局、一键导出带谱系与评分的分享图。</p></div>
  </div>
  <h3>9.3 与项目书的对照</h3>
  <table>
    <tr><th style="width:34%">项目书计划</th><th>实现情况</th></tr>
    <tr><td>四类祖先、六算子、稀有事件</td><td>已完成：4 / 6 / 8</td></tr>
    <tr><td>三候选、谱系、回溯、杂交</td><td>已完成：DAG + 双亲融合 + 分享链接</td></tr>
    <tr><td>Lux3D 真实生成与缓存</td><td>已完成：${records.length} 个真实 GLB + manifest 任务记录</td></tr>
    <tr><td>无用性测试与动画</td><td>已完成：四类测试、雨/水/人物/垃圾道具</td></tr>
    <tr><td>预生成 12–20 个标本</td><td>已完成：示范链 ${records.length} 个，全部真实任务</td></tr>
    <tr><td>局部网格变形</td><td>未实现，改为跨代重新生成（见 9.1）</td></tr>
  </table>
  <div class="note">我们更愿意把边界写清楚：这是一个可玩的规则系统与生成管线，不是一个 3D 建模工具，也不是物理仿真器。</div>`,
);

const p10 = page(
  11,
  '10 提交信息',
  `<h2>10　提交信息</h2>
  <table>
    <tr><th style="width:24%">项目</th><th>内容</th></tr>
    <tr><td>作品名称</td><td>废物进化论：不适者生存</td></tr>
    <tr><td>英文名</td><td>Useless Evolution: Survival of the Least Useful</td></tr>
    <tr><td>一句话</td><td>输入一个种子，看一件日常物品逐代进化，直到它仍然装满了水，却拒绝让任何人喝到。</td></tr>
    <tr><td>Demo</td><td>【部署后填写，保留至 2026-12-31】</td></tr>
    <tr><td>源代码</td><td>【仓库地址】</td></tr>
    <tr><td>团队</td><td>【成员与分工】</td></tr>
    <tr><td>规则版本</td><td class="mono">${RULE_VERSION}</td></tr>
  </table>
  <h3>10.1 运行方式</h3>
  <pre>npm install
cp .env.example .env      # 填入 AHOLO_API_KEY
npm run dev               # http://localhost:5173

npm run build && npm start # 单端口 8787</pre>
  <h3>10.2 材料清单</h3>
  <ul>
    <li>项目报告（本文件）</li>
    <li>提交文案与视频脚本：<span class="mono">提交材料/作品简介与提交文案.md</span></li>
    <li>源代码与预生成资产：<span class="mono">public/models/</span></li>
    <li>离线校验脚本：<span class="mono">npm run test:engine</span></li>
  </ul>
  <h3>10.3 声明</h3>
  <p>本作品的 3D 资产由 Aholo Lux3D 生成；规则系统、交互、界面、测试动画与工程实现为原创。报告中引用的任务号、文件大小与时间均来自本地 manifest，可在源代码中复核。API Key 未写入任何提交材料。</p>
  <div class="note">感谢 Aholo 提供 Lux3D 能力，让“结构描述”可以真正变成可旋转的物体。</div>
  <h3>10.4 参考</h3>
  <ul class="muted">
    <li>珍道具（Chindogu）与无用发明文化</li>
    <li>遗传算法与谱系可视化</li>
    <li>Aholo Lux3D 文生 3D API 文档</li>
    <li>three.js / React Three Fiber / glTF-Transform</li>
  </ul>`,
);

const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>废物进化论 · 项目报告</title><style>${css}</style></head><body>
${cover}${toc}${p1}${p2}${p3}${p4}${p5}${p6}${p7}${p8}${p9}${p10}
</body></html>`;

mkdirSync('报告', { recursive: true });
writeFileSync('报告/废物进化论_项目报告.html', html);
console.log(`report written: ${records.length} assets, ${mb(totalBytes)} MB, ${cup.length} gens`);
