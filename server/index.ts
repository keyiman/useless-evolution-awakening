import 'dotenv/config';
import express from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createTextTo3D, findAsset, getTask, manifestStats, promptKey, jobs, MODEL_DIR } from './lux3d';

const app = express();
const PORT = Number(process.env.PORT || 8787);

app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, hasKey: Boolean(process.env.AHOLO_API_KEY), model: 'G1-Turbo' });
});

app.post('/api/assets/lookup', (req, res) => {
  const prompt = String(req.body?.prompt ?? '');
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  const hit = findAsset(prompt);
  res.json({ url: hit ? `/models/${hit.file}` : null, key: promptKey(prompt), record: hit ?? null });
});

app.post('/api/lux3d/generate', async (req, res) => {
  const { prompt, nodeId, nodeLabel, family, generation, version } = req.body ?? {};
  if (typeof prompt !== 'string' || prompt.trim().length < 10||prompt.length>7000) {
    return res.status(400).json({ error: '提示词需为10–7000字' });
  }
  try {
    const result = await createTextTo3D({
      prompt,
      nodeId,
      nodeLabel,
      family,
      generation,
      version: version === 'G1' ? 'G1' : 'G1-Turbo',
    });
    res.json(result);
  } catch (err: any) {
    const msg = String(err?.message ?? err);
    const code = msg.includes('CONCURRENCY') ? 429 : 500;
    res.status(code).json({ error: msg });
  }
});

app.get('/api/lux3d/task/:taskId', async (req, res) => {
  const taskId = Number(req.params.taskId);
  if (!Number.isSafeInteger(taskId)||taskId<=0) return res.status(400).json({ error: 'bad taskId' });
  try {
    res.json(await getTask(taskId));
  } catch (err: any) {
    res.status(500).json({ error: String(err?.message ?? err) });
  }
});

app.get('/api/lux3d/stats', (_req, res) => {
  res.json({ ...manifestStats(), inflight: jobs.size });
});

app.use('/models', express.static(MODEL_DIR, { maxAge: '7d' }));

const dist = join(process.cwd(), 'dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(join(dist, 'index.html')));
}

const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`[api] http://${HOST}:${PORT}  key=${process.env.AHOLO_API_KEY ? 'configured' : 'MISSING'}`);
});
