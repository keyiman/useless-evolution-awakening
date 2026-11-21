import { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TRIAL_PROPS } from '../engine/trialProps';
import { normalizeModel } from './attachment';
import { trialDeviceFrame } from './trialDeviceMotion';

export type TrialPlayback={stage:number;passed:boolean;run:number};

export function TrialDevice({stage,url,trial,onReady}:{stage:number;url:string;trial:TrialPlayback|null;onReady:(url:string)=>void}){
  const {scene}=useGLTF(url);
  const device=useMemo(()=>{
    const def=TRIAL_PROPS[stage];
    const model=normalizeModel(scene,def.height,def.span);
    model.traverse(o=>{
      const m=o as THREE.Mesh;if(!m.isMesh)return;
      m.castShadow=m.receiveShadow=true;
      const clone=(mat:THREE.Material)=>{const c=mat.clone() as THREE.MeshStandardMaterial;if('envMapIntensity'in c)c.envMapIntensity=.9;return c;};
      m.material=Array.isArray(m.material)?m.material.map(clone):clone(m.material);
    });
    return model;
  },[scene,stage]);
  const carrier=useRef<THREE.Group>(null);
  const powerLight=useRef<THREE.PointLight>(null);
  const cable=useRef<THREE.Group>(null);
  const start=useRef(-1);
  const wind=useRef<THREE.Group>(null);
  const windMaterial=useRef<THREE.MeshBasicMaterial>(null);
  const cablePath=useMemo(()=>new THREE.CatmullRomCurve3([
    new THREE.Vector3(.72,.16,-.03),new THREE.Vector3(.61,.035,.08),new THREE.Vector3(.39,.025,.12),new THREE.Vector3(.25,.15,.02)
  ]),[]);
  useEffect(()=>{onReady(url);},[url,onReady]);
  useEffect(()=>{start.current=-1;},[trial?.run,stage]);
  useEffect(()=>()=>device.traverse(o=>{const m=o as THREE.Mesh;if(m.isMesh)for(const mat of Array.isArray(m.material)?m.material:[m.material])mat.dispose();}),[device]);
  useFrame(s=>{
    if(start.current<0)start.current=s.clock.elapsedTime;
    const elapsed=s.clock.elapsedTime-start.current;
    const active=trial?.stage===stage;
    const f=trialDeviceFrame(active?elapsed:null);
    if(carrier.current&&stage===0)carrier.current.position.x=f.carriage;
    if(wind.current){wind.current.visible=f.wind>.02;wind.current.position.x=-.55+(elapsed*.85%1.1);}
    if(windMaterial.current)windMaterial.current.opacity=f.wind*.32;
    if(powerLight.current)powerLight.current.intensity=f.power*.35;
    if(cable.current){cable.current.scale.x=1-.35*f.disconnect;cable.current.position.x=.252*f.disconnect;}
  });
  return <group>
    {stage===0?<>
      <group position={[.70,.014,-.06]}>
        {[-.11,.11].map(z=><mesh key={z} position={[0,0,z]} receiveShadow><boxGeometry args={[1.13,.024,.025]}/><meshStandardMaterial color="#58675e" metalness={.8} roughness={.4}/></mesh>)}
      </group>
      <group ref={carrier} position={[.92,.025,-.06]}><primitive object={device}/></group>
    </>:stage===1?<>
      <group position={[-.95,.012,.18]} rotation={[0,1.65,0]}><primitive object={device}/></group>
      <group ref={wind} visible={false}>
        {Array.from({length:12},(_,i)=><mesh key={i} position={[(i%3)*.12,.15+Math.floor(i/3)*.12,-.2+Math.sin(i*3)*.17]} rotation={[0,0,Math.PI/2]}>
          <cylinderGeometry args={[.002,.002,.18,5]}/><meshBasicMaterial ref={i===0?windMaterial:undefined} color="#b7ddd2" transparent opacity={.22}/>
        </mesh>)}
      </group>
    </>:<>
      <group position={[.78,.012,-.08]} rotation={[0,.65,0]}><primitive object={device}/></group>
      <group ref={cable}>
        <mesh><tubeGeometry args={[cablePath,28,.015,8,false]}/><meshStandardMaterial color="#222925" roughness={.7}/></mesh>
        <mesh position={[.25,.15,.02]} rotation={[0,0,-Math.PI/2]}><cylinderGeometry args={[.026,.026,.07,12]}/><meshStandardMaterial color="#c9b08c" metalness={.3} roughness={.55}/></mesh>
      </group>
      <pointLight ref={powerLight} position={[.78,.3,.1]} color="#bcebad" intensity={.35} distance={1.2}/>
    </>}
  </group>;
}
