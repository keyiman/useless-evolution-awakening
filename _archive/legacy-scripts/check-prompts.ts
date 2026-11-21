import { showcaseChain } from '../src/engine/showcase';
import { promptKey } from '../server/lux3d';

for (const family of ['cup', 'chair', 'umbrella', 'bin'] as const) {
  const chain = showcaseChain(family);
  console.log(`\n### ${family}`);
  for (const n of chain) {
    console.log(`G${n.generation} ${n.mutation?.title} | ${n.mutation?.operator} | key=${promptKey(n.prompt)}`);
    console.log('   ' + n.prompt.split('\n')[2]);
  }
}
