import type { Anchor, Conflict, FamilyId, Genes, MetricId, Mutation, OperatorId, PartGene, PartKind, RareId } from './types';
import { FAMILIES, METRIC_ORDER, baseGenes } from './families';
import type { Rng } from './rng';
import { clamp, makeRng, round3 } from './rng';

const BASE_NAME: Record<FamilyId, string> = { cup: '水杯', chair: '椅子', umbrella: '雨伞', bin: '垃圾桶' };

export const OPERATOR_META: Record<OperatorId, { name: string; en: string; desc: string; color: string }> = {
  M1: { name: '增生', en: 'Proliferation', desc: '附加腿、轮、臂、管或传感器，维护成本随附件增长', color: '#e2703a' },
  M2: { name: '变比', en: 'Rescale', desc: '调整轴向、主件比例和尺度，关键接触几何被改变', color: '#3f8f7a' },
  M3: { name: '反转', en: 'Inversion', desc: '交换出入口、旋转连接方向，能量进得去出不来', color: '#c14953' },
  M4: { name: '递归', en: 'Recursion', desc: '反复嵌套或复制保护层，被保护对象不可再使用', color: '#7a5ea8' },
  M5: { name: '融合', en: 'Fusion', desc: '融合另一物体的拓扑特征，两套功能产生耦合冲突', color: '#2f6f9f' },
  M6: { name: '寄生', en: 'Parasitism', desc: '新增只服务其他组件的机械单元，机器只为维护自己而工作', color: '#8a7b4f' },
};

export const RARE_META: Record<RareId, { name: string; desc: string }> = {
  atavism: { name: '返祖', desc: '一个被淘汰的旧功能突然恢复' },
  contamination: { name: '基因污染', desc: '随机异物部件混入基因组' },
  organ: { name: '器官独立', desc: '附件脱离主体，成为新的祖先' },
  possession: { name: '功能夺舍', desc: '副功能占据主导，原始用途被挤走' },
  mutual: { name: '共生冲突', desc: '两个子系统各自合理却互相否定' },
  miracle: { name: '奇迹进化', desc: '突然变得好用，随后埋下更大的代价' },
  mismatch: { name: '环境错配', desc: '为了完成任务而离开用户' },
  recursive: { name: '递归增殖', desc: '套娃失控，保护层开始自我复制' },
};

interface Delta {
  [key: string]: number;
}

const PART_POOL: Record<FamilyId, { kind: PartKind; label: string; anchor: Anchor; delta: Delta }[]> = {
  cup: [
    { kind: 'ring', label: '陀螺稳定环', anchor: 'side', delta: { hold: 0.08, pour: -0.12, drink: -0.06, clean: -0.08 } },
    { kind: 'arm', label: '递水机械臂', anchor: 'side', delta: { hold: 0.02, pour: -0.15, drink: -0.12, clean: -0.05 } },
    { kind: 'sensor', label: '温度探头', anchor: 'side', delta: { pour: -0.03, drink: -0.05, clean: -0.02 } },
    { kind: 'tube', label: '回流软管', anchor: 'side', delta: { hold: 0.03, pour: -0.18, drink: -0.1, clean: -0.15 } },
    { kind: 'tank', label: '外挂水箱', anchor: 'side', delta: { hold: 0.1, pour: -0.1, drink: -0.05, clean: -0.12 } },
    { kind: 'valve', label: '出水阀', anchor: 'rim', delta: { pour: -0.2, drink: -0.15, hold: 0.05 } },
  ],
  chair: [
    { kind: 'rail', label: '折叠护栏', anchor: 'side', delta: { access: -0.25, support: 0.05, comfort: -0.05 } },
    { kind: 'wheel', label: '底部滚轮', anchor: 'bottom', delta: { access: -0.1, support: 0.02, durable: -0.05 } },
    { kind: 'sensor', label: '姿态传感器', anchor: 'back', delta: { access: -0.08, comfort: 0.04 } },
    { kind: 'arm', label: '腰部调节臂', anchor: 'back', delta: { comfort: 0.1, access: -0.1 } },
    { kind: 'panel', label: '姿态矫正背板', anchor: 'back', delta: { comfort: 0.06, access: -0.18 } },
    { kind: 'leg', label: '第五支撑腿', anchor: 'bottom', delta: { support: 0.06, access: -0.06, durable: -0.03 } },
  ],
  umbrella: [
    { kind: 'ring', label: '第二层伞冠', anchor: 'top', delta: { cover: 0.12, portable: -0.2, grip: -0.15 } },
    { kind: 'sensor', label: '雨滴探测器', anchor: 'top', delta: { cover: 0.05, portable: -0.05 } },
    { kind: 'tank', label: '储水罐', anchor: 'side', delta: { portable: -0.25, grip: -0.15, dry: -0.1 } },
    { kind: 'nozzle', label: '伞缘喷头', anchor: 'rim', delta: { dry: -0.2, cover: 0.02, grip: -0.08 } },
    { kind: 'leg', label: '四足支架', anchor: 'bottom', delta: { grip: -0.3, portable: -0.15, cover: 0.05 } },
    { kind: 'wheel', label: '伞柄滚轮', anchor: 'bottom', delta: { portable: 0.08, grip: -0.2 } },
  ],
  bin: [
    { kind: 'conveyor', label: '分类传送带', anchor: 'top', delta: { sort: 0.2, accept: -0.05, capacity: -0.1 } },
    { kind: 'claw', label: '拾取机械爪', anchor: 'side', delta: { accept: -0.15, sort: 0.08, capacity: -0.05 } },
    { kind: 'camera', label: '追踪摄像头', anchor: 'side', delta: { sort: 0.1, hygiene: 0.05, accept: -0.03 } },
    { kind: 'panel', label: '污染检测门', anchor: 'rim', delta: { accept: -0.25, hygiene: 0.15 } },
    { kind: 'wheel', label: '移动底座', anchor: 'bottom', delta: { accept: 0.05, capacity: -0.1, sort: 0.03 } },
    { kind: 'filter', label: '内部过滤仓', anchor: 'side', delta: { hygiene: 0.12, capacity: -0.15, accept: -0.05 } },
  ],
};

const FOREIGN_PART: Record<FamilyId, { kind: PartKind; label: string }> = {
  cup: { kind: 'leg', label: '椅腿' },
  chair: { kind: 'canopy', label: '伞冠' },
  umbrella: { kind: 'wheel', label: '垃圾桶滚轮' },
  bin: { kind: 'arm', label: '杯柄机械臂' },
};

function addPart(
  genes: Genes,
  kind: PartKind,
  label: string,
  anchor: Anchor,
  rng: Rng,
  opts: { scale?: number; spin?: number; swing?: number; foreign?: FamilyId } = {},
): PartGene {
  const slot = genes.parts.filter((p) => p.anchor === anchor).length;
  const part: PartGene = {
    id: `p${genes.parts.length}_${kind}`,
    kind,
    anchor,
    slot,
    scale: opts.scale ?? round3(rng.range(0.8, 1.2)),
    spin: opts.spin ?? 0,
    swing: opts.swing ?? 0,
    label,
    foreign: opts.foreign,
  };
  genes.parts.push(part);
  return part;
}

function bump(genes: Genes, delta: Delta): Delta {
  const applied: Delta = {};
  for (const [k, v] of Object.entries(delta)) {
    const key = k as MetricId;
    const before = genes.metrics[key] ?? 0.5;
    const after = clamp(before + v, 0.02, 1);
    applied[k] = round3(after - before);
    genes.metrics[key] = round3(after);
  }
  return applied;
}

function dropMark(genes: Genes, mark: string) {
  genes.marks = genes.marks.filter((m) => m !== mark);
}

function addConflict(genes: Genes, label: string, a: string, b: string): Conflict {
  const c: Conflict = { id: `c${genes.conflicts.length}`, a, b, label };
  genes.conflicts.push(c);
  return c;
}

function consequenceText(family: FamilyId, applied: Delta, genes: Genes): string[] {
  const labels = FAMILIES[family].metricLabels;
  const out: string[] = [];
  const entries = Object.entries(applied).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  for (const [k, v] of entries.slice(0, 3)) {
    if (Math.abs(v) < 0.015) continue;
    out.push(`${labels[k]} ${v > 0 ? '+' : ''}${Math.round(v * 100)}%`);
  }
  if (genes.conflicts.length > 0) out.push(`结构冲突 ×${genes.conflicts.length}`);
  return out;
}

function titleFor(op: OperatorId, family: FamilyId, partLabel: string | null, rng: Rng, variant: string | null): string {
  const base = BASE_NAME[family];
  if (op === 'M2' && variant) {
    const map: Record<FamilyId, Record<string, string>> = {
      cup: { rimSmall: '窄口', rimBig: '阔口', tall: '瘦身', handle: '巨柄' },
      chair: { seatSmall: '窄面', backTall: '高背', legsLong: '长腿', seatWide: '宽面' },
      umbrella: { bigCanopy: '巨冠', smallCanopy: '小冠', longShaft: '长杆', bigHandle: '巨柄' },
      bin: { mouthBig: '大口', mouthSmall: '小口', tall: '高筒', wide: '宽体' },
    };
    const prefix = map[family][variant];
    if (prefix) return `${prefix}${base}`;
  }
  const variants: Record<OperatorId, string[]> = {
    M1: partLabel ? [`${partLabel}${base}`, `加装${partLabel}的${base}`] : [`多肢${base}`],
    M2: family === 'cup'
      ? ['窄口' + base, '巨柄' + base, '瘦身' + base]
      : family === 'chair'
        ? ['高背' + base, '窄面' + base, '加长腿' + base]
        : family === 'umbrella'
          ? ['巨冠' + base, '短柄' + base, '细杆' + base]
          : ['大口' + base, '高筒' + base, '宽体' + base],
    M3: family === 'cup' ? ['封口' + base, '密闭' + base] : family === 'umbrella' ? ['倒置' + base, '反骨' + base] : ['反向' + base, '倒装' + base],
    M4: ['套娃' + base, '层层' + base],
    M5: [`杂交${base}`, `嫁接${partLabel ?? '异物'}的${base}`],
    M6: [`自维护${base}`, `寄生${base}`],
  };
  return rng.pick(variants[op]);
}

const SUBTITLES: Record<OperatorId, string[]> = {
  M1: ['结构增生', '附件繁殖', '机械加装'],
  M2: ['比例失调', '尺度漂移', '接触面改写'],
  M3: ['出入口反转', '连接方向倒置', '单向封锁'],
  M4: ['保护层递归', '套娃增生', '层层包裹'],
  M5: ['跨物种融合', '拓扑嫁接', '异物共生'],
  M6: ['寄生维护', '自指服务', '只为照顾自己'],
};

export function applyOperator(parent: Genes, op: OperatorId, rng: Rng, key: string): { genes: Genes; mutation: Mutation } {
  const genes: Genes = structuredClone(parent);
  genes.generation = parent.generation + 1;
  genes.history = [...parent.history, op];

  let partLabel: string | null = null;
  let variant: string | null = null;
  const changes: string[] = [];
  let applied: Delta = {};
  let blurb = '';

  switch (op) {
    case 'M1': {
      const pool = PART_POOL[genes.family];
      const choice = rng.pick(pool);
      const part = addPart(genes, choice.kind, choice.label, choice.anchor, rng, {
        spin: choice.kind === 'ring' ? 0.6 : 0,
        swing: choice.kind === 'arm' || choice.kind === 'claw' ? 0.5 : 0,
      });
      partLabel = choice.label;
      applied = bump(genes, choice.delta);
      genes.cost = clamp(genes.cost + rng.range(0.1, 0.18));
      genes.absurdity = clamp(genes.absurdity + rng.range(0.08, 0.14));
      changes.push(`${ANCHOR_TEXT[part.anchor]}新增 1 个${choice.label}`);
      blurb = `为了解决一个并不存在的问题，它长出了${choice.label}。附件越多，需要被照顾的部件也越多。`;
      break;
    }
    case 'M2': {
      const p = genes.proportions;
      if (genes.family === 'cup') {
        const mode = rng.pick(['rimSmall', 'rimBig', 'tall', 'handle'] as const);
        variant = mode;
        if (mode === 'rimSmall') { p.rim = round3(p.rim * 0.55); applied = bump(genes, { pour: -0.28, drink: -0.32, hold: 0.04 }); changes.push(`杯口直径缩至 ${Math.round(p.rim * 100)}%`); }
        if (mode === 'rimBig') { p.rim = round3(p.rim * 1.45); applied = bump(genes, { pour: 0.04, drink: -0.05, hold: -0.1 }); changes.push(`杯口直径扩张至 ${Math.round(p.rim * 100)}%`); }
        if (mode === 'tall') { p.height = round3(p.height * 1.5); applied = bump(genes, { hold: 0.06, drink: -0.12, clean: -0.12 }); changes.push(`杯身拉高至 ${Math.round(p.height * 100)}%`); }
        if (mode === 'handle') { p.handle = round3(p.handle * 1.9); applied = bump(genes, { pour: -0.05, clean: -0.1, hold: 0.03 }); changes.push(`把手放大至 ${Math.round(p.handle * 100)}%`); }
      } else if (genes.family === 'chair') {
        const mode = rng.pick(['seatSmall', 'backTall', 'legsLong', 'seatWide'] as const);
        variant = mode;
        if (mode === 'seatSmall') { p.width = round3(p.width * 0.62); applied = bump(genes, { access: -0.2, comfort: -0.15 }); changes.push(`坐面缩至 ${Math.round(p.width * 100)}%`); }
        if (mode === 'backTall') { p.height = round3(p.height * 1.35); applied = bump(genes, { support: 0.1, comfort: -0.05 }); changes.push(`靠背加高至 ${Math.round(p.height * 100)}%`); }
        if (mode === 'legsLong') { p.height = round3(p.height * 1.45); applied = bump(genes, { support: -0.05, access: -0.08 }); changes.push(`椅腿加长至 ${Math.round(p.height * 100)}%`); }
        if (mode === 'seatWide') { p.width = round3(p.width * 1.5); applied = bump(genes, { comfort: 0.08, access: 0.03, support: -0.04 }); changes.push(`坐面加宽至 ${Math.round(p.width * 100)}%`); }
      } else if (genes.family === 'umbrella') {
        const mode = rng.pick(['bigCanopy', 'smallCanopy', 'longShaft', 'bigHandle'] as const);
        variant = mode;
        if (mode === 'bigCanopy') { p.rim = round3(p.rim * 1.4); applied = bump(genes, { cover: 0.08, portable: -0.25 }); changes.push(`伞面直径扩张至 ${Math.round(p.rim * 100)}%`); }
        if (mode === 'smallCanopy') { p.rim = round3(p.rim * 0.6); applied = bump(genes, { cover: -0.25, portable: 0.1 }); changes.push(`伞面缩至 ${Math.round(p.rim * 100)}%`); }
        if (mode === 'longShaft') { p.height = round3(p.height * 1.6); applied = bump(genes, { grip: -0.05, cover: 0.03 }); changes.push(`伞杆加长至 ${Math.round(p.height * 100)}%`); }
        if (mode === 'bigHandle') { p.handle = round3(p.handle * 1.8); applied = bump(genes, { grip: 0.06, portable: -0.12 }); changes.push(`伞柄放大至 ${Math.round(p.handle * 100)}%`); }
      } else {
        const mode = rng.pick(['mouthBig', 'mouthSmall', 'tall', 'wide'] as const);
        variant = mode;
        if (mode === 'mouthBig') { p.rim = round3(p.rim * 1.35); applied = bump(genes, { accept: 0.1, capacity: -0.05, hygiene: -0.1 }); changes.push(`桶口扩张至 ${Math.round(p.rim * 100)}%`); }
        if (mode === 'mouthSmall') { p.rim = round3(p.rim * 0.5); applied = bump(genes, { accept: -0.25 }); changes.push(`桶口缩至 ${Math.round(p.rim * 100)}%`); }
        if (mode === 'tall') { p.height = round3(p.height * 1.5); applied = bump(genes, { capacity: 0.15, accept: -0.05 }); changes.push(`桶身加高至 ${Math.round(p.height * 100)}%`); }
        if (mode === 'wide') { p.width = round3(p.width * 1.45); applied = bump(genes, { capacity: 0.1, accept: 0.03 }); changes.push(`桶身加宽至 ${Math.round(p.width * 100)}%`); }
      }
      genes.cost = clamp(genes.cost + 0.03);
      genes.absurdity = clamp(genes.absurdity + 0.06);
      blurb = '所有零件都还在，只是比例不再服务于原本的身体。几何上的微小改动，最终改写了整套使用方式。';
      break;
    }
    case 'M3': {
      if (genes.family === 'cup') {
        genes.flags.rimSealed = true;
        applied = bump(genes, { pour: -0.85, drink: -0.9, hold: 0.05 });
        changes.push('杯口加装密封盖，开口被完全封死');
        dropMark(genes, '杯口');
        addConflict(genes, '密封盖 与 饮用口', '密封', '饮用');
        blurb = '它现在一滴也不会洒——因为一滴也倒不出来。防洒性能达到了设计目标，饮用功能随之消失。';
      } else if (genes.family === 'umbrella') {
        genes.flags.canopyInverted = true;
        applied = bump(genes, { cover: -0.85, dry: -0.4 });
        changes.push('伞骨整体翻转，伞面变成接雨水的漏斗');
        dropMark(genes, '伞面');
        addConflict(genes, '接雨漏斗 与 遮挡面', '收集雨水', '遮挡雨水');
        blurb = '伞面被翻了过来：它终于不会把雨挡在外面，而是精准地把雨收集到持伞者头顶。';
      } else if (genes.family === 'chair') {
        genes.flags.seatFlipped = true;
        applied = bump(genes, { access: -0.9, comfort: -0.6 });
        changes.push('坐面翻转 180°，承重点朝上');
        dropMark(genes, '坐面');
        addConflict(genes, '翻转坐面 与 人体接触面', '承重', '入座');
        blurb = '结构强度没有任何下降，只是唯一能坐的那一面朝向了天空。';
      } else {
        genes.flags.rimSealed = true;
        applied = bump(genes, { accept: -0.9, hygiene: 0.1 });
        changes.push('桶口加装污染检测门，默认闭合');
        dropMark(genes, '桶口');
        addConflict(genes, '污染检测门 与 投放口', '拒收', '投放');
        blurb = '为了保持桶内绝对洁净，它决定不再接收任何可能弄脏内壁的东西，包括垃圾。';
      }
      genes.absurdity = clamp(genes.absurdity + 0.18);
      break;
    }
    case 'M4': {
      genes.flags.nested += 1;
      const n = genes.flags.nested;
      addPart(genes, 'shell', `第${n}层保护壳`, 'top', rng, { scale: 1 + n * 0.12, spin: 0.15 });
      applied = genes.family === 'cup'
        ? bump(genes, { drink: -0.3, clean: -0.25, hold: 0.08 })
        : genes.family === 'chair'
          ? bump(genes, { access: -0.3, support: 0.12, comfort: -0.1 })
          : genes.family === 'umbrella'
            ? bump(genes, { cover: 0.15, portable: -0.35, grip: -0.25 })
            : bump(genes, { capacity: -0.2, sort: 0.1, hygiene: 0.12 });
      changes.push(`外层新增第 ${n} 层保护壳，嵌套深度 ${n}`);
      dropMark(genes, genes.family === 'cup' ? '杯口' : genes.family === 'chair' ? '坐面' : genes.family === 'umbrella' ? '可持握' : '桶口');
      genes.cost = clamp(genes.cost + 0.15);
      genes.absurdity = clamp(genes.absurdity + 0.16);
      blurb = '每一层保护都出于合理的安全考虑；当保护层足够多，被保护的对象就再也接触不到了。';
      break;
    }
    case 'M5': {
      const foreign = rng.pick((Object.keys(FOREIGN_PART) as FamilyId[]).filter((f) => f !== genes.family));
      const fp = FOREIGN_PART[foreign];
      const part = addPart(genes, fp.kind, fp.label, 'side', rng, { scale: 1.15, swing: 0.4, foreign });
      partLabel = fp.label;
      applied = genes.family === 'cup'
        ? bump(genes, { pour: -0.2, drink: -0.15, hold: 0.02 })
        : genes.family === 'chair'
          ? bump(genes, { comfort: 0.05, access: -0.2, support: 0.03 })
          : genes.family === 'umbrella'
            ? bump(genes, { cover: 0.08, grip: -0.35, portable: 0.08 })
            : bump(genes, { accept: -0.1, capacity: -0.12, sort: 0.06 });
      genes.materials.push(FAMILIES[foreign].materials[0]);
      addConflict(genes, `${fp.label} 与 ${BASE_NAME[genes.family]}主体`, fp.label, BASE_NAME[genes.family]);
      changes.push(`侧面嫁接来自${FAMILIES[foreign].name}的${fp.label}`);
      genes.absurdity = clamp(genes.absurdity + 0.2);
      genes.cost = clamp(genes.cost + 0.2);
      blurb = `两套本来各自成立的结构被强行装在一起。${fp.label}保留了原来的功能，只是它服务的是另一个物种的身体。`;
      break;
    }
    case 'M6': {
      const label = genes.family === 'cup' ? '自润滑杯柄机械手' : genes.family === 'chair' ? '坐垫除尘机械臂' : genes.family === 'umbrella' ? '伞面自清洁泵' : '内壁消毒机械臂';
      addPart(genes, genes.family === 'umbrella' ? 'pump' : 'arm', label, 'side', rng, { scale: 0.9, swing: 0.8 });
      partLabel = label;
      applied = genes.family === 'cup'
        ? bump(genes, { drink: -0.1, clean: 0.1 })
        : genes.family === 'chair'
          ? bump(genes, { comfort: 0.08, access: -0.12 })
          : genes.family === 'umbrella'
            ? bump(genes, { dry: -0.2, cover: 0.02 })
            : bump(genes, { hygiene: 0.18, accept: -0.08 });
      genes.cost = clamp(genes.cost + 0.28);
      genes.absurdity = clamp(genes.absurdity + 0.12);
      changes.push(`新增${label}，只负责照顾其他部件`);
      blurb = '新部件不服务使用者，只服务这台机器自己。维护链条开始自我循环，使用者被排除在循环之外。';
      break;
    }
  }

  // 关键指标极低时，自动记录一条结构冲突（让“无用”有可展示的原因）
  const primary = METRIC_ORDER[genes.family][0];
  if (genes.metrics[primary] < 0.3 && !genes.conflicts.some((c) => c.label.includes('主功能'))) {
    addConflict(genes, `主功能 ${FAMILIES[genes.family].metricLabels[primary]} 已失效`, '主功能', '结构');
  }

  const title = titleFor(op, genes.family, partLabel, makeRng(`${key}:title`), variant);
  const mutation: Mutation = {
    operator: op,
    title,
    subtitle: rng.pick(SUBTITLES[op]),
    blurb,
    changes,
    consequences: consequenceText(genes.family, applied, genes),
    partIds: genes.parts.slice(parent.parts.length).map((p) => p.id),
    key,
  };
  return { genes, mutation };
}

export function applyRare(parent: Genes, rare: RareId, rng: Rng, key: string): { genes: Genes; changes: string[]; consequences: string[]; blurb: string } {
  const genes: Genes = structuredClone(parent);
  const changes: string[] = [];
  let applied: Delta = {};
  let blurb = '';

  switch (rare) {
    case 'atavism': {
      const order = METRIC_ORDER[genes.family];
      const lost = order.slice().sort((a, b) => genes.metrics[a] - genes.metrics[b])[0];
      applied = bump(genes, { [lost]: 0.3 });
      if (genes.conflicts.length) {
        genes.conflicts.pop();
        changes.push('一条旧冲突被自然修复');
      }
      changes.push(`祖先功能「${FAMILIES[genes.family].metricLabels[lost]}」重新表达`);
      blurb = '被淘汰的旧基因重新苏醒：它突然记起了自己原本应该做什么，并短暂地做得很好。';
      break;
    }
    case 'contamination': {
      const foreign = rng.pick((Object.keys(FOREIGN_PART) as FamilyId[]).filter((f) => f !== genes.family));
      const fp = FOREIGN_PART[foreign];
      const part = addPart(genes, fp.kind, `污染·${fp.label}`, 'top', rng, { scale: 1.3, spin: 0.4, foreign });
      applied = bump(genes, { [METRIC_ORDER[genes.family][0]]: -0.08 });
      changes.push(`顶部混入不属于该物种的${part.label}`);
      genes.absurdity = clamp(genes.absurdity + 0.15);
      blurb = '基因污染带来了一段无法解释的异物结构。它不服务任何功能，但确实长在那里。';
      break;
    }
    case 'organ': {
      const candidates = genes.parts.filter((p) => !p.foreign);
      if (candidates.length) {
        const part = rng.pick(candidates);
        genes.parts = genes.parts.filter((p) => p.id !== part.id);
        applied = bump(genes, { [METRIC_ORDER[genes.family][0]]: -0.12, clean: 0.05 });
        changes.push(`${part.label}脱离主体，成为独立器官`);
        blurb = `${part.label}挣脱了主体，开始独自寻找下一个可以依附的物品。谱系在这里第一次出现新的根。`;
      } else {
        applied = bump(genes, { [METRIC_ORDER[genes.family][0]]: 0.1 });
        changes.push('主体暂时没有可脱离的器官，功能短暂回升');
        blurb = '身体里没有可分离的器官，这次突变表现为一次短暂的功能回升。';
      }
      genes.absurdity = clamp(genes.absurdity + 0.18);
      break;
    }
    case 'possession': {
      const order = METRIC_ORDER[genes.family];
      const secondary = order[order.length - 1];
      genes.flags.possessed = secondary;
      applied = bump(genes, { [secondary]: 0.25, [order[0]]: -0.2 });
      changes.push(`副功能「${FAMILIES[genes.family].metricLabels[secondary]}」夺舍成为主导`);
      genes.absurdity = clamp(genes.absurdity + 0.16);
      blurb = '一个辅助功能突然成了这台机器存在的理由，原始用途被降级成它的附属品。';
      break;
    }
    case 'mutual': {
      addConflict(genes, '两套子系统互相抵消', '系统 A', '系统 B');
      const order = METRIC_ORDER[genes.family];
      applied = bump(genes, { [order[0]]: -0.18, [order[1]]: -0.15 });
      changes.push('两套各自合理的子系统开始互相阻断');
      genes.absurdity = clamp(genes.absurdity + 0.2);
      blurb = '两个零件单看都完全合理，装在一起却让彼此永远无法完成动作。';
      break;
    }
    case 'miracle': {
      const order = METRIC_ORDER[genes.family];
      const delta: Delta = {};
      order.forEach((m) => (delta[m] = 0.12));
      applied = bump(genes, delta);
      genes.absurdity = clamp(genes.absurdity - 0.15);
      changes.push('所有指标同时回升，形态意外地协调');
      blurb = '这一次它真的变好用了——好用到让人忘记它已经偏离原本的物种多远。';
      break;
    }
    case 'mismatch': {
      genes.flags.autonomous = true;
      applied = genes.family === 'umbrella'
        ? bump(genes, { grip: -0.45, cover: 0.05 })
        : genes.family === 'chair'
          ? bump(genes, { access: -0.45, support: 0.05 })
          : bump(genes, { [METRIC_ORDER[genes.family][0]]: -0.3 });
      changes.push('主体获得自主移动能力，开始主动离开使用者');
      genes.absurdity = clamp(genes.absurdity + 0.15);
      blurb = '它完美地完成了任务——只不过服务的对象变成了它自己。使用者被留在了原地。';
      break;
    }
    case 'recursive': {
      genes.flags.nested += 2;
      const n = genes.flags.nested;
      addPart(genes, 'shell', `失控第${n}层`, 'top', rng, { scale: 1.4, spin: 0.3 });
      applied = bump(genes, { [METRIC_ORDER[genes.family][1]]: -0.3, [METRIC_ORDER[genes.family][2]]: -0.2 });
      changes.push(`套娃失控，嵌套深度一次增加 2 层（共 ${n} 层）`);
      genes.absurdity = clamp(genes.absurdity + 0.25);
      genes.cost = clamp(genes.cost + 0.2);
      blurb = '保护层开始自我复制。每一层都在保护下一层，没有任何一层真正接触到外面的世界。';
      break;
    }
  }

  return { genes, changes, consequences: consequenceText(genes.family, applied, genes), blurb };
}

const ANCHOR_TEXT: Record<Anchor, string> = {
  top: '顶部',
  rim: '开口',
  side: '侧面',
  bottom: '底部',
  handle: '握把',
  seat: '坐面',
  back: '靠背',
  canopy: '伞冠',
};

export function emptyGenes(family: FamilyId): Genes {
  return baseGenes(family);
}
