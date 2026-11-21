import type { FamilyId, FamilyMeta, Genes, MetricId } from './types';

export const FAMILIES: Record<FamilyId, FamilyMeta> = {
  cup: {
    id: 'cup',
    name: '水杯',
    en: 'Cup',
    emoji: '🥛',
    tagline: '从盛水到拒绝出水',
    basePrompt:
      'a single white ceramic drinking cup with one curved handle and an open circular rim, simple cylindrical body, matte ceramic, product photography',
    marks: ['杯身', '杯口', '把手', '陶瓷'],
    materials: ['白陶瓷', '釉面'],
    metricLabels: { hold: '盛水', pour: '倒出', drink: '饮用', clean: '清洗' },
    weights: { hold: 0.25, pour: 0.3, drink: 0.3, clean: 0.15 },
    testName: '喝水测试',
    testPrompt: '把杯子举到嘴边，倒出 200ml 水',
  },
  chair: {
    id: 'chair',
    name: '椅子',
    en: 'Chair',
    emoji: '🪑',
    tagline: '从支撑人体到主动脱离人类',
    basePrompt:
      'a single simple wooden chair with four legs, a flat seat and a straight backrest, light oak, studio product photography',
    marks: ['坐面', '靠背', '四条腿', '木质'],
    materials: ['浅色橡木', '棉麻坐垫'],
    metricLabels: { support: '支撑', access: '入座', comfort: '舒适', durable: '耐用' },
    weights: { support: 0.3, access: 0.3, comfort: 0.25, durable: 0.15 },
    testName: '坐下测试',
    testPrompt: '角色走向椅子，尝试坐下 30 秒',
  },
  umbrella: {
    id: 'umbrella',
    name: '雨伞',
    en: 'Umbrella',
    emoji: '🌂',
    tagline: '从防雨到自造降雨',
    basePrompt:
      'a single classic black umbrella with a domed canopy, eight ribs, a straight shaft and a J-shaped handle, closed studio background, product photography',
    marks: ['伞面', '伞骨', '伞柄', '可持握'],
    materials: ['防水尼龙', '铝合金骨'],
    metricLabels: { cover: '挡雨', grip: '持握', portable: '便携', dry: '保持干燥' },
    weights: { cover: 0.4, grip: 0.2, portable: 0.2, dry: 0.2 },
    testName: '挡雨测试',
    testPrompt: '走进中雨区域，撑开雨伞 20 秒',
  },
  bin: {
    id: 'bin',
    name: '垃圾桶',
    en: 'Bin',
    emoji: '🗑️',
    tagline: '极致洁净反而拒绝垃圾',
    basePrompt:
      'a single simple cylindrical stainless steel trash bin with a flat lid and a small foot pedal, brushed metal, studio product photography',
    marks: ['桶身', '桶口', '桶盖', '圆柱'],
    materials: ['拉丝不锈钢', '哑光塑料'],
    metricLabels: { accept: '接收', capacity: '容量', sort: '分类', hygiene: '卫生' },
    weights: { accept: 0.35, capacity: 0.25, sort: 0.2, hygiene: 0.2 },
    testName: '投垃圾测试',
    testPrompt: '把一团纸投向桶口，观察是否被接收',
  },
};

export const FAMILY_IDS: FamilyId[] = ['cup', 'chair', 'umbrella', 'bin'];

export const METRIC_ORDER: Record<FamilyId, MetricId[]> = {
  cup: ['hold', 'pour', 'drink', 'clean'],
  chair: ['support', 'access', 'comfort', 'durable'],
  umbrella: ['cover', 'grip', 'portable', 'dry'],
  bin: ['accept', 'capacity', 'sort', 'hygiene'],
};

export function baseGenes(family: FamilyId): Genes {
  const metrics: Record<string, number> = {
    cup: { hold: 0.93, pour: 0.9, drink: 0.9, clean: 0.88 },
    chair: { support: 0.93, access: 0.9, comfort: 0.86, durable: 0.9 },
    umbrella: { cover: 0.9, grip: 0.9, portable: 0.86, dry: 0.9 },
    bin: { accept: 0.93, capacity: 0.86, sort: 0.34, hygiene: 0.72 },
  }[family] as Record<string, number>;

  return {
    family,
    generation: 0,
    proportions: { height: 1, width: 1, rim: 1, handle: 1 },
    flags: {
      rimSealed: false,
      inverted: false,
      seatFlipped: false,
      canopyInverted: false,
      nested: 0,
      autonomous: false,
      possessed: null,
    },
    parts: [],
    metrics: metrics as Record<MetricId, number>,
    conflicts: [],
    materials: [...FAMILIES[family].materials],
    marks: [...FAMILIES[family].marks],
    cost: 0.06,
    absurdity: 0.04,
    history: [],
  };
}

export const ANCHOR_LABELS: Record<string, string> = {
  top: '顶部',
  rim: '开口',
  side: '侧面',
  bottom: '底部',
  handle: '握把',
  seat: '坐面',
  back: '靠背',
  canopy: '伞冠',
};
