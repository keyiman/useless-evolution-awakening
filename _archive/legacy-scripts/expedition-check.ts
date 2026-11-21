import assert from 'node:assert/strict';
import { createRun, offersFor, mutate, resolveTrial, continueRun, abilities, discoveries, CHALLENGES, decodeRun, encodeRun } from '../src/engine/expedition';
let run = createRun('cup', 'test-seed');
assert.deepEqual(offersFor(run), offersFor(createRun('cup', 'test-seed')));
assert.equal(new Set(offersFor(run)).size, 3);
assert.deepEqual(mutate(run, 'not-an-organ' as any), run, 'only current offered mutations accepted');
for (const pair of [['eye','legs'], ['balloon','jet'], ['mycelium','suction']] as const) {
  assert.equal(discoveries([...pair]).length, 1);
}
assert.ok(abilities(['eye','legs']).mobility > abilities(['legs']).mobility);
const before = run;
run = mutate(run, offersFor(run)[0]);
assert.equal(run.phase, 'ready');
assert.equal(run.generation, 1);
assert.deepEqual(mutate(run, offersFor(run)[1]), run, 'cannot mutate twice without trial');
run = resolveTrial(run);
assert.deepEqual(resolveTrial(run), run, 'cannot settle twice');
assert.equal(before.generation, 0, 'immutable state');
assert.deepEqual(decodeRun(encodeRun(run)), run);
assert.equal(decodeRun('broken'), null);
assert.equal(decodeRun(btoa(encodeURIComponent(JSON.stringify({v:1,f:'toString',s:'bad',c:[],p:'choose'})))),null);
// Explore all possible legal choices: both wins and losses must exist, no empty offer or >6 mutations.
let wins = 0, losses = 0;
function visit(state: ReturnType<typeof createRun>) {
  assert.ok(state.generation <= 6);
  if (state.phase === 'won') { wins++; return; }
  if (state.phase === 'lost') { losses++; return; }
  const cards = offersFor(state);
  assert.equal(cards.length, 3);
  for (const card of cards) {
    const ready=mutate(state, card);
    assert.deepEqual(decodeRun(encodeRun(ready)),ready);
    const result = resolveTrial(ready);
    assert.deepEqual(decodeRun(encodeRun(result)),result);
    visit(continueRun(result));
  }
}
visit(createRun('cup', 'test-seed'));
assert.ok(wins > 0, 'at least one winning path');
assert.ok(losses > 0, 'choices can lose');
for (const family of ['cup','chair','umbrella','bin'] as const) {
  const r = createRun(family, 'family-check');
  assert.equal(offersFor(r).length, 3);
  for(let i=0;i<8;i++)visit(createRun(family,`coverage-${i}`));
}
assert.equal(CHALLENGES.length, 3);
console.log(`Expedition checks passed: ${wins} winning / ${losses} losing paths; replay, combos, transitions.`);

