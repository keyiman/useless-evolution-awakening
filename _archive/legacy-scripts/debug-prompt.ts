import { showcaseChain } from '../src/engine/showcase';
const chain = showcaseChain('cup');
for (const n of chain.slice(0,3)) {
  console.log(`G${n.generation}`, JSON.stringify(n.genes.proportions), JSON.stringify(n.genes.flags), n.genes.parts.map(p=>p.kind));
  console.log(n.prompt);
  console.log('====');
}
