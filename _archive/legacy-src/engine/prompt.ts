import type { FamilyId, Genes, Mutation, PartKind } from './types';
import { FAMILIES } from './families';

const PART_EN: Record<PartKind, string> = {
  ring: 'concentric mechanical ring',
  arm: 'multi-joint robotic arm',
  leg: 'articulated support leg',
  wheel: 'small wheel',
  tank: 'cylindrical tank',
  nozzle: 'spray nozzle',
  sensor: 'sensor pod',
  cage: 'protective cage',
  panel: 'flat control panel',
  claw: 'mechanical claw',
  track: 'rubber tread',
  lid: 'circular lid',
  handle: 'handle',
  spike: 'metal spike',
  antenna: 'antenna',
  mirror: 'mirror plate',
  tube: 'flexible tube',
  shell: 'outer protective shell',
  rail: 'folding guard rail',
  conveyor: 'small conveyor belt',
  camera: 'tracking camera',
  valve: 'shut-off valve',
  filter: 'filter housing',
  pump: 'self-cleaning pump',
  canopy: 'umbrella canopy',
};

const FAMILY_EN: Record<FamilyId, string> = {
  cup: 'drinking cup',
  chair: 'chair',
  umbrella: 'umbrella',
  bin: 'trash bin',
};

const MARK_EN: Record<string, string> = {
  杯身: 'cylindrical cup body',
  杯口: 'open circular rim',
  把手: 'curved side handle',
  陶瓷: 'white ceramic material',
  坐面: 'flat seat',
  靠背: 'straight backrest',
  四条腿: 'four legs',
  木质: 'light oak wood',
  伞面: 'domed fabric canopy',
  伞骨: 'eight metal ribs',
  伞柄: 'straight shaft with handle',
  可持握: 'hand-held grip',
  桶身: 'cylindrical bin body',
  桶口: 'open top mouth',
  桶盖: 'flat lid',
  圆柱: 'cylindrical silhouette',
};

const MATERIAL_EN: Record<string, string> = {
  白陶瓷: 'white ceramic',
  釉面: 'glazed ceramic',
  浅色橡木: 'light oak wood',
  棉麻坐垫: 'linen cushion',
  防水尼龙: 'waterproof nylon',
  铝合金骨: 'aluminum ribs',
  拉丝不锈钢: 'brushed stainless steel',
  哑光塑料: 'matte plastic',
};

const materialText = (m: string) => MATERIAL_EN[m] ?? m;

export function buildPrompt(genes: Genes, mutation: Mutation): string {
  const inherited = genes.marks.map((m) => MARK_EN[m] ?? m).join(', ');

  const countBy = (parts: Genes['parts']) => {
    const m = new Map<string, number>();
    for (const p of parts) {
      const name = PART_EN[p.kind];
      m.set(name, (m.get(name) ?? 0) + 1);
    }
    return [...m.entries()].map(([name, count]) => (count > 1 ? `${name} ×${count}` : name));
  };
  const added = countBy(genes.parts.filter((p) => !p.foreign));
  const foreign = countBy(genes.parts.filter((p) => p.foreign));

  const mutations: string[] = [];
  if (genes.flags.rimSealed) mutations.push('the opening is sealed shut by a circular lid with no outlet');
  if (genes.flags.canopyInverted) mutations.push('the canopy is inverted into a rain-collecting funnel');
  if (genes.flags.seatFlipped) mutations.push('the seat is flipped upside down');
  if (genes.flags.nested === 1) mutations.push('1 nested protective shell wrapping the object');
  if (genes.flags.nested > 1) mutations.push(`${genes.flags.nested} nested protective shells wrapping the object`);
  if (genes.flags.autonomous) mutations.push('small motorized legs or wheels that let the object move by itself');

  const p = genes.proportions;
  const openingSmall = genes.family === 'umbrella' ? 'a much smaller canopy than normal' : genes.family === 'bin' ? 'a much narrower mouth than normal' : 'a much narrower opening than normal';
  const openingBig = genes.family === 'umbrella' ? 'an oversized, exaggerated canopy' : genes.family === 'bin' ? 'an oversized mouth' : 'an oversized, exaggerated opening';
  if (!genes.flags.rimSealed && p.rim < 0.75) mutations.push(openingSmall);
  if (!genes.flags.rimSealed && p.rim > 1.2) mutations.push(openingBig);
  if (p.height > 1.25) mutations.push(genes.family === 'chair' ? 'an unusually tall backrest and legs' : 'a stretched, elongated body');
  if (p.height < 0.8) mutations.push('a squat, compressed body');
  if (p.width < 0.8) mutations.push('a pinched, narrow body');
  if (p.width > 1.25) mutations.push('a widened, heavy body');
  if (p.handle > 1.3) mutations.push('an oversized handle');
  if (p.handle < 0.75) mutations.push('a tiny vestigial handle');

  if (added.length) mutations.push('added ' + added.join(' and '));
  if (foreign.length) mutations.push('a foreign ' + foreign.join(' and ') + ' grafted onto the side');
  if (genes.flags.possessed) mutations.push('the whole design now prioritizes one secondary function over its original purpose');

  if (genes.generation === 0 && genes.parts.length === 0) {
    mutations.length = 0;
    mutations.push('none, this is the unmodified original object');
  } else if (mutations.length === 0) {
    mutations.push('a subtle but clearly visible structural change');
  }

  return [
    `Object: one ${FAMILY_EN[genes.family]}, still recognizable as a ${FAMILY_EN[genes.family]}.`,
    `Inherited: ${inherited}.`,
    `Mutation: ${mutations.slice(0, 5).join('; ')}.`,
    'Geometry: all added parts are physically connected with visible joints, separate readable components, one single object, full object visible, centered on a plain light grey studio background, soft studio lighting, no text, no logo, no people, no floating parts.',
    `Style: coherent premium industrial 3D product design, ${genes.materials.slice(0, 2).map(materialText).join(' and ')}, game-ready asset.`,
  ].join('\n');
}
