/**
 * 废物进化论 · 核心数据模型
 * 基因型（genes）与表现型（prompt / GLB / 程序化几何）严格分离：
 * 模型生成失败只影响表现型，谱系与规则永远可复现。
 */

export const RULE_VERSION = 'ue-1.1.0';

export type FamilyId = 'cup' | 'chair' | 'umbrella' | 'bin';

export type MetricId = 'hold' | 'pour' | 'drink' | 'clean' | 'support' | 'access' | 'comfort' | 'durable' | 'cover' | 'grip' | 'portable' | 'dry' | 'accept' | 'capacity' | 'sort' | 'hygiene';

export type OperatorId = 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6';

export type RareId = 'atavism' | 'contamination' | 'organ' | 'possession' | 'mutual' | 'miracle' | 'mismatch' | 'recursive';

export type PartKind =
  | 'ring' | 'arm' | 'leg' | 'wheel' | 'tank' | 'nozzle' | 'sensor' | 'cage'
  | 'panel' | 'claw' | 'track' | 'lid' | 'handle' | 'spike' | 'antenna' | 'mirror'
  | 'tube' | 'shell' | 'rail' | 'conveyor' | 'camera' | 'valve' | 'filter' | 'pump' | 'canopy';

export type Anchor = 'top' | 'rim' | 'side' | 'bottom' | 'handle' | 'seat' | 'back' | 'canopy';

export interface PartGene {
  id: string;
  kind: PartKind;
  anchor: Anchor;
  /** 同一锚点上的槽位，决定环绕角度 */
  slot: number;
  scale: number;
  /** 自转速度，0 表示静止 */
  spin: number;
  /** 往返摆动幅度（弧度），0 表示不摆动 */
  swing: number;
  label: string;
  foreign?: FamilyId;
}

export interface Conflict {
  id: string;
  a: string;
  b: string;
  label: string;
}

export interface Proportions {
  height: number;
  width: number;
  rim: number;
  handle: number;
}

export interface Flags {
  rimSealed: boolean;
  inverted: boolean;
  seatFlipped: boolean;
  canopyInverted: boolean;
  /** 递归保护层数 */
  nested: number;
  /** 自主移动 / 逃离 */
  autonomous: boolean;
  /** 副功能夺舍 */
  possessed: MetricId | null;
}

export interface Genes {
  family: FamilyId;
  generation: number;
  proportions: Proportions;
  flags: Flags;
  parts: PartGene[];
  metrics: Record<MetricId, number>;
  conflicts: Conflict[];
  materials: string[];
  /** 仍保留的祖先身份标记 */
  marks: string[];
  /** 维护成本 0..1 */
  cost: number;
  /** 荒诞度 0..1 */
  absurdity: number;
  /** 已发生的算子序列 */
  history: string[];
}

export interface Mutation {
  operator: OperatorId;
  rare?: RareId;
  title: string;
  subtitle: string;
  blurb: string;
  /** 本代的结构变化，用于 3D 与说明 */
  changes: string[];
  /** 逻辑后果（可能包含冲突） */
  consequences: string[];
  /** 新增部件 id */
  partIds: string[];
  /** 可复现的派生种子 */
  key: string;
}

export interface ScoreVector {
  utility: number;
  novelty: number;
  absurdity: number;
  recognition: number;
  delta: number;
  q: number;
}

export interface Candidate {
  slot: 0 | 1 | 2;
  parentId: string;
  parentHash: string;
  derivedSeed: string;
  mutation: Mutation;
  genes: Genes;
  score: ScoreVector;
  hash: string;
  prompt: string;
}

export interface EvolutionNode {
  id: string;
  parentIds: string[];
  family: FamilyId;
  generation: number;
  worldSeed: string;
  genes: Genes;
  mutation: Mutation | null;
  score: ScoreVector;
  hash: string;
  prompt: string;
  createdAt: number;
  label: string;
}

export interface FamilyMeta {
  id: FamilyId;
  name: string;
  en: string;
  emoji: string;
  tagline: string;
  basePrompt: string;
  marks: string[];
  materials: string[];
  metricLabels: Record<string, string>;
  weights: Record<string, number>;
  testName: string;
  testPrompt: string;
}
