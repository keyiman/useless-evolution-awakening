/**
 * 预生成示范路线的 Lux3D 资产（G1-Turbo 文生 3D），并写入 public/models/manifest.json。
 * 用法：
 *   npx tsx scripts/generate-assets.ts cup            # 只生成水杯链
 *   npx tsx scripts/generate-assets.ts cup chair      # 多条链
 *   npx tsx scripts/generate-assets.ts all
 */
import 'dotenv/config';
import { createTextTo3D, getTask, jobs, findAsset } from '../server/lux3d';
import { SHOWCASE, showcaseChain } from '../src/engine/showcase';
import { FAMILY_IDS } from '../src/engine/families';
import type { FamilyId } from '../src/engine/types';

const args = process.argv.slice(2);
const families: FamilyId[] = args.includes('all') || args.length === 0
  ? [...FAMILY_IDS]
  : (args.filter((a) => (FAMILY_IDS as string[]).includes(a)) as FamilyId[]);

const GEN: Record<FamilyId, number[]> = {
  cup: [0, 1, 2, 3, 4, 5],
  chair: [0, 5],
  umbrella: [0, 5],
  bin: [0, 5],
};

function log(...a: unknown[]) {
  console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
}

async function waitFor(taskId: number, timeoutMs = 20 * 60 * 1000) {
  const start = Date.now();
  let last = -1;
  while (Date.now() - start < timeoutMs) {
    const st = await getTask(taskId);
    if (st.status !== last) {
      log(`  task ${taskId} status=${st.status}${st.url ? ' url=' + st.url : ''}`);
      last = st.status;
    }
    if (st.status === 3 && st.url) return st;
    if (st.status === 4 || st.status === 6) throw new Error(st.error || `任务终态 ${st.status}`);
    await new Promise((r) => setTimeout(r, 10000));
  }
  throw new Error('轮询超时');
}

async function main() {
  if (!process.env.AHOLO_API_KEY) throw new Error('缺少 AHOLO_API_KEY');
  for (const family of families) {
    const chain = showcaseChain(family);
    const gens = GEN[family];
    log(`=== ${family} seed=${SHOWCASE[family].seed} 共 ${chain.length} 代，生成 G${gens.join(', G')}`);
    for (const g of gens) {
      const node = chain[g];
      if (!node) continue;
      const cached = findAsset(node.prompt);
      if (cached) {
        log(`G${g} 已缓存 ${cached.file}，跳过`);
        continue;
      }
      log(`G${g} 提交：${node.mutation?.title ?? '祖先'}（${node.prompt.length} chars）`);
      const res = await createTextTo3D({
        prompt: node.prompt,
        nodeId: node.id,
        nodeLabel: node.label,
        family: node.family,
        generation: node.generation,
        version: 'G1-Turbo',
        faceCount: 120000,
      });
      if (res.cachedUrl) {
        log(`G${g} 命中缓存 ${res.cachedUrl}`);
        continue;
      }
      jobs.set(String(res.taskId), {
        taskId: res.taskId,
        key: res.key,
        prompt: node.prompt,
        nodeId: node.id,
        nodeLabel: node.label,
        family: node.family,
        generation: node.generation,
        createdAt: new Date().toISOString(),
      });
      log(`G${g} taskId=${res.taskId}`);
      await waitFor(res.taskId);
      await new Promise((r) => setTimeout(r, 4000));
    }
  }
  log('全部完成');
}

main().catch((e) => {
  console.error('FAILED', e);
  process.exit(1);
});
