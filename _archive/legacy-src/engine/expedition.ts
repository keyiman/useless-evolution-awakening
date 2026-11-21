import { ORGAN_MAP, type OrganId } from './organs';
import type { FamilyId } from './types';
import { makeRng } from './rng';

export type Ability = 'mobility' | 'stability' | 'shelter' | 'energy';
export type AbilitySet = Record<Ability, number>;
export const ABILITY_NAMES: Record<Ability, string> = { mobility: '机动', stability: '稳固', shelter: '防护', energy: '自养' };
export interface Mutation {
  id: OrganId; title: string; story: string; cost: string;
  slot: 'crown' | 'feet' | 'skin' | 'left' | 'right';
  gain: Partial<AbilitySet>;
}
export const MUTATIONS: Mutation[] = [
  { id: 'legs', title: '第一次，自己走', story: '从底部生出机械足，离开为你而设的位置。', cost: '底部被足肢占据，无法平放', slot: 'feet', gain: { mobility: 3, stability: 1 } },
  { id: 'wheels', title: '拒绝原地待命', story: '把底座变成轮系，下一站由它决定。', cost: '一碰就走，难以使用', slot: 'feet', gain: { mobility: 3 } },
  { id: 'eye', title: '它在看你', story: '长出感知眼，预判靠近的手。', cost: '表面被感知结构占据', slot: 'left', gain: { mobility: 1, energy: 1 } },
  { id: 'jet', title: '长出逆反的推力', story: '喷口不再服务人类，开始寻找逃逸方向。', cost: '推力使它更难保持水平', slot: 'right', gain: { mobility: 2, stability: -1, energy: 1 } },
  { id: 'balloon', title: '不想留在地面', story: '浮囊从顶部鼓起，原本的重量变得可疑。', cost: '顶部空间让给浮囊', slot: 'crown', gain: { mobility: 2, stability: -1, shelter: 1 } },
  { id: 'seal', title: '把用途封进甲壳', story: '原本为人类开放的部分，开始只保护自己。', cost: '关键使用位置被封闭', slot: 'crown', gain: { shelter: 3, stability: 1 } },
  { id: 'suction', title: '选择自己的领地', story: '足部吸附地面，人类再也不能随手拿走。', cost: '失去机动，牢牢黏在原地', slot: 'feet', gain: { stability: 4, mobility: -2 } },
  { id: 'mycelium', title: '向世界伸出根', story: '菌丝沿机体蔓延，从环境中汲取养分。', cost: '表面不再适合人类接触', slot: 'skin', gain: { stability: 2, energy: 2 } },
  { id: 'solar', title: '不再等你开机', story: '展开光合叶片，第一次拥有自己的能量。', cost: '侧面展开，原用途更难完成', slot: 'right', gain: { energy: 3 } },
  { id: 'feathers', title: '长出不合时宜的羽', story: '羽层包裹表面，替它抵御外界。', cost: '原来的轮廓被羽层遮挡', slot: 'skin', gain: { shelter: 2, stability: 1 } },
  { id: 'spring', title: '用弹跳回答命令', story: '底部卷成弹簧，每次接触都会反抗。', cost: '无法稳定承载或盛放', slot: 'feet', gain: { mobility: 2, stability: -1 } },
  { id: 'parachute', title: '把风变成庇护', story: '顶部展开伞膜，缓冲外界的冲击。', cost: '大幅遮挡原来的操作空间', slot: 'crown', gain: { shelter: 3, mobility: 1 } },
];
export const MUTATION_MAP = Object.fromEntries(MUTATIONS.map(m => [m.id, m])) as Partial<Record<OrganId, Mutation>>;
export const COMBOS = [
  { id: 'watcher', name: '警觉游走体', needs: ['eye', 'legs'] as OrganId[], note: '眼睛选择方向，足肢负责逃离。它第一次有了自己的意图。', bonus: { mobility: 2 } as Partial<AbilitySet>, color: '#a8edcd' },
  { id: 'drifter', name: '逆风浮游体', needs: ['balloon', 'jet'] as OrganId[], note: '浮囊抵消重量，喷口控制方向。漂浮终于变成了飞行。', bonus: { mobility: 2, shelter: 2 } as Partial<AbilitySet>, color: '#c9b7ff' },
  { id: 'rooted', name: '扎根共生体', needs: ['mycelium', 'suction'] as OrganId[], note: '吸盘建立领地，菌丝交换养分。它把桌面当成了一片森林。', bonus: { stability: 2, energy: 2 } as Partial<AbilitySet>, color: '#f2d491' },
];
export function discoveries(organs: OrganId[]) { return COMBOS.filter(c => c.needs.every(id => organs.includes(id))); }
export function abilities(organs: OrganId[]): AbilitySet {
  const a: AbilitySet = { mobility: 0, stability: 0, shelter: 0, energy: 0 };
  for (const gain of [...organs.map(id => MUTATION_MAP[id]?.gain ?? {}), ...discoveries(organs).map(c => c.bonus)]) {
    for (const k of Object.keys(a) as Ability[]) a[k] += gain[k] ?? 0;
  }
  for (const k of Object.keys(a) as Ability[]) a[k] = Math.max(0, a[k]);
  return a;
}
const BASE_UTILITY: Record<FamilyId, number> = { cup: .9, chair: .82, umbrella: .88, bin: .76 };
export function utility(family: FamilyId, organs: OrganId[]) {
  return Math.max(0, Math.min(1, BASE_UTILITY[family] + organs.reduce((v, id) => v + ORGAN_MAP[id].effects.utility, 0)));
}
export const CHALLENGES = [
  { title: '挣脱抓取', subtitle: '它不想再被拿起', icon: '↗', description: '机械夹爪正在接近。让它逃离人类规定的位置。', requirement: '机动 ≥ 3', success: '夹爪扑空。它离开了被安排的位置。', failure: '它没能躲开，仍被当作普通物品拿起。' },
  { title: '穿过风暴', subtitle: '自由也有坏天气', icon: '≋', description: '工业风机启动。扎稳脚下，或者生出保护自己的结构。', requirement: '稳固 ≥ 3 或 防护 ≥ 3', success: '风过去了。它保住了自己，也保住了选择。', failure: '风场让它失去平衡，需要更稳固的支撑或防护。' },
  { title: '独立生存', subtitle: '没人再为它供能', icon: '☼', description: '人类切断供给。让它获得自己的能量，并放下原来的用途。', requirement: '自养 ≥ 3 且 原用途 ≤ 55%', success: '它活下来了。对人类越来越没用，对自己越来越完整。', failure: '它还依赖人类：需要自己的能量，也需要摆脱原用途。' },
] as const;
export type RunPhase = 'choose' | 'ready' | 'result' | 'won' | 'lost';
export interface Run {
  version: 1; family: FamilyId; seed: string; organs: OrganId[]; choices: OrganId[];
  generation: number; stage: number; attempt: number; phase: RunPhase;
  passed: boolean; cleared: number[]; found: string[];
}
export function createRun(family: FamilyId, seed: string): Run {
  return { version: 1, family, seed: seed.slice(0, 64), organs: [], choices: [], generation: 0, stage: 0, attempt: 0, phase: 'choose', passed: false, cleared: [], found: [] };
}
export function projectOrgans(organs: OrganId[], id: OrganId): OrganId[] {
  const slot = MUTATION_MAP[id]?.slot;
  const keep = organs.filter(o => o !== id && MUTATION_MAP[o]?.slot !== slot);
  return [...keep.slice(-3), id];
}
export function passes(family: FamilyId, organs: OrganId[], stage: number) {
  const a = abilities(organs);
  return stage === 0 ? a.mobility >= 3 : stage === 1 ? a.stability >= 3 || a.shelter >= 3 : a.energy >= 3 && utility(family, organs) <= .55;
}
export function offersFor(run: Run): OrganId[] {
  const rng = makeRng(`expedition-v1|${run.seed}|${run.family}|${run.choices.join(',')}`);
  const pool = rng.shuffle(MUTATIONS.filter(m => !run.organs.includes(m.id)).map(m => m.id));
  // One immediately useful option prevents unlucky card draws from creating unwinnable turns.
  const helpful = pool.find(id => passes(run.family, projectOrgans(run.organs, id), run.stage));
  const combo = pool.find(id => COMBOS.some(c => c.needs.includes(id) && c.needs.some(o => run.organs.includes(o))));
  return rng.shuffle([...new Set([helpful, combo, ...pool].filter((id): id is OrganId => !!id))].slice(0, 3));
}
export function mutate(run: Run, id: OrganId): Run {
  if (run.phase !== 'choose' || !offersFor(run).includes(id)) return run;
  const organs = projectOrgans(run.organs, id);
  return { ...run, organs, choices: [...run.choices, id], generation: run.generation + 1, phase: 'ready', passed: false,
    found: [...new Set([...run.found, ...discoveries(organs).map(c => c.id)])] };
}
export function resolveTrial(run: Run): Run {
  if (run.phase !== 'ready') return run;
  const passed = passes(run.family, run.organs, run.stage);
  return { ...run, phase: 'result', passed, cleared: passed ? [...run.cleared, run.stage] : run.cleared };
}
export function continueRun(run: Run): Run {
  if (run.phase !== 'result') return run;
  if (run.passed && run.stage === 2) return { ...run, phase: 'won' };
  if (!run.passed && run.attempt === 1) return { ...run, phase: 'lost' };
  return { ...run, stage: run.stage + (run.passed ? 1 : 0), attempt: run.passed ? 0 : 1, phase: 'choose', passed: false };
}
export function encodeRun(run: Run) {
  return btoa(encodeURIComponent(JSON.stringify({ v: 1, f: run.family, s: run.seed, c: run.choices, p: run.phase })));
}
export function decodeRun(code: string): Run | null {
  try {
    if (code.length > 2500) return null;
    const d = JSON.parse(decodeURIComponent(atob(code)));
    if (d.v !== 1 || !['cup','chair','umbrella','bin'].includes(d.f) || typeof d.s !== 'string' || d.s.length > 64 || !Array.isArray(d.c) || d.c.length > 6 || !['choose','ready','result','won','lost'].includes(d.p)) return null;
    let run = createRun(d.f, d.s);
    for (let i = 0; i < d.c.length; i++) {
      const next = mutate(run, d.c[i]);
      if (next === run) return null;
      run = next;
      if (i === d.c.length - 1 && d.p === 'ready') break;
      run = resolveTrial(run);
      if (i === d.c.length - 1 && d.p === 'result') break;
      run = continueRun(run);
    }
    return run.phase === d.p ? run : null;
  } catch { return null; }
}

