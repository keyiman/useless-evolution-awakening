import {useCallback,useEffect,useState} from 'react';
import {useGLTF} from '@react-three/drei';
import {useWorkshop} from './useWorkshop';
import {ancestors,buildPrompt,MUTATIONS,type Generation} from './state';
import {Preview,type DisplayMotion} from './Preview';
import '../living/gallery.css';
import './workshop.css';
const STATUS={creating:'正在提交',generating:'Aholo生成中',waiting:'等待已暂停',ready:'模型已完成',error:'需要重试'};
function initialDrafts(){try{return JSON.parse(localStorage.getItem('ue-workshop-drafts')??'{}') as Record<string,string>;}catch{return {};}}
export default function Workshop(){
 const {session,setSession,notice,setNotice,active,submit,select,resume,stop,restart}=useWorkshop();
 const [drafts,setDrafts]=useState(initialDrafts),[motion,setMotion]=useState<DisplayMotion>('still'),[paused,setPaused]=useState(false),[readyUrl,setReadyUrl]=useState(''),[version,setVersion]=useState(0),[resetOpen,setResetOpen]=useState(false),[keyReady,setKeyReady]=useState<boolean|null>(null);
 const chosen=session.nodes.find(n=>n.id===session.selectedId),chain=ancestors(session,session.selectedId),preview=[...chain].reverse().find(n=>n.status==='ready'&&n.url),draftKey=`${session.id}:${session.selectedId??'root'}`;
 const draft=drafts[draftKey]??(chosen?.status==='error'?chosen.instruction:''),editable=!chosen||chosen.status==='ready'||chosen.status==='error',errorEditing=chosen?.status==='error';
 const onReady=useCallback(()=>setReadyUrl(preview?.url??''),[preview?.url]);
 useEffect(()=>{fetch('/api/health').then(r=>r.json()).then(d=>setKeyReady(!!d.hasKey)).catch(()=>setKeyReady(false));},[]);
 useEffect(()=>{try{localStorage.setItem('ue-workshop-drafts',JSON.stringify(drafts));}catch{}},[drafts]);
 useEffect(()=>{setMotion('still');setPaused(false);},[preview?.url]);
 useEffect(()=>{if(!resetOpen)return;const previous=document.activeElement as HTMLElement|null,dialog=document.querySelector('.life-modal');const buttons=Array.from(dialog?.querySelectorAll('button')??[]);buttons[0]?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setResetOpen(false);if(e.key==='Tab'&&buttons.length){if(e.shiftKey&&document.activeElement===buttons[0]){e.preventDefault();buttons.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===buttons.at(-1)){e.preventDefault();buttons[0]?.focus();}}};window.addEventListener('keydown',key);return()=>{window.removeEventListener('keydown',key);previous?.focus();};},[resetOpen]);
 const change=(text:string)=>{setDrafts(d=>({...d,[draftKey]:text.slice(0,1400)}));setNotice('');};
 const generate=()=>{if(submit(draft)&&innerWidth<=760)document.querySelector('.work-view')?.scrollIntoView({behavior:'smooth',block:'start'});};
 const retryPreview=()=>{if(preview?.url)useGLTF.clear(preview.url);setReadyUrl('');setVersion(v=>v+1);};
 const exportRecord=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(session,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`${session.title.replace(/[\\/:*?"<>|]/g,'_')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 const finalPrompt=draft?buildPrompt(session,errorEditing?chosen!.parentId:session.selectedId,draft):chosen?.prompt;
 return <div className="life-gallery workshop" data-selected={chosen?.id??''} data-status={chosen?.status??'empty'}>
  <header className="life-header"><a href="./" className="life-brand"><span>✳</span><div><strong>废物进化论</strong><small>YOUR OWN EVOLUTION</small></div></a><nav className="work-modes"><a href="./">动态进化展</a><span>自主进化</span></nav><button className="life-text-button" onClick={()=>setResetOpen(true)}>新建作品 ＋</button></header>
  <main className="work-layout">
   <section className="work-editor"><span className="life-eyebrow">PROMPT → FORM → EVOLUTION</span><h1>{!chosen?'让想法，长出形态。':errorEditing?'调整描述，再试一次。':'下一次变化，由你决定。'}</h1><label className="work-label" htmlFor="work-title">作品名称</label><input id="work-title" maxLength={60} value={session.title} onChange={e=>setSession(s=>({...s,title:e.target.value}))}/>
    <div className="work-editor-title"><label className="work-label" htmlFor="work-prompt">{!chosen?'第一代物品描述':errorEditing?'修改这一代的描述':`从第${chosen.generation+1}代继续变异`}</label><span>{draft.length}/1400</span></div>
    <textarea id="work-prompt" maxLength={1400} value={draft} disabled={!editable} onChange={e=>change(e.target.value)} placeholder={!chosen?'例如：一只矮胖的白色陶瓷茶壶，有圆形把手和短壶嘴，整体温和、细节清晰。':'描述你希望新增、改变或保留的结构。建议一次集中改变一两个特征。'}/>
    {chosen?.status==='ready'&&<div className="work-suggestions"><p>变异灵感 · 点击填入后，可以自由修改</p><div>{MUTATIONS.map(m=><button key={m.name} onClick={()=>change(m.text)}>{m.name} ↗</button>)}</div></div>}
    {!chosen&&<button className="work-example" onClick={()=>change('一只矮胖的白色陶瓷茶壶，有圆形把手和短壶嘴，表面温润，完整物体，背景简洁。')}>试试：温润的陶瓷茶壶 ↗</button>}
    {finalPrompt&&<details className="work-prompt-details"><summary>查看提交给 Aholo 的完整提示词</summary><pre>{finalPrompt}</pre></details>}
    {notice&&<p className="work-notice" role="alert">{notice}</p>}
    <button className="life-primary work-generate" disabled={!!active||!editable||draft.trim().length<10||keyReady===false} onClick={generate}>{active?'这一代正在生成…':errorEditing?'修改并重新生成':chosen?'生成下一代':'交给 Aholo 生成'} <span>↗</span></button>
    <p className="work-connection"><i className={keyReady?'ok':''}/>{keyReady===null?'正在检查服务…':keyReady?'服务端 Aholo 密钥已配置':'请先在服务端配置 Aholo 连接'}</p>
    <p className="work-fine">生成会使用服务端 Aholo 额度。每代依据提示词重新生成，可能与上一代存在外形差异；不是对原网格的精确编辑。</p>
   </section>
   <section className="work-view" aria-label="自主生成的3D模型展台" data-ready={!!preview&&readyUrl===preview.url}>
    <Preview url={preview?.url} generation={preview?.generation??0} motion={motion} paused={paused} ready={!!preview&&readyUrl===preview.url} onReady={onReady} version={version} retry={retryPreview}/>
    <div className="work-model-heading"><span className="life-eyebrow">{preview?`GENERATION ${String(preview.generation+1).padStart(2,'0')} · AHOLO LUX3D`:'AN OPEN POSSIBILITY'}</span><h2>{session.title}</h2>{preview&&<p>第{preview.generation+1}代 · 拖拽旋转，滚轮缩放</p>}</div>
    {chosen&&chosen.status!=='ready'&&<div className="work-task" role="status"><div><i className={active?.id===chosen.id?'pulsing':''}/><strong>{STATUS[chosen.status]}</strong>{chosen.taskId&&<small>任务 {chosen.taskId}</small>}</div><p>{chosen.error??'真实模型生成需要一些时间，刷新后也会保留任务。'}</p>{preview&&<small>展台暂时保留第{preview.generation+1}代预览，生成完成后展示新模型。</small>}<div className="work-task-actions">{active?.id===chosen.id?<button onClick={()=>stop(chosen.id)}>停止等待</button>:<button disabled={!!active} onClick={()=>resume(chosen.id)}>{chosen.taskId?'继续查询任务':'按原描述重试'}</button>}{chosen.parentId&&<button onClick={()=>select(chosen.parentId!)}>回到上一代</button>}</div></div>}
    {preview&&<div className="work-display"><label htmlFor="work-motion">展示动作 · 后制</label><select id="work-motion" value={motion} onChange={e=>setMotion(e.target.value as DisplayMotion)}><option value="still">静态观察</option><option value="breathe">轻呼吸</option><option value="float">悬浮展示</option></select><button aria-label={paused?'继续展示动作':'暂停展示动作'} onClick={()=>setPaused(p=>!p)}>{paused?'▶':'Ⅱ'}</button><a href={preview.url} download>下载 GLB ↗</a><small>生成模型不自带关节动画</small></div>}
   </section>
   <aside className="work-history"><div className="work-history-head"><div><span className="life-eyebrow">YOUR EVOLUTION TREE</span><h2>形态与分支</h2></div><button disabled={!session.nodes.length} onClick={exportRecord}>导出记录</button></div><p>点任意已完成的一代，可以从那里长出另一条路线。</p>
    <div className="work-tree">{session.nodes.map((n,index)=><button key={n.id} data-node={n.id} aria-pressed={session.selectedId===n.id} className={session.selectedId===n.id?'selected':''} onClick={()=>select(n.id)} style={{marginLeft:Math.min(4,n.generation)*10}}><span><b>第{n.generation+1}代</b><small>{STATUS[n.status]}</small></span><strong>{n.instruction}</strong><small>{n.parentId?`从记录 ${session.nodes.findIndex(p=>p.id===n.parentId)+1} 分支`:'原始物品'} · 记录 {index+1}</small></button>)}{!session.nodes.length&&<div className="work-history-empty">第一代诞生后，<br/>你的进化记录会出现在这里。</div>}</div>
    {chosen&&<details className="work-node-info"><summary>这一代的原始描述</summary><p>{chosen.instruction}</p><small>{new Date(chosen.createdAt).toLocaleString('zh-CN')}</small></details>}
   </aside>
  </main><footer className="life-footer"><span>AHOLO LUX3D · G1-TURBO</span><span>独立工作台 · 不改变预制展品</span><a href="./">返回四件物品的动态展 ↗</a></footer>
  {resetOpen&&<div className="life-modal-backdrop" onClick={()=>setResetOpen(false)}><section className="life-modal" role="dialog" aria-modal="true" aria-label="新建自主进化作品" onClick={e=>e.stopPropagation()}><h2>从一个新的想法开始？</h2><p>当前工作台记录会被替换，建议先导出记录。已提交的 Aholo 任务不会因此取消。</p><div><button className="life-secondary" onClick={()=>setResetOpen(false)}>保留当前作品</button><button className="life-primary" onClick={()=>{restart('我的进化作品');setResetOpen(false);}}>新建作品</button></div></section></div>}
 </div>;
}
