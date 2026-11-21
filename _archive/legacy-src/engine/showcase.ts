import type { EvolutionNode, FamilyId } from './types';
import { buildCandidates, createChild, makeRoot } from './evolve';

export interface Showcase {
  seed: string;
  path: number[];
  title: string;
  note: string;
}

/** 经离线筛选的标准示范链：结构变化清晰、含稀有事件、末代出现功能冲突。 */
export const SHOWCASE: Record<FamilyId, Showcase> = {
  cup: {
    seed: 'UE-3205',
    path: [2, 1, 0, 2, 1],
    title: '会越来越高效地阻止自己被使用的水杯',
    note: '寄生 → 增生 → 寄生 → 融合 → 反转；两次稀有事件，末代杯口封死。',
  },
  chair: {
    seed: 'UE-1840',
    path: [2, 1, 0, 2, 1],
    title: '先变舒服、再主动离开人类的椅子',
    note: '融合 → 增生 → 融合 → 变比 → 反转；中间代实用性回升，末代坐面翻转。',
  },
  umbrella: {
    seed: 'UE-1427',
    path: [1, 0, 2, 1, 0],
    title: '自己去找雨的雨伞',
    note: '增生 → 变比 → 融合 → 寄生 → 反转；递归与共生冲突，末代伞面倒置。',
  },
  bin: {
    seed: 'UE-1035',
    path: [2, 1, 0, 2, 1],
    title: '为了洁净而拒收垃圾的垃圾桶',
    note: '融合 → 寄生 → 增生 → 递归 → 反转；末代入口封闭。',
  },
};

export function showcaseChain(family: FamilyId): EvolutionNode[] {
  const cfg = SHOWCASE[family];
  let node = makeRoot(family, cfg.seed);
  const chain = [node];
  for (const slot of cfg.path) {
    const cands = buildCandidates(node, cfg.seed);
    const cand = cands[slot];
    if (!cand) break;
    node = createChild(node, cand);
    chain.push(node);
  }
  return chain;
}
