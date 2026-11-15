import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const API_BASE = process.env.AHOLO_API_BASE || 'https://api.aholo3d.cn';
export const MODEL_DIR = process.env.MODEL_DIR
  ? resolve(process.env.MODEL_DIR)
  : join(process.cwd(), 'public', 'models');
const MANIFEST_PATH = join(MODEL_DIR, 'manifest.json');

export interface AssetRecord {
  key: string;
  file: string;
  prompt: string;
  nodeId?: string;
  nodeLabel?: string;
  family?: string;
  generation?: number;
  taskId?: number;
  bytes?: number;
  createdAt: string;
  modelVersion: string;
  optimized?: boolean;
}

type Manifest = Record<string, AssetRecord>;

function ensureDir() {
  if (!existsSync(MODEL_DIR)) mkdirSync(MODEL_DIR, { recursive: true });
}

export function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

export function promptKey(prompt: string): string {
  return sha256(prompt).slice(0, 20);
}

export function loadManifest(): Manifest {
  ensureDir();
  if (!existsSync(MANIFEST_PATH)) return {};
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  } catch {
    return {};
  }
}

export function saveManifest(m: Manifest) {
  ensureDir();
  writeFileSync(MANIFEST_PATH, JSON.stringify(m, null, 2));
}

export function findAsset(prompt: string): AssetRecord | null {
  const m = loadManifest();
  const key = promptKey(prompt);
  const rec = m[key];
  if (!rec) return null;
  const p = join(MODEL_DIR, rec.file);
  if (!existsSync(p)) return null;
  return rec;
}

function apiKey(): string {
  const k = process.env.AHOLO_API_KEY;
  if (!k) throw new Error('服务端未配置 AHOLO_API_KEY');
  return k;
}

async function aholoFetch(path: string, init: RequestInit = {}, timeoutMs = 30000): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(API_BASE + path, {
      ...init,
      signal: ctrl.signal,
      headers: {
        Authorization: apiKey(),
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
    if (!res.ok) {
      const msg = json?.m || json?.message || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return json;
  } finally {
    clearTimeout(timer);
  }
}

export interface CreateResult {
  taskId: number;
  key: string;
  cachedUrl?: string;
}

async function createTask(opts: {
  prompt: string;
  nodeId?: string;
  nodeLabel?: string;
  family?: string;
  generation?: number;
  version?: 'G1' | 'G1-Turbo';
  faceCount?: number;
}): Promise<CreateResult> {
  const key = promptKey(opts.prompt);
  const cached = findAsset(opts.prompt);
  if (cached) return { taskId: cached.taskId ?? 0, key, cachedUrl: `/models/${cached.file}` };

  const body = {
    prompt: opts.prompt,
    version: opts.version ?? 'G1-Turbo',
    style: 'photorealistic',
    faceCount: Math.min(300000, Math.max(10000, opts.faceCount ?? 120000)),
    outputFormat: ['glb'],
    enablePbr: true,
    aiPredictSize: true,
  };
  const res = await aholoFetch('/lux3d/v1/generate/text-to-3d/task/create', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (res.c !== '0' || !res.d) {
    throw new Error(res.m || res.c || '创建任务失败');
  }
  const taskId = Number(res.d);
  if(!Number.isSafeInteger(taskId)||taskId<=0)throw new Error('Aholo未返回有效任务编号');
  jobs.set(String(taskId), {
    taskId,
    key,
    prompt: opts.prompt,
    nodeId: opts.nodeId,
    nodeLabel: opts.nodeLabel,
    family: opts.family,
    generation: opts.generation,
    createdAt: new Date().toISOString(),
  });
  persistJobs();
  return { taskId, key };
}

export interface JobMeta {
  taskId: number;
  key: string;
  prompt: string;
  nodeId?: string;
  nodeLabel?: string;
  family?: string;
  generation?: number;
  createdAt: string;
}

export const jobs = new Map<string, JobMeta>();
const JOBS_PATH=join(MODEL_DIR,'.jobs.json');
try{if(existsSync(JOBS_PATH)){for(const meta of JSON.parse(readFileSync(JOBS_PATH,'utf8')) as JobMeta[]){if(Number.isSafeInteger(meta.taskId)&&meta.taskId>0&&typeof meta.prompt==='string'&&meta.key===promptKey(meta.prompt))jobs.set(String(meta.taskId),meta);}}}catch{}
function persistJobs(){ensureDir();writeFileSync(JOBS_PATH,JSON.stringify([...jobs.values()],null,2));}
const creating=new Map<string,Promise<CreateResult>>();
export async function createTextTo3D(opts:Parameters<typeof createTask>[0]):Promise<CreateResult>{
 const key=promptKey(opts.prompt),cached=findAsset(opts.prompt);if(cached)return {taskId:cached.taskId??0,key,cachedUrl:`/models/${cached.file}`};
 const pending=[...jobs.values()].find(j=>j.key===key);if(pending)return {taskId:pending.taskId,key};
 const existing=creating.get(key);if(existing)return existing;
 const promise=createTask(opts);creating.set(key,promise);try{return await promise;}finally{creating.delete(key);}
}

export interface TaskStatus {
  taskId: number;
  status: number;
  url?: string;
  error?: string;
  key?: string;
}

const downloading = new Map<string,Promise<void>>();

export async function getTask(taskId: number): Promise<TaskStatus> {
  const cached=Object.values(loadManifest()).find(r=>r.taskId===taskId&&existsSync(join(MODEL_DIR,r.file)));
  if(cached)return {taskId,status:3,url:`/models/${cached.file}`,key:cached.key};
  const res = await aholoFetch(`/lux3d/v1/generate/task/get?taskid=${taskId}`);
  if (res.c !== '0' || !res.d) throw new Error(res.m || '查询失败');
  const d = res.d;
  const status = Number(d.status);
  if (status !== 3) {if(status===4||status===6){jobs.delete(String(taskId));persistJobs();}return { taskId, status,error:status===4||status===6?'Aholo生成未成功，请修改提示词后重试。':undefined };}

  const meta = jobs.get(String(taskId));
  const key = meta?.key ?? promptKey(meta?.prompt ?? String(taskId));
  const outputs: { content: string }[] = d.outputs ?? [];
  const glb = outputs.map((o) => o.content).find((c) => typeof c === 'string' && c.toLowerCase().includes('.glb'));
  if (!glb) {jobs.delete(String(taskId));persistJobs();return { taskId, status: 4, error: '任务成功但没有返回 GLB' };}

  const manifest = loadManifest();
  if (manifest[key] && existsSync(join(MODEL_DIR, manifest[key].file))) {
    return { taskId, status: 3, url: `/models/${manifest[key].file}`, key };
  }

  let download=downloading.get(key);
  if (!download) {
    download=(async()=>{
    try {
      const file = `${key}.glb`;
      const dest = join(MODEL_DIR, file);
      const r = await fetch(glb, { signal: AbortSignal.timeout(180000) });
      if (!r.ok) throw new Error(`下载 GLB 失败 HTTP ${r.status}`);
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 1024) throw new Error('GLB 文件异常（体积过小）');
      if(buf.readUInt32LE(0)!==0x46546c67)throw new Error('下载结果不是有效GLB模型，请稍后继续查询');
      writeFileSync(dest, buf);
      const rec: AssetRecord = {
        key,
        file,
        prompt: meta?.prompt ?? '',
        nodeId: meta?.nodeId,
        nodeLabel: meta?.nodeLabel,
        family: meta?.family,
        generation: meta?.generation,
        taskId,
        bytes: statSync(dest).size,
        createdAt: new Date().toISOString(),
        modelVersion: 'G1-Turbo',
      };
      manifest[key] = rec;
      saveManifest({...loadManifest(),[key]:rec});
      jobs.delete(String(taskId));persistJobs();
    } finally {
      downloading.delete(key);
    }
    })();downloading.set(key,download);
  }
  await download;
  return { taskId, status: 3, url: `/models/${key}.glb`, key };
}

export function manifestStats() {
  const m = loadManifest();
  const items = Object.values(m);
  return {
    count: items.length,
    bytes: items.reduce((s, i) => s + (i.bytes ?? 0), 0),
    families: items.reduce<Record<string, number>>((acc, i) => {
      const k = i.family ?? 'unknown';
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {}),
    items,
  };
}
