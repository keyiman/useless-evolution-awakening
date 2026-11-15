import {Component,Suspense,useEffect,useMemo,useRef,type ReactNode} from 'react';
import {Canvas,useFrame} from '@react-three/fiber';
import {OrbitControls,useGLTF} from '@react-three/drei';
import * as THREE from 'three';
import {ExhibitEnvironment} from '../living/ExhibitEnvironment';
import type {LifeClock} from '../living/LivingCup';
export type DisplayMotion='still'|'breathe'|'float';
class PreviewBoundary extends Component<{children:ReactNode;retry:()=>void},{error:boolean}>{state={error:false};static getDerivedStateFromError(){return {error:true};}render(){return this.state.error?<div className="work-preview-message"><strong>这一代已保存，模型暂未打开</strong><button onClick={this.props.retry}>重新加载模型</button></div>:this.props.children;}}
function Model({url,motion,paused,onReady}:{url:string;motion:DisplayMotion;paused:boolean;onReady:()=>void}){
 const {scene}=useGLTF(url);const time=useRef(0),carrier=useRef<THREE.Group>(null);
 const model=useMemo(()=>{const root=scene.clone(true);root.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=Math.min(1.55/Math.max(.001,size.y),1.7/Math.max(.001,size.x,size.z));const group=new THREE.Group();group.add(root);root.position.sub(new THREE.Vector3(center.x,box.min.y,center.z));group.scale.setScalar(scale);root.traverse(o=>{const m=o as THREE.Mesh;if(m.isMesh){m.castShadow=m.receiveShadow=true;m.material=Array.isArray(m.material)?m.material.map(x=>x.clone()):m.material.clone();}});return group;},[scene]);
 useEffect(()=>{onReady();},[model,onReady]);useEffect(()=>()=>{model.traverse(o=>{const m=o as THREE.Mesh;if(m.isMesh)for(const mat of Array.isArray(m.material)?m.material:[m.material])mat.dispose();});},[model]);
 useFrame((_,dt)=>{if(!paused)time.current+=Math.min(dt,.07);const root=carrier.current;if(!root)return;root.scale.setScalar(motion==='breathe'?1+Math.sin(time.current*1.5)*.012:1);root.position.y=motion==='float'?.12+Math.sin(time.current*1.3)*.055:0;root.rotation.z=motion==='float'?Math.sin(time.current*.8)*.025:0;});
 return <group ref={carrier}><primitive object={model} dispose={null}/></group>;
}
function Tick({clock,paused}:{clock:{current:LifeClock};paused:boolean}){useFrame((_,dt)=>{if(!paused)clock.current.time+=Math.min(.07,dt);});return null;}
export function Preview({url,generation,motion,paused,ready,onReady,version,retry}:{url?:string;generation:number;motion:DisplayMotion;paused:boolean;ready:boolean;onReady:()=>void;version:number;retry:()=>void}){
 const clock=useRef<LifeClock>({age:0,time:0,demo:0,travel:0,mode:'idle',paused:false,pointer:[0,0]});clock.current.age=Math.min(4,generation);clock.current.paused=paused;
 return <><PreviewBoundary key={`${url}-${version}`} retry={retry}><Canvas shadows dpr={[1,1.5]} camera={{position:[2.4,1.8,3.6],fov:35}} gl={{antialias:true,toneMapping:THREE.ACESFilmicToneMapping}}><ExhibitEnvironment clock={clock}/><Tick clock={clock} paused={paused}/>{url&&<Suspense fallback={null}><Model url={url} motion={motion} paused={paused} onReady={onReady}/></Suspense>}<OrbitControls makeDefault target={[0,.67,0]} enablePan={false} minDistance={2.5} maxDistance={8} maxPolarAngle={Math.PI/2.05}/></Canvas></PreviewBoundary>{!url?<div className="work-empty-preview"><span>✳</span><h2>你的第一件生命，<br/>从一个想法开始。</h2><p>写下物品描述，交给 Aholo 生成真正的3D模型。</p></div>:!ready&&<div className="work-preview-message">正在打开模型…</div>}</>;
}
