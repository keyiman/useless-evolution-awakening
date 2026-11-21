import { buildCandidates, createChild, makeRoot } from '../src/engine/evolve';
import { FAMILY_IDS } from '../src/engine/families';
import { utility } from '../src/engine/scoring';
import type { EvolutionNode, FamilyId } from '../src/engine/types';

interface Found {
  family: FamilyId;
  seed: string;
  path: number[];
  ops: string[];
  rares: string[];
  utilities: number[];
  finalU: number;
  conflicts: number;
  parts: number;
  recognition: number;
  q: number;
}

function walk(seed: string, family: FamilyId, path: number[]): EvolutionNode[] {
  let node = makeRoot(family, seed);
  const chain = [node];
  for (const slot of path) {
    const cands = buildCandidates(node, seed);
    const c = cands[slot];
    if (!c) break;
    node = createChild(node, c);
    chain.push(node);
  }
  return chain;
}

const results: Found[] = [];

for (const family of FAMILY_IDS) {
  for (let i = 0; i < 400; i++) {
    const seed = `UE-${String(1000 + i * 7).padStart(4, '0')}`;
    for (let p = 0; p < 80; p++) {
      const path = Array.from({ length: 5 }, (_, k) => (i * 3 + p * 7 + k * 5) % 3);
      const chain = walk(seed, family, path);
      const final = chain[chain.length - 1];
      const ops = chain.slice(1).map((n) => n.mutation!.operator);
      const rares = chain.slice(1).map((n) => n.mutation!.rare).filter(Boolean) as string[];
      const utils = chain.map((n) => utility(n.genes));
      const uniqueOps = new Set(ops).size;
      const rose = utils.some((u, idx) => idx > 0 && u > utils[idx - 1] + 0.02);
      const score =
        (final.genes.conflicts.length >= 2 ? 2 : 0) +
        (final.genes.flags.rimSealed || final.genes.flags.canopyInverted || final.genes.flags.seatFlipped ? 2 : 0) +
        (rares.length > 0 ? 1 : 0) +
        (uniqueOps >= 4 ? 1 : 0) +
        (rose ? 1 : 0) +
        (final.score.absurdity > 0.45 ? 1 : 0) +
        (final.genes.parts.length >= 2 ? 1 : 0);
      if (score >= 6 && final.score.recognition <= 0.76) {
        results.push({
          family, seed, path, ops, rares, utilities: utils,
          finalU: final.score.utility, conflicts: final.genes.conflicts.length,
          parts: final.genes.parts.length, recognition: final.score.recognition, q: final.score.q,
        });
      }
    }
  }
}

for (const family of FAMILY_IDS) {
  const top = results.filter((r) => r.family === family).sort((a, b) => b.q - a.q).slice(0, 3);
  console.log(`\n=== ${family}`);
  for (const t of top) {
    console.log(JSON.stringify(t));
  }
}
