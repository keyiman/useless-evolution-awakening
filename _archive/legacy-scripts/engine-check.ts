import { buildCandidates, createChild, makeRoot } from '../src/engine/evolve';
import { FAMILIES, FAMILY_IDS, METRIC_ORDER } from '../src/engine/families';
import { runUselessTest } from '../src/engine/uselessTest';
import { RULE_VERSION } from '../src/engine/types';
import type { EvolutionNode } from '../src/engine/types';
import { writeFileSync } from 'node:fs';

function walk(seed: string, family: (typeof FAMILY_IDS)[number], slots: number[]): EvolutionNode[] {
  let node = makeRoot(family, seed);
  const chain = [node];
  for (let g = 0; g < slots.length; g++) {
    const candidates = buildCandidates(node, seed);
    const chosen = candidates[slots[g] % 3];
    node = createChild(node, chosen);
    chain.push(node);
  }
  return chain;
}

const t0 = Date.now();
const seeds = Array.from({ length: 100 }, (_, i) => `UE-${String(i + 1).padStart(3, '0')}`);
const report = {
  ruleVersion: RULE_VERSION,
  seeds: seeds.length,
  families: FAMILY_IDS.length,
  runs: 0,
  determinism: { checked: 0, mismatches: 0 },
  invalid: 0,
  duplicateCandidateSets: 0,
  maxParts: 0,
  generations: [] as { family: string; g: number; utility: number; absurdity: number; q: number }[],
  testOutcomes: { success: 0, fail: 0 },
  sample: [] as unknown[],
};

const paths = [
  [0, 1, 2, 0, 1],
  [1, 2, 0, 1, 2],
  [2, 0, 1, 2, 0],
];

for (const family of FAMILY_IDS) {
  for (let s = 0; s < seeds.length; s++) {
    const seed = seeds[s];
    const slots = paths[s % paths.length];
    const a = walk(seed, family, slots);
    const b = walk(seed, family, slots);
    report.runs++;
    report.determinism.checked++;
    if (a.map((n) => n.hash).join('|') !== b.map((n) => n.hash).join('|')) report.determinism.mismatches++;

    for (const node of a) {
      report.maxParts = Math.max(report.maxParts, node.genes.parts.length);
      const order = METRIC_ORDER[family];
      for (const m of order) {
        const v = node.genes.metrics[m];
        if (!Number.isFinite(v) || v < 0 || v > 1) report.invalid++;
      }
      if (!Number.isFinite(node.score.q)) report.invalid++;
      const t = runUselessTest(family, node.genes);
      if (t.success) report.testOutcomes.success++;
      else report.testOutcomes.fail++;
    }

    // 候选集是否完全重复
    const cands = buildCandidates(a[0], seed);
    const titles = new Set(cands.map((c) => c.mutation.title));
    if (titles.size < 3) report.duplicateCandidateSets++;
    const ops = new Set(cands.map((c) => c.mutation.operator));
    if (ops.size < 3) report.duplicateCandidateSets++;

    if (s < 6) {
      report.generations.push(
        ...a.map((n) => ({ family, g: n.generation, utility: n.score.utility, absurdity: n.score.absurdity, q: n.score.q })),
      );
    }
  }
}

const sampleChain = walk('UE-2026', 'cup', [0, 1, 2, 1, 0]);
report.sample = sampleChain.map((n) => ({
  g: n.generation,
  label: n.label,
  hash: n.hash.slice(0, 12),
  mutation: n.mutation ? { op: n.mutation.operator, rare: n.mutation.rare, title: n.mutation.title, changes: n.mutation.changes, consequences: n.mutation.consequences } : null,
  metrics: n.genes.metrics,
  score: n.score,
  parts: n.genes.parts.map((p) => p.label),
  prompt: n.prompt.split('\n')[2],
}));

const out = {
  ...report,
  elapsedMs: Date.now() - t0,
};
writeFileSync('_research/engine-check.json', JSON.stringify(out, null, 2));

console.log(`runs=${out.runs} determinism_mismatch=${out.determinism.mismatches} invalid=${out.invalid} dupCandidateSets=${out.duplicateCandidateSets} maxParts=${out.maxParts} tests=${JSON.stringify(out.testOutcomes)} elapsed=${out.elapsedMs}ms`);
for (const n of report.sample) {
  const s = n as any;
  console.log(`G${s.g} ${s.label} | U=${s.score.utility} A=${s.score.absurdity} Q=${s.score.q} | ${s.parts.join(',')}`);
}
console.log('prompt G3:\n' + (report.sample[3] as any).prompt);

