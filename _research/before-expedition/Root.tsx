import App from './App';
import { Lab } from './lab/Lab';

/**
 * 默认进入“器官库”实验：所有可见模型都是事前生成的 Lux3D 资产。
 * 旧的进化树 / 示范路线仍保留在 ?tree=1、?demo=...、?glb=... 与 #s= 分享链接。
 */
export default function Root() {
  const params = new URLSearchParams(location.search);
  const legacy =
    params.has('tree') ||
    params.has('demo') ||
    params.has('glb') ||
    params.has('stage') ||
    location.hash.startsWith('#s=');
  return legacy ? <App /> : <Lab />;
}
