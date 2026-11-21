import type { Candidate, EvolutionNode, FamilyId, Genes, Mutation, OperatorId, RareId, ScoreVector } from './types';
import { RULE_VERSION } from './types';
import { FAMILIES, baseGenes } from './families';
import { applyOperator, applyRare, RARE_META } from './operators';
import { computeScore } from './scoring';
import { buildPrompt } from './prompt';
import { hashHex, makeRng, stableStringify } from './rng';

const OPERATORS: OperatorId[] = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'];

function operatorWeights(generation: number): [OperatorId, number][] {
  if (generation <= 0) {
    return [['M1', 32], ['M2', 24], ['M3', 6], ['M4', 12], ['M5', 14], ['M6', 12]];
  }
  if (generation <= 2) {
    return [['M1', 24], ['M2', 18], ['M3', 12], ['M4', 16], ['M5', 15], ['M6', 15]];
  }
  return [['M1', 16], ['M2', 13], ['M3', 19], ['M4', 19], ['M5', 17], ['M6', 16]];
}

export function genesHash(genes: Genes): string {
  return hashHex(stableStringify(genes));
}

export function nodeHash(genes: Genes, parentHashes: string[], mutationKey: string): string {
  return hashHex(stableStringify({ v: RULE_VERSION, genes, parentHashes: [...parentHashes].sort(), mutationKey }));
}

export function makeRoot(family: FamilyId, worldSeed: string): EvolutionNode {
  const genes = baseGenes(family);
  const hash = nodeHash(genes, [], `root:${family}:${worldSeed}`);
  const score = computeScore(genes, null);
  const mutation: Mutation = {
    operator: 'M1',
    title: `${FAMILIES[family].name} G0`,
    subtitle: '原始祖先',
    blurb: FAMILIES[family].tagline,
    changes: ['原始形态'],
    consequences: [],
    partIds: [],
    key: `root:${family}:${worldSeed}`,
  };
  return {
    id: `n_${hash.slice(0, 10)}`,
    parentIds: [],
    family,
    generation: 0,
    worldSeed,
    genes,
    mutation: null,
    score,
    hash,
    prompt: buildPrompt(genes, mutation),
    createdAt: 0,
    label: `${FAMILIES[family].name} G0`,
  };
}

export function buildCandidates(parent: EvolutionNode, worldSeed: string): Candidate[] {
  const used: OperatorId[] = [];
  const out: Candidate[] = [];
  for (let slot = 0; slot < 3; slot++) {
    const key = `${RULE_VERSION}|${worldSeed}|${parent.hash}|${slot}`;
    const rng = makeRng(key);
    const weights = operatorWeights(parent.generation).filter(([op]) => !used.includes(op));
    const op = rng.weighted(weights);
    used.push(op as OperatorId);

    const { genes, mutation } = applyOperator(parent.genes, op as OperatorId, rng, key);
    let finalGenes = genes;
    let finalMutation = mutation;

    const rareChance = 0.12 + Math.min(0.12, parent.generation * 0.02);
    if (rng.chance(rareChance)) {
      const canAtavism = parent.genes.marks.length < FAMILIES[parent.family].marks.length;
      const pool: [RareId, number][] = [
        ['contamination', 14], ['organ', 10], ['possession', 12],
        ['mutual', 14], ['miracle', 8], ['mismatch', 12], ['recursive', 10],
      ];
      if (canAtavism) pool.push(['atavism', 14]);
      const rare = rng.weighted(pool);
      const res = applyRare(genes, rare, rng, key);
      finalGenes = res.genes;
      finalMutation = {
        ...mutation,
        rare,
        title: `${RARE_META[rare].name}·${mutation.title}`,
        changes: [...mutation.changes, ...res.changes],
        consequences: [...mutation.consequences, ...res.consequences],
        blurb: `${mutation.blurb} ${res.blurb}`,
      };
    }

    const hash = nodeHash(finalGenes, [parent.hash], finalMutation.key + ':' + (finalMutation.rare ?? ''));
    const score: ScoreVector = computeScore(finalGenes, parent.genes);

    out.push({
      slot: slot as 0 | 1 | 2,
      parentId: parent.id,
      parentHash: parent.hash,
      derivedSeed: key,
      mutation: finalMutation,
      genes: finalGenes,
      score,
      hash,
      prompt: buildPrompt(finalGenes, finalMutation),
    });
  }
  return out;
}

export function createChild(parent: EvolutionNode, candidate: Candidate): EvolutionNode {
  return {
    id: `n_${candidate.hash.slice(0, 10)}`,
    parentIds: [parent.id],
    family: candidate.genes.family,
    generation: candidate.genes.generation,
    worldSeed: parent.worldSeed,
    genes: candidate.genes,
    mutation: candidate.mutation,
    score: candidate.score,
    hash: candidate.hash,
    prompt: candidate.prompt,
    createdAt: Date.now(),
    label: `${FAMILIES[candidate.genes.family].name} G${candidate.genes.generation} · ${candidate.mutation.title}`,
  };
}

/** 两个亲本的融合节点：保留 A 的主体，嫁接 B 的一个结构特征。 */
export function createFusion(a: EvolutionNode, b: EvolutionNode, worldSeed: string): EvolutionNode {
  const key = `${RULE_VERSION}|fusion|${worldSeed}|${a.hash}|${b.hash}`;
  const rng = makeRng(key);
  const genes: Genes = structuredClone(a.genes);
  genes.generation = Math.max(a.generation, b.generation) + 1;
  genes.history = [...genes.history, 'M5'];

  const foreignFamily = b.family;
  const kind = foreignFamily === 'cup' ? 'handle' : foreignFamily === 'chair' ? 'leg' : foreignFamily === 'umbrella' ? 'canopy' : 'wheel';
  const slot = genes.parts.filter((p) => p.anchor === 'side').length;
  genes.parts.push({
    id: `p${genes.parts.length}_${kind}`,
    kind: kind as Genes['parts'][number]['kind'],
    anchor: 'side',
    slot,
    scale: 1.1,
    spin: 0,
    swing: 0.35,
    label: `${FAMILIES[foreignFamily].name}器官`,
    foreign: foreignFamily,
  });
  genes.materials.push(FAMILIES[foreignFamily].materials[0]);
  genes.conflicts.push({
    id: `c${genes.conflicts.length}`,
    a: FAMILIES[a.family].name,
    b: FAMILIES[foreignFamily].name,
    label: `${FAMILIES[a.family].name} 与 ${FAMILIES[foreignFamily].name} 的功能耦合`,
  });
  genes.cost = Math.min(1, genes.cost + 0.2);
  genes.absurdity = Math.min(1, genes.absurdity + 0.2);

  const mutation: Mutation = {
    operator: 'M5',
    title: `杂交·${FAMILIES[a.family].name}×${FAMILIES[foreignFamily].name}`,
    subtitle: '双亲融合',
    blurb: `把两个谱系的器官装进同一副身体。${FAMILIES[foreignFamily].name}的结构保留了自己的逻辑，却必须服从${FAMILIES[a.family].name}的使用方式。`,
    changes: [`嫁接${FAMILIES[foreignFamily].name}器官`, `代际提升至 G${genes.generation}`],
    consequences: ['新增一条跨物种功能冲突'],
    partIds: [genes.parts[genes.parts.length - 1].id],
    key,
  };

  const hash = nodeHash(genes, [a.hash, b.hash], key);
  const score = computeScore(genes, a.genes);
  return {
    id: `n_${hash.slice(0, 10)}`,
    parentIds: [a.id, b.id],
    family: a.family,
    generation: genes.generation,
    worldSeed,
    genes,
    mutation,
    score,
    hash,
    prompt: buildPrompt(genes, mutation),
    createdAt: Date.now(),
    label: `杂交 · ${FAMILIES[a.family].name}×${FAMILIES[foreignFamily].name} G${genes.generation}`,
  };
}

export interface ShareState {
  seed: string;
  family: FamilyId;
  path: number[];
}

export function encodeShare(state: ShareState): string {
  const json = JSON.stringify({ ...state, v: RULE_VERSION });
  return btoa(unescape(encodeURIComponent(json))).replace(/=+$/, '');
}

export function decodeShare(code: string): ShareState | null {
  try {
    const json = decodeURIComponent(escape(atob(code)));
    const data = JSON.parse(json);
    if (!data.seed || !data.family || !Array.isArray(data.path)) return null;
    if (data.v !== RULE_VERSION) return null;
    return { seed: String(data.seed), family: data.family, path: data.path.map(Number) };
  } catch {
    return null;
  }
}
