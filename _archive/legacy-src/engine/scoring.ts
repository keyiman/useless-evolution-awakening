import type { Genes, ScoreVector } from './types';
import { FAMILIES, METRIC_ORDER } from './families';
import { clamp, round3 } from './rng';

/** 实用性 U：几何平均与算术平均的混合。几何平均惩罚“任何一项归零”，算术平均保留整体手感。 */
export function utility(genes: Genes): number {
  const weights = FAMILIES[genes.family].weights;
  const order = METRIC_ORDER[genes.family];
  let logSum = 0;
  let arith = 0;
  let wSum = 0;
  for (const m of order) {
    const w = weights[m] ?? 1 / order.length;
    const v = Math.max(0.02, genes.metrics[m] ?? 0.02);
    logSum += w * Math.log(v);
    arith += w * v;
    wSum += w;
  }
  const geo = Math.exp(logSum / Math.max(0.0001, wSum));
  return clamp(0.62 * geo + 0.38 * arith);
}

export function computeScore(genes: Genes, parentGenes: Genes | null): ScoreVector {
  const u = utility(genes);
  const parentU = parentGenes ? utility(parentGenes) : u;
  const parts = genes.parts.length;
  const conflicts = genes.conflicts.length;

  const absurdity = clamp(
    0.06 +
      0.045 * parts +
      0.13 * conflicts +
      0.06 * Math.min(3, genes.flags.nested) +
      0.22 * genes.cost +
      (genes.flags.autonomous ? 0.1 : 0) +
      genes.absurdity * 0.25,
  );

  const uniqueOps = new Set(genes.history).size;
  const novelty = clamp(
    0.12 +
      0.07 * uniqueOps +
      0.03 * genes.generation +
      0.12 * (genes.parts.some((p) => p.foreign) ? 1 : 0) +
      (genes.flags.possessed ? 0.1 : 0) +
      (genes.flags.seatFlipped || genes.flags.canopyInverted || genes.flags.rimSealed ? 0.08 : 0),
  );

  const totalMarks = FAMILIES[genes.family].marks.length;
  const recognition = clamp(genes.marks.length / totalMarks);

  const delta = clamp(Math.abs(u - parentU) * 2.2 + 0.12 * conflicts);

  const q = 0.3 * novelty + 0.3 * absurdity + 0.2 * recognition + 0.2 * delta;

  return {
    utility: round3(u),
    novelty: round3(novelty),
    absurdity: round3(absurdity),
    recognition: round3(recognition),
    delta: round3(delta),
    q: round3(q),
  };
}
