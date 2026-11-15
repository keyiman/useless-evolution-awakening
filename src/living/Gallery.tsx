import {Component,Suspense,useCallback,useEffect,useRef,useState,type ReactNode} from 'react';
import {Canvas,useFrame} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import * as THREE from 'three';
import {ExhibitEnvironment} from './ExhibitEnvironment';
import {LivingCup,type LifeClock} from './LivingCup';
import {clamp,smooth} from './motion';
import {EXHIBITS,EXHIBIT_MAP,readProgress,writeProgress,type ExhibitId} from './exhibits';
import {LuxObject} from './LuxObject';
import './gallery.css';

type Mode=LifeClock['mode'];
interface Sequence {from:number;target:number;elapsed:number;duration:number}
function loadExhibit():ExhibitId{try{const id=new URLSearchParams(location.search).get('object')??localStorage.getItem('living-active-exhibit');return id&&Object.hasOwn(EXHIBIT_MAP,id)?id as ExhibitId:'cup';}catch{return 'cup';}}
function loadStage(id:ExhibitId){try{return readProgress(localStorage,id);}catch{return 0;}}
class SceneBoundary extends Component<{children:ReactNode},{error:boolean}>{state={error:false};static getDerivedStateFromError(){return {error:true};}render(){return this.state.error?<div className="life-error"><h2>展台暂时没能打开</h2><p>请重新加载页面，再看看它。</p><button onClick={()=>location.reload()}>重新打开</button></div>:this.props.children;}}
function Director({clock,sequence,onMode,onProgress,ready,family}:{clock:{current:LifeClock};sequence:{current:Sequence|null};onMode:(mode:Mode)=>void;onProgress:(v:number)=>void;ready:boolean;family:ExhibitId}){
 const last=useRef(-1);
 useFrame((_,raw)=>{
  const c=clock.current;if(c.paused||!ready)return;const dt=Math.min(raw,.07);c.time+=dt;
  if(c.mode==='grow'&&sequence.current){const s=sequence.current;s.elapsed+=dt;const p=clamp(s.elapsed/s.duration);c.age=s.from+(s.target-s.from)*smooth(p);if(Math.floor(p*40)!==last.current){last.current=Math.floor(p*40);onProgress(p);}if(p===1){c.age=s.target;c.demo=0;c.mode=s.target===0?'idle':'demo';sequence.current=null;onMode(c.mode);}}
  else {
   if(c.mode==='demo')c.demo+=dt;
   const walking=c.mode==='demo'&&c.age>=1.99&&(c.age<2.9||c.demo<3.1);
   if(walking)c.travel+=dt;
   else if(c.age>=1.99){const stride=family==='chair'?Math.PI/3.3:family==='bin'?Math.PI/3.4:1.9/3,stop=Math.ceil((c.travel-1e-7)/stride)*stride;if(stop>c.travel)c.travel=Math.min(stop,c.travel+dt);}
   if(c.mode==='demo'&&c.demo>=7.5){c.mode='idle';onMode('idle');}
  }
 });return null;
}
export default function Gallery(){
 const [family,setFamily]=useState<ExhibitId>(loadExhibit);
 const [ready,setReady]=useState(false);
 const [stage,setStage]=useState(()=>loadStage(family)),[mode,setMode]=useState<Mode>('idle'),[paused,setPaused]=useState(false),[progress,setProgress]=useState(1),[resetOpen,setResetOpen]=useState(false),[touches,setTouches]=useState(0);
 const clock=useRef<LifeClock>({age:stage,time:0,demo:0,travel:0,mode:'idle',paused:false,pointer:[0,0]});
 const sequence=useRef<Sequence|null>(null);
 const status=mode==='grow'?'正在进化':mode==='demo'?'动作演示':'自由观察';const exhibit=EXHIBIT_MAP[family],info=exhibit.stages[stage];
 const onReady=useCallback(()=>setReady(true),[family]);
 useEffect(()=>{try{writeProgress(localStorage,family,stage);localStorage.setItem('living-active-exhibit',family);}catch{}},[family,stage]);
 const select=(id:ExhibitId)=>{if(id===family)return;const saved=loadStage(id);sequence.current=null;clock.current={age:saved,time:0,demo:0,travel:0,mode:'idle',paused:false,pointer:[0,0]};setReady(false);setFamily(id);setStage(saved);setMode('idle');setPaused(false);setProgress(1);setTouches(0);const url=new URL(location.href);url.searchParams.set('object',id);history.replaceState(null,'',url);};
 useEffect(()=>{
  if(!resetOpen)return;const previous=document.activeElement as HTMLElement|null;
  const dialog=document.querySelector<HTMLElement>('.life-modal'),buttons=()=>Array.from(dialog?.querySelectorAll<HTMLButtonElement>('button')??[]);buttons()[0]?.focus();
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setResetOpen(false);if(e.key==='Tab'){const items=buttons();if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===items.at(-1)){e.preventDefault();items[0]?.focus();}}};
  window.addEventListener('keydown',key);return()=>{window.removeEventListener('keydown',key);previous?.focus();};
 },[resetOpen]);
 const evolve=(target:number)=>{const c=clock.current;if(!ready)return;if(target===stage&&mode!=='grow'){replay();return;}sequence.current={from:c.age,target,elapsed:0,duration:4.5+Math.max(0,Math.abs(c.age-target)-1)*1.2};c.mode='grow';c.paused=false;c.demo=0;setMode('grow');setPaused(false);setProgress(0);setStage(target);};
 const replay=()=>{if(mode==='grow'||!ready)return;clock.current.mode=stage?'demo':'idle';clock.current.demo=0;clock.current.paused=false;setMode(stage?'demo':'idle');setPaused(false);};
 const pause=()=>{clock.current.paused=!paused;setPaused(!paused);};
 const reset=()=>{sequence.current=null;clock.current={age:0,time:0,demo:0,travel:0,mode:'idle',paused:false,pointer:[0,0]};setStage(0);setMode('idle');setPaused(false);setProgress(1);setResetOpen(false);};
 const touch=()=>{if(mode==='grow'||stage===0)return;replay();setTouches(n=>n+1);};
 return <div className="life-gallery" data-stage={stage} data-mode={mode} data-paused={paused} data-object={family} data-ready={ready}>
  <header className="life-header"><a href="./" className="life-brand"><span>✳</span><div><strong>废物进化论</strong><small>THE AWAKENING OF THINGS</small></div></a><nav className="life-objects" aria-label="选择进化物品">{EXHIBITS.map(item=><button key={item.id} aria-pressed={family===item.id} className={family===item.id?'selected':''} onClick={()=>select(item.id)} data-object={item.id}><small>{item.number}</small>{item.name}</button>)}</nav><div className="life-header-right"><a href="?create=1" className="life-create-link">自主进化 ＋</a><button className="life-text-button" onClick={()=>setResetOpen(true)}>从头开始 ↺</button></div></header>
  <main className="life-main">
   <section className="life-exhibit" aria-label="可旋转的3D进化展台" onPointerMove={e=>{if(clock.current.paused)return;const r=e.currentTarget.getBoundingClientRect();clock.current.pointer=[(e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height*2-1)];}} onPointerLeave={()=>{clock.current.pointer=[0,0];}}>
    <div className="life-canvas"><SceneBoundary><Canvas shadows dpr={[1,1.5]} camera={{position:[2.4,1.8,3.6],fov:35,near:.05,far:220}} gl={{antialias:true,toneMapping:THREE.ACESFilmicToneMapping}} onCreated={({gl})=>{gl.toneMappingExposure=1.04;}}><ExhibitEnvironment clock={clock}/><Director clock={clock} sequence={sequence} onMode={setMode} onProgress={setProgress} ready={ready} family={family}/><Suspense fallback={null}>{family==='cup'?<LivingCup clock={clock} onTouch={touch} onReady={onReady}/>:<LuxObject key={family} family={family} clock={clock} onTouch={touch} onReady={onReady}/>}</Suspense><OrbitControls makeDefault target={[0,.67,0]} enablePan={false} minDistance={2.5} maxDistance={8} minPolarAngle={.3} maxPolarAngle={Math.PI/2.05} enableDamping/></Canvas></SceneBoundary></div>
    <div className="life-story"><span className="life-eyebrow">SPECIMEN {exhibit.number} · {exhibit.english}</span><h1 key={stage}>{info.title}</h1><p>{info.text}</p><span className="life-change"><i style={{background:info.color}}/>{info.change}</span></div>
    {!ready&&<div className="life-loading" role="status">正在唤起{exhibit.name}的形态…</div>}
    <div className="life-status"><span className={`life-status-dot ${paused?'paused':mode}`}/>{paused?'已暂停':status}<small>0{stage+1} / 05</small></div>
    <div className="life-caption"><span>拖拽旋转 · 滚轮缩放{stage>0?' · 轻点它，唤起动作':''}</span><span>{touches>0?'它注意到了你。':'一件物品，慢慢成为自己。'}</span></div>
    {mode==='grow'&&<div className="life-growth" role="status"><span>形态正在生长 · 完成后自动演示</span><i><b style={{width:`${progress*100}%`}}/></i></div>}
   </section>
   <section className="life-console" aria-label="进化与动作控制"><div className="life-now"><span className="life-eyebrow">{mode==='grow'?'BECOMING':mode==='demo'?'IN MOTION':'OBSERVATION'}</span><h2>{mode==='grow'?`正在获得：${info.change}`:stage===0?'从一次苏醒开始':info.action}</h2><p>{mode==='grow'?'可以暂停，仔细看看它怎样变化。':mode==='demo'?'新生的结构，正在展示自己的动作。':stage===4?'它已经活了过来。随时回看，或再陪它走一会儿。':'继续进化，看看下一个变化。'}</p></div><div className="life-actions"><button className="life-round" aria-label={paused?'继续动画':'暂停动画'} onClick={pause}>{paused?'▶':'Ⅱ'}</button><button className="life-secondary" disabled={!ready||mode==='grow'||stage===0} onClick={replay}>↻ 重播动作</button>{stage<4?<button className="life-primary" disabled={!ready||mode==='grow'} onClick={()=>evolve(stage+1)}>{stage===0?'让它苏醒':'继续进化'} <span>↗</span></button>:<button className="life-primary" disabled={!ready||mode==='grow'} onClick={replay}>再看它动起来 <span>↗</span></button>}</div></section>
   <nav className="life-timeline" aria-label="五个进化阶段">{exhibit.stages.map((s,i)=><button key={s.name} className={`${i===stage?'selected':''} ${i<stage?'past':''}`} aria-current={i===stage?'step':undefined} onClick={()=>evolve(i)} disabled={!ready||mode==='grow'}><span className="life-stage-number">0{i+1}<i/></span><strong>{s.name}</strong><small>{s.verb}</small></button>)}</nav>
  </main>
  <footer className="life-footer"><span>USELESS EVOLUTION</span><span>不必有用，也可以有自己的生命。</span><details className="life-source"><summary>Aholo Lux3D 主体 · 后制动画 ⓘ</summary><div><strong>{exhibit.name} · {exhibit.source}</strong><p>主体使用实际生成的模型及其原始材质。关节、形态变化和动作由本作品另行制作，原始模型不自带动画。</p><a href={exhibit.url} download>下载原始 GLB ↗</a></div></details></footer>
  {resetOpen&&<div className="life-modal-backdrop" onClick={()=>setResetOpen(false)}><section role="dialog" aria-modal="true" aria-label="从原物重新开始" className="life-modal" onClick={e=>e.stopPropagation()}><span className="life-eyebrow">BACK TO THE BEGINNING</span><h2>再看一次，它如何醒来。</h2><p>回到最初的{exhibit.name}，重新经历每一次变化。</p><div><button className="life-secondary" onClick={()=>setResetOpen(false)}>继续观察</button><button className="life-primary" onClick={reset}>从原物开始</button></div></section></div>}
 </div>;
}
