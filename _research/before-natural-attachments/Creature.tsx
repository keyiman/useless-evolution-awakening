import { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { normalizeModel, organModel, attachmentLayout } from './attachment';
import { discoveries } from '../engine/expedition';
import { ORGAN_MAP, type OrganId } from '../engine/organs';
import type { FamilyId } from '../engine/types';
import { morphBody } from './morphology';

function prepare(root: THREE.Object3D) {
  root.traverse(o => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    m.castShadow = m.receiveShadow = true;
    const clone = (mat: THREE.Material) => {
      const c = mat.clone() as THREE.MeshStandardMaterial;
      if ('envMapIntensity' in c) c.envMapIntensity = 1.15;
      return c;
    };
    m.material = Array.isArray(m.material) ? m.material.map(clone) : clone(m.material);
  });
}
function Joint({ from, to, color }: { from: number[]; to: number[]; color: string }) {
  const { middle, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const delta = b.clone().sub(a);
    return { middle: a.add(b).multiplyScalar(.5), length: Math.max(.02, delta.length()), quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0), delta.normalize()) };
  }, [from, to]);
  return <group>
    <mesh position={middle} quaternion={quaternion}><cylinderGeometry args={[.025,.038,length,12]} /><meshStandardMaterial color="#bab7a9" metalness={.5} roughness={.5}/></mesh>
    <mesh position={new THREE.Vector3(...from)}><sphereGeometry args={[.045,12,8]} /><meshStandardMaterial color={color} roughness={.48} metalness={.35}/></mesh>
  </group>;
}
function GrowingPart({ scene, id, position, joint }: {scene: THREE.Object3D;id: OrganId;position: [number,number,number];joint: [number,number,number]}) {
  const ref = useRef<THREE.Group>(null);
  const progress = useRef(0);
  useFrame((state, dt) => {
    progress.current = Math.min(1, progress.current + dt*1.6);
    if (!ref.current) return;
    const t = progress.current;
    ref.current.scale.setScalar(Math.max(.001, 1-Math.pow(1-t,3)));
    if (id === 'eye') ref.current.rotation.y = Math.sin(state.clock.elapsedTime*.9)*.18;
    if (id === 'solar') ref.current.rotation.z = Math.sin(state.clock.elapsedTime*.7)*.035;
  });
  return <group>
    <Joint from={joint} to={position} color={ORGAN_MAP[id].color} />
    <group position={position} ref={ref}><primitive object={scene}/></group>
  </group>;
}
export function Creature({ family, organs, baseUrl, organUrls, trial, onReady, environmentStage }: {
  family: FamilyId; organs: OrganId[]; baseUrl: string; organUrls: Record<string,string>;
  trial: {stage:number;passed:boolean;run:number} | null; onReady?:()=>void;
  environmentStage?:number;
}) {
  const baseGltf = useGLTF(baseUrl);
  const active = useMemo(() => organs.filter(id=>!!organUrls[id]), [organs,organUrls]);
  const urls = useMemo(()=>active.length ? active.map(id=>organUrls[id]) : [baseUrl],[active,organUrls,baseUrl]);
  const gltfs = useGLTF(urls);
  const base = useMemo(()=>{
    const normalized=normalizeModel(baseGltf.scene,.92,1.12);
    const b=morphBody(normalized,organs); prepare(b); return b;
  },[baseGltf,organs]);
  const models = useMemo(()=>{
    const width = new THREE.Box3().setFromObject(base).getSize(new THREE.Vector3()).x;
    return active.map((id,i)=>{ const m=organModel(gltfs[i].scene,id,width); prepare(m.scene); return {id,...m}; });
  },[active,gltfs,base]);
  const layout = useMemo(()=>attachmentLayout(base,family,models),[base,family,models]);
  const group = useRef<THREE.Group>(null);
  const start = useRef(-1);
  const combos = discoveries(organs);
  const drifter = combos.some(c=>c.id==='drifter');
  const watcher = combos.some(c=>c.id==='watcher');
  const rooted = combos.some(c=>c.id==='rooted');
  const camera = useThree(s=>s.camera);
  const controls = useThree(s=>s.controls) as unknown as {target:THREE.Vector3;update:()=>void}|undefined;
  const viewport = useThree(s=>s.size);
  useEffect(()=>{
    // Bounds are in specimen coordinates. The committed base already has its parent's lift.
    const b=new THREE.Box3(
      new THREE.Vector3(-layout.dims.x/2,layout.lift,-layout.dims.z/2),
      new THREE.Vector3(layout.dims.x/2,layout.lift+layout.dims.y,layout.dims.z/2),
    );
    for(const m of models){const p=layout.parts.find(p=>p.id===m.id)!;
      b.expandByPoint(new THREE.Vector3(...p.position).addScaledVector(m.size,.5));
      b.expandByPoint(new THREE.Vector3(...p.position).addScaledVector(m.size,-.5));
    }
    if(drifter)b.max.y+=.22;
    if(environmentStage!==undefined){
      const minX=environmentStage===1?-1.30:.18;
      const maxX=environmentStage===1?-.40:1.40;
      b.expandByPoint(new THREE.Vector3(minX,0,-.62));
      b.expandByPoint(new THREE.Vector3(maxX,.72,.5));
    }
    const d=b.getSize(new THREE.Vector3());const center=b.getCenter(new THREE.Vector3());
    const aspect=viewport.width/Math.max(1,viewport.height);
    const distance=Math.max(2.8,Math.max(d.y*1.65,d.x/aspect*1.4)/(2*Math.tan(35*Math.PI/360)));
    const direction=new THREE.Vector3(1.95,.7,2.15).normalize();
    center.y+=d.y*.03;
    camera.position.copy(center).addScaledVector(direction,distance);camera.lookAt(center);
    if(controls){controls.target.copy(center);controls.update();}
  },[base,models,layout,drifter,camera,controls,viewport.width,viewport.height,environmentStage]);
  useEffect(()=>{ start.current=-1; },[trial?.run]);
  useEffect(()=>{ onReady?.(); },[models,onReady]);
  useEffect(()=>()=>{base.traverse(o=>{const m=o as THREE.Mesh;if(!m.isMesh)return;m.geometry.dispose();for(const mat of Array.isArray(m.material)?m.material:[m.material])mat.dispose();});},[base]);
  useEffect(()=>()=>{for(const model of models)model.scene.traverse(o=>{const m=o as THREE.Mesh;if(m.isMesh)for(const mat of Array.isArray(m.material)?m.material:[m.material])mat.dispose();});},[models]);
  useFrame((state)=>{
    if(!group.current) return;
    if(start.current<0) start.current=state.clock.elapsedTime;
    const elapsed=state.clock.elapsedTime-start.current;
    const g=group.current;
    const t=state.clock.elapsedTime;
    g.position.set(0,0,0);g.rotation.set(0,0,0);
    if(drifter) {g.position.y=.13+Math.sin(t*1.7)*.045;g.rotation.z=Math.sin(t)*.04;}
    else if(watcher) {g.position.x=Math.sin(t*.7)*.06;g.rotation.y=Math.sin(t*.9)*.12;}
    else if(organs.includes('spring')) {g.position.y=Math.abs(Math.sin(t*2))*.06;}
    if(!trial) return;
    const p=Math.min(1,Math.max(0,(elapsed-.65)/1.5));
    if(trial.stage===0) {
      if(trial.passed) {g.position.x=-Math.sin(p*Math.PI/2)*.55;g.rotation.y=-p*.55;if(organs.includes('balloon'))g.position.y+=p*.15;}
      else {g.position.y=p*.2;g.rotation.z=p*.16;}
    } else if(trial.stage===1) {
      const strength=Math.sin(Math.min(elapsed/3.8,1)*Math.PI);
      g.rotation.z+=Math.sin(elapsed*14)*(trial.passed?.035:.25)*strength;
      g.position.x+=(trial.passed?.015:.22)*Math.sin(elapsed*5)*strength;
    } else {
      g.rotation.y=Math.sin(elapsed*.9)*.16;
      if(!trial.passed)g.rotation.z=Math.min(elapsed*.04,.13);
    }
  });
  return <group ref={group}>
    <group position={[0,layout.lift+.008,0]}><primitive object={base}/></group>
    {family==='chair' && layout.lift>0 && <group>
      {[-1,1].flatMap(x=>[-1,1].map(z=><Joint key={`${x}-${z}`} from={[x*layout.dims.x*.36,layout.lift+.025,z*layout.dims.z*.35]} to={[0,layout.lift-.025,0]} color="#b6baa7"/>))}
    </group>}
    {models.filter(m=>m.id!=='mycelium').map(m=>{const p=layout.parts.find(p=>p.id===m.id)!;return <GrowingPart key={`${family}-${m.id}`} scene={m.scene} id={m.id} position={p.position} joint={p.joint}/>;})}
    {organs.includes('mycelium') && <Roots base={base} lift={layout.lift} rooted={rooted}/>}
    {drifter && <mesh position={[.2,.15,0]} rotation={[0,0,-Math.PI/2]}><coneGeometry args={[.045,.18,12]}/><meshBasicMaterial color="#c9b7ff" transparent opacity={.65}/></mesh>}
  </group>;
}
function Roots({base,lift,rooted}:{base:THREE.Object3D;lift:number;rooted:boolean}) {
  const curves=useMemo(()=>{
    base.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(base);const center=box.getCenter(new THREE.Vector3());
    const ray=new THREE.Raycaster();const paths:THREE.CatmullRomCurve3[]=[];
    for(let i=0;i<(rooted?9:6);i++){
      let points:THREE.Vector3[]=[];
      const flush=()=>{if(points.length>1)paths.push(new THREE.CatmullRomCurve3(points));points=[];};
      for(let j=0;j<17;j++){
        const y=box.min.y+(box.max.y-box.min.y)*(.05+j*.045);
        const a=i*Math.PI*2/(rooted?9:6)+j*.065;
        const dir=new THREE.Vector3(-Math.cos(a),0,-Math.sin(a));
        ray.set(new THREE.Vector3(center.x-dir.x*2,y,center.z-dir.z*2),dir);
        const hit=ray.intersectObject(base,true)[0];
        if(!hit){flush();continue;}
        const p=hit.point.clone().addScaledVector(dir,-.009);p.y+=lift;
        if(!points.length&&j<4){
          const end=p.clone();end.y=.012;end.x+=Math.cos(a)*.2;end.z+=Math.sin(a)*.2;
          points.push(end,new THREE.Vector3((end.x+p.x)/2,.025,(end.z+p.z)/2));
        }
        points.push(p);
      }
      flush();
    }
    return paths;
  },[base,lift,rooted]);
  return <group>{curves.map((c,i)=><mesh key={i}><tubeGeometry args={[c,40,rooted?.009:.006,5,false]}/><meshStandardMaterial color={rooted?'#acc89a':'#8fba8d'} roughness={.9}/></mesh>)}</group>;
}

