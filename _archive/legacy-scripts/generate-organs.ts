/**
 * 预生成“器官库”的 Lux3D 资产。运行时只拼装这些已有 GLB，不再调用 Lux3D。
 * 用法：
 *   npx tsx scripts/generate-organs.ts            # 全部缺失器官
 *   npx tsx scripts/generate-organs.ts seal arm   # 指定器官
 *
 * 生成按批并行提交、串行轮询；manifest 只由当前进程写入，避免并发覆盖。
 */
import 'dotenv/config';
import { createTextTo3D, getTask, jobs, findAsset } from '../server/lux3d';
import { ORGAN_LIST, type OrganId } from '../src/engine/organs';

const args = process.argv.slice(2);
const wanted = args.filter((a) => ORGAN_LIST.some((o) => o.id === a)) as OrganId[];
const list = (wanted.length ? ORGAN_LIST.filter((o) => wanted.includes(o.id)) : ORGAN_LIST).filter(
  (o) => !findAsset(o.prompt),
);
const batchSize = Math.max(1, Number(process.env.ORGAN_BATCH ?? 4));

function log(...a: unknown[]) {
  console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Pending {
  id: OrganId;
  name: string;
  taskId: number;
  done: boolean;
  ok: boolean;
}

async function main() {
  if (!process.env.AHOLO_API_KEY) throw new Error('缺少 AHOLO_API_KEY');
  log(`待生成 ${list.length} 个器官，批大小 ${batchSize}`);
  let ok = 0;
  let fail = 0;

  for (let i = 0; i < list.length; i += batchSize) {
    const batch = list.slice(i, i + batchSize);
    const pending: Pending[] = [];
    for (const organ of batch) {
      try {
        log(`提交 ${organ.id} / ${organ.name}（${organ.prompt.length} chars）`);
        const res = await createTextTo3D({
          prompt: organ.prompt,
          nodeId: `organ:${organ.id}`,
          nodeLabel: `器官 · ${organ.name}`,
          family: 'organ',
          generation: 0,
          version: 'G1-Turbo',
          faceCount: 80000,
        });
        if (res.cachedUrl) {
          log(`${organ.id} 命中缓存 ${res.cachedUrl}`);
          ok += 1;
          continue;
        }
        jobs.set(String(res.taskId), {
          taskId: res.taskId,
          key: res.key,
          prompt: organ.prompt,
          nodeId: `organ:${organ.id}`,
          nodeLabel: `器官 · ${organ.name}`,
          family: 'organ',
          generation: 0,
          createdAt: new Date().toISOString(),
        });
        pending.push({ id: organ.id, name: organ.name, taskId: res.taskId, done: false, ok: false });
        log(`${organ.id} taskId=${res.taskId}`);
      } catch (e) {
        fail += 1;
        log(`✘ 提交失败 ${organ.id}: ${(e as Error).message}`);
      }
      await sleep(1200);
    }

    while (pending.some((p) => !p.done)) {
      for (const p of pending) {
        if (p.done) continue;
        try {
          const st = await getTask(p.taskId);
          if (st.status === 3 && st.url) {
            p.done = true;
            p.ok = true;
            ok += 1;
            log(`✔ ${p.id} ${st.url}`);
          } else if (st.status === 4 || st.status === 6) {
            p.done = true;
            fail += 1;
            log(`✘ ${p.id} 终态 ${st.status} ${st.error ?? ''}`);
          }
        } catch (e) {
          log(`… ${p.id} 轮询异常，稍后重试: ${(e as Error).message}`);
        }
        await sleep(800);
      }
      if (pending.some((p) => !p.done)) await sleep(6000);
    }
    log(`批次完成：成功 ${ok}，失败 ${fail}`);
  }
  log(`全部完成：成功 ${ok}，失败 ${fail}`);
}

main().catch((e) => {
  console.error('FAILED', e);
  process.exit(1);
});
