import {useEffect,useMemo,useRef} from 'react';
import {useGLTF} from '@react-three/drei';
import {useFrame,type ThreeEvent} from '@react-three/fiber';
import * as THREE from 'three';
import {EXHIBIT_MAP,type ExhibitId} from './exhibits';
import {prepareLuxModel} from './luxModel';
import {growthAt,bodyPath} from './motion';
import type {LifeClock} from './LivingCup';

export function useLuxModel(family:ExhibitId,clock:{current:LifeClock},onReady?:()=>void){
 const {scene}=useGLTF(EXHIBIT_MAP[family].url);
 const model=useMemo(()=>prepareLuxModel(scene,family),[scene,family]);
 useEffect(()=>{onReady?.();},[model,onReady]);
 useEffect(()=>()=>model.dispose(),[model]);
 useFrame(()=>{const c=clock.current,u=model.uniforms;u.lifeAge.value=c.age;u.lifeTime.value=c.time;u.lifeTravel.value=c.travel;u.lifeDemo.value=c.mode==='demo'?1:0;});
 return model;
}
export function LuxObject({family,clock,onTouch,onReady}:{family:Exclude<ExhibitId,'cup'>;clock:{current:LifeClock};onTouch:()=>void;onReady:()=>void}){
 const model=useLuxModel(family,clock,onReady),root=useRef<THREE.Group>(null);
 useFrame(()=>{
  if(!root.current)return;const c=clock.current,g=growthAt(c.age),p=bodyPath(c.travel),active=c.mode==='demo'?1:.28;
  root.current.position.set(p.x*g.legs*.6,0,p.z*g.legs*.45);root.current.rotation.set(0,p.yaw*g.legs,0);root.current.scale.setScalar(1);
  if(family==='chair'){
   root.current.rotation.y+=g.feelers*Math.sin(c.time*.85)*.10*active;
   root.current.rotation.z=Math.sin(c.time*1.6)*.006*g.wake;
  }else if(family==='umbrella'){
   root.current.position.y=g.legs*(.18+.045*Math.sin(c.time*1.5));
   root.current.rotation.z=g.legs*Math.sin(c.time*.9)*(.025+g.feelers*.055);
   root.current.rotation.x=g.feelers*Math.sin(c.time*.7)*.035;
   root.current.rotation.y+=g.feelers*Math.sin(c.time*.65)*.15;
  }else{
   const roll=Math.sin(c.travel*3.4)*.075*g.legs;
   root.current.rotation.z=roll;root.current.position.y=Math.abs(Math.sin(roll))*model.dims.x*.5;
   root.current.rotation.y+=g.feelers*Math.sin(c.time*.9)*.11*active;
  }
 });
 const touch=(e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();if(e.delta<5)onTouch();};
 return <group ref={root} onClick={touch}><primitive object={model.root}/></group>;
}
