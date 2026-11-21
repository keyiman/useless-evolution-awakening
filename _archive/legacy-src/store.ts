import { create } from 'zustand';
import type { Candidate, EvolutionNode, FamilyId } from './engine/types';
import { buildCandidates, createChild, createFusion, decodeShare, encodeShare, makeRoot } from './engine/evolve';
import { SHOWCASE, showcaseChain } from './engine/showcase';

export type AssetStatus = 'idle' | 'checking' | 'queued' | 'running' | 'done' | 'error';

export interface AssetState {
  status: AssetStatus;
  url?: string;
  taskId?: number;
  error?: string;
  startedAt?: number;
}

export interface RunState {
  seed: string;
  family: FamilyId;
  nodes: Record<string, EvolutionNode>;
  rootId: string;
  currentId: string;
  candidates: Candidate[];
  mode: 'evolve' | 'test';
  testRun: number;
  assets: Record<string, AssetState>;
  showIntro: boolean;
  showShare: boolean;
  toast: string | null;
}

interface Actions {
  init: (family: FamilyId, seed: string) => void;
  setFamily: (family: FamilyId) => void;
  setSeed: (seed: string) => void;
  choose: (slot: number) => void;
  goto: (id: string) => void;
  setMode: (mode: 'evolve' | 'test') => void;
  restartTest: () => void;
  lookup: (node: EvolutionNode) => Promise<void>;
  generate: (node: EvolutionNode) => Promise<void>;
  fusion: (otherId: string) => void;
  shareLink: () => string;
  loadShare: (code: string) => boolean;
  loadShowcase: (family: FamilyId, upto?: number) => void;
  setToast: (t: string | null) => void;
  setShowIntro: (v: boolean) => void;
  setShowShare: (v: boolean) => void;
}

const timers = new Map<string, ReturnType<typeof setTimeout>>();

async function lookupAsset(prompt: string): Promise<{ url: string; taskId?: number } | null> {
  try {
    const res = await fetch('/api/assets/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url ? { url: data.url, taskId: data.record?.taskId } : null;
  } catch {
    return null;
  }
}

export const useApp = create<RunState & Actions>((set, get) => ({
  seed: 'UE-2026',
  family: 'cup',
  nodes: {},
  rootId: '',
  currentId: '',
  candidates: [],
  mode: 'evolve',
  testRun: 0,
  assets: {},
  showIntro: true,
  showShare: false,
  toast: null,

  init: (family, seed) => {
    timers.forEach((t) => clearTimeout(t));
    timers.clear();
    const root = makeRoot(family, seed);
    set({
      seed,
      family,
      nodes: { [root.id]: root },
      rootId: root.id,
      currentId: root.id,
      candidates: buildCandidates(root, seed),
      mode: 'evolve',
      assets: {},
      testRun: 0,
      showIntro: false,
    });
    void get().lookup(root);
  },

  setFamily: (family) => {
    const { seed } = get();
    get().init(family, seed);
  },

  setSeed: (seed) => {
    const s = seed.trim() || 'UE-2026';
    get().init(get().family, s);
  },

  choose: (slot) => {
    const { candidates, nodes, currentId, assets } = get();
    const cand = candidates[slot];
    if (!cand) return;
    const parent = nodes[currentId];
    const child = createChild(parent, cand);
    set({
      nodes: { ...nodes, [child.id]: child },
      currentId: child.id,
      candidates: buildCandidates(child, child.worldSeed),
      mode: 'evolve',
      assets: { ...assets, [child.hash]: { status: 'idle' } },
    });
    void get().lookup(child);
  },

  goto: (id) => {
    const { nodes } = get();
    const node = nodes[id];
    if (!node) return;
    set({ currentId: id, candidates: buildCandidates(node, node.worldSeed), mode: 'evolve' });
    void get().lookup(node);
  },

  setMode: (mode) => set({ mode, testRun: mode === 'test' ? get().testRun + 1 : get().testRun }),
  restartTest: () => set({ testRun: get().testRun + 1 }),

  lookup: async (node) => {
    const { assets } = get();
    const cur = assets[node.hash];
    if (cur && (cur.status === 'done' || cur.status === 'running' || cur.status === 'queued')) return;
    set({ assets: { ...get().assets, [node.hash]: { status: 'checking' } } });
    const hit = await lookupAsset(node.prompt);
    if (hit) {
      set({ assets: { ...get().assets, [node.hash]: { status: 'done', url: hit.url, taskId: hit.taskId } } });
    } else {
      set({ assets: { ...get().assets, [node.hash]: { status: 'idle' } } });
    }
  },

  generate: async (node) => {
    const { assets } = get();
    const busy = Object.values(assets).some((a) => a.status === 'queued' || a.status === 'running');
    if (busy) {
      set({ toast: '已有一个 Lux3D 任务在进行，请等待完成（避免并发超限）' });
      return;
    }
    set({ assets: { ...get().assets, [node.hash]: { status: 'queued', startedAt: Date.now() } } });
    try {
      const res = await fetch('/api/lux3d/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: node.prompt,
          nodeId: node.id,
          nodeLabel: node.label,
          family: node.family,
          generation: node.generation,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '创建任务失败');
      if (data.cachedUrl) {
        set({ assets: { ...get().assets, [node.hash]: { status: 'done', url: data.cachedUrl, taskId: data.taskId } } });
        return;
      }
      set({ assets: { ...get().assets, [node.hash]: { status: 'running', taskId: data.taskId, startedAt: Date.now() } } });
      poll(node, data.taskId, set, get);
    } catch (err: any) {
      set({ assets: { ...get().assets, [node.hash]: { status: 'error', error: String(err?.message ?? err) } } });
    }
  },

  fusion: (otherId) => {
    const { nodes, currentId, seed } = get();
    const a = nodes[currentId];
    const b = nodes[otherId];
    if (!a || !b || a.id === b.id) return;
    const node = createFusion(a, b, seed);
    set({
      nodes: { ...nodes, [node.id]: node },
      currentId: node.id,
      candidates: buildCandidates(node, seed),
      mode: 'evolve',
    });
    void get().lookup(node);
  },

  shareLink: () => {
    const { seed, family, nodes, currentId, rootId } = get();
    const path: number[] = [];
    let cur = nodes[currentId];
    while (cur && cur.id !== rootId) {
      const parent = nodes[cur.parentIds[0]];
      if (!parent) break;
      const cands = buildCandidates(parent, seed);
      const slot = cands.findIndex((c) => c.hash === cur.hash);
      if (slot < 0) break;
      path.unshift(slot);
      cur = parent;
    }
    const code = encodeShare({ seed, family, path });
    const base = `${location.origin}${location.pathname}`;
    return `${base}#s=${code}`;
  },

  loadShare: (code) => {
    const state = decodeShare(code);
    if (!state) return false;
    get().init(state.family, state.seed);
    let node = get().nodes[get().rootId];
    for (const slot of state.path) {
      const cands = buildCandidates(node, state.seed);
      const cand = cands[slot];
      if (!cand) break;
      node = createChild(node, cand);
      const nodes = { ...get().nodes, [node.id]: node };
      set({ nodes, currentId: node.id, candidates: buildCandidates(node, state.seed) });
    }
    void get().lookup(node);
    return true;
  },

  loadShowcase: (family, upto) => {
    timers.forEach((t) => clearTimeout(t));
    timers.clear();
    const full = showcaseChain(family);
    const chain = typeof upto === 'number' ? full.slice(0, Math.max(1, Math.min(full.length, upto + 1))) : full;
    const nodes = Object.fromEntries(chain.map((n) => [n.id, n]));
    const last = chain[chain.length - 1];
    const seed = SHOWCASE[family].seed;
    set({
      seed,
      family,
      nodes,
      rootId: chain[0].id,
      currentId: last.id,
      candidates: buildCandidates(last, seed),
      mode: 'evolve',
      assets: {},
      testRun: 0,
      showIntro: false,
    });
    void get().lookup(last);
  },

  setToast: (toast) => {
    set({ toast });
    if (toast) setTimeout(() => set({ toast: null }), 2600);
  },
  setShowIntro: (showIntro) => set({ showIntro }),
  setShowShare: (showShare) => set({ showShare }),
}));

function poll(
  node: EvolutionNode,
  taskId: number,
  set: (partial: Partial<RunState>) => void,
  get: () => RunState & Actions,
  attempt = 0,
) {
  const tick = async () => {
    try {
      const res = await fetch(`/api/lux3d/task/${taskId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '查询失败');
      if (data.status === 3 && data.url) {
        set({ assets: { ...get().assets, [node.hash]: { status: 'done', url: data.url, taskId } } });
        return;
      }
      if (data.status === 4 || data.status === 6) {
        set({ assets: { ...get().assets, [node.hash]: { status: 'error', error: data.error || '生成失败/已取消', taskId } } });
        return;
      }
      if (attempt > 150) {
        set({ assets: { ...get().assets, [node.hash]: { status: 'error', error: '轮询超时（10 分钟）', taskId } } });
        return;
      }
    } catch (err: any) {
      if (attempt > 150) {
        set({ assets: { ...get().assets, [node.hash]: { status: 'error', error: String(err?.message ?? err), taskId } } });
        return;
      }
    }
    const t = setTimeout(() => poll(node, taskId, set, get, attempt + 1), 4000);
    timers.set(node.hash, t);
  };
  void tick();
}

export function currentAsset(state: RunState): AssetState {
  const node = state.nodes[state.currentId];
  if (!node) return { status: 'idle' };
  return state.assets[node.hash] ?? { status: 'idle' };
}
