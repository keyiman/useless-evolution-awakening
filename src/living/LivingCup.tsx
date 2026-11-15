import {useMemo,useRef} from 'react';
import {useFrame, type ThreeEvent} from '@react-three/fiber';
import * as THREE from 'three';
import {growthAt,footAt,kneeAt,bodyPath,smooth,type V3} from './motion';
import {useLuxModel} from './LuxObject';

export interface LifeClock {age:number;time:number;demo:number;travel:number;mode:'grow'|'demo'|'idle';paused:boolean;pointer:[number,number]}
const UP=new THREE.Vector3(0,1,0);
const CERAMIC='#e4e0cd',SAGE='#8b9c87',BRASS='#b9a17b';
function Ceramic(){return <meshPhysicalMaterial color={CERAMIC} roughness={.26} metalness={.04} clearcoat={.7} clearcoatRoughness={.18}/>;}
function link(mesh:THREE.Mesh,a:V3,b:V3,radius:number){
 const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);
 mesh.position.copy(av.add(bv).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(UP,delta.clone().normalize());mesh.scale.set(radius,delta.length(),radius);
}
function Leg({index,clock}:{index:number;clock:{current:LifeClock}}){
 const root=useRef<THREE.Group>(null),upper=useRef<THREE.Mesh>(null),lower=useRef<THREE.Mesh>(null),joint=useRef<THREE.Mesh>(null),toe=useRef<THREE.Group>(null),hipJoint=useRef<THREE.Mesh>(null);
 useFrame(()=>{
  if(!root.current||!upper.current||!lower.current||!joint.current||!toe.current||!hipJoint.current)return;
  const c=clock.current,g=growthAt(c.age),amount=smooth((c.age-.58)/1.40),a=index*Math.PI*2/3+Math.PI/2;
  root.current.visible=c.age>.48;
  const hip:V3=[Math.cos(a)*.32,.07+.31*g.legs,Math.sin(a)*.32];
  const walked=footAt(c.travel,index);
  const f:V3=[Math.cos(a)*.34+(walked[0]-Math.cos(a)*.34)*amount,.018+(walked[1]-.018)*g.legs,Math.sin(a)*.34+(walked[2]-Math.sin(a)*.34)*amount];
  const knee=kneeAt(hip,f,.45,.45,[Math.cos(a),.30,Math.sin(a)]);
  // Before the legs unfold, the complete limb grows from a compact bud.
  const grow=(p:V3)=>hip.map((v,i)=>v+(p[i]-v)*amount) as V3;
  const k=grow(knee),end=grow(f),thickness=.035*(.15+.85*amount);
  link(upper.current,hip,k,thickness*1.25);link(lower.current,k,end,thickness*.82);
  joint.current.position.set(...k);joint.current.scale.setScalar(.047*(.3+.7*amount));
  hipJoint.current.position.set(...hip);hipJoint.current.scale.setScalar(.068*(.3+.7*amount));
  toe.current.position.set(...end);toe.current.scale.setScalar(.15+.85*amount);toe.current.rotation.y=-a;
 });
 return <group ref={root}>
  <mesh ref={hipJoint} castShadow><sphereGeometry args={[1,24,16]}/><Ceramic/></mesh>
  <mesh ref={upper} castShadow><cylinderGeometry args={[.68,1,1,16]}/><Ceramic/></mesh>
  <mesh ref={joint} castShadow><sphereGeometry args={[1,20,14]}/><meshStandardMaterial color={SAGE} roughness={.5} metalness={.12}/></mesh>
  <mesh ref={lower} castShadow><cylinderGeometry args={[.92,.52,1,16]}/><Ceramic/></mesh>
  <group ref={toe}><mesh castShadow scale={[.082,.027,.059]}><sphereGeometry args={[1,24,12]}/><meshStandardMaterial color={SAGE} roughness={.5}/></mesh><mesh position={[0,.016,0]} scale={[.049,.029,.039]} castShadow><sphereGeometry args={[1,20,12]}/><Ceramic/></mesh></group>
 </group>;
}
function Feeler({index,clock}:{index:number;clock:{current:LifeClock}}){
 const root=useRef<THREE.Group>(null),segments=useRef<(THREE.Group|null)[]>([]),tip=useRef<THREE.Mesh>(null);
 useFrame(()=>{
  const c=clock.current,g=growthAt(c.age).feelers;if(!root.current)return;
  root.current.visible=g>.001;const a=(index===0?.79:2.35)*g;
  root.current.position.set(Math.cos(a)*.395,(index===0?.77:.30)*(1-g)+.91*g,Math.sin(a)*.395);
  root.current.scale.setScalar(Math.max(.001,g));
  const active=c.mode==='demo'?1:.25,scan=c.time*1.4;
  root.current.rotation.set(.48+.10*Math.sin(scan+index)*active,0,(index===0?-.5:.5)+c.pointer[0]*.12*g);
  segments.current.forEach((s,i)=>{if(s){s.rotation.z=Math.sin(scan+i*.65+index*1.8)*.10*active;s.rotation.x=.12+Math.sin(scan*.7+i*.5)*.07*active+c.pointer[1]*.055;}});
  if(tip.current)(tip.current.material as THREE.MeshStandardMaterial).emissiveIntensity=.15+.12*Math.sin(c.time*2+index);
 });
 const node=(i:number):React.ReactNode=><group ref={el=>{segments.current[i]=el;}} position={[0,i? .083:0,0]}>
  <mesh position={[0,.041,0]} castShadow><cylinderGeometry args={[.015-i*.0014,.024-i*.002,.083,12]}/><Ceramic/></mesh>
  <mesh><sphereGeometry args={[.024-i*.002,16,10]}/><meshStandardMaterial color={SAGE} roughness={.45}/></mesh>
  {i<4?node(i+1):<group position={[0,.092,0]}><mesh scale={[.047,.062,.047]} castShadow><sphereGeometry args={[1,24,16]}/><Ceramic/></mesh><mesh ref={tip} position={[0,.013,.035]} scale={[.029,.035,.017]}><sphereGeometry args={[1,24,16]}/><meshStandardMaterial color="#485851" roughness={.16} metalness={.25} emissive="#c6e4b4" emissiveIntensity={.2}/></mesh></group>}
 </group>;
 return <group ref={root}>{node(0)}</group>;
}
function Petal({index,clock}:{index:number;clock:{current:LifeClock}}){
 const root=useRef<THREE.Group>(null);
 const geometry=useMemo(()=>{
  const vertices:number[]=[],uv:number[]=[],ids:number[]=[];
  for(let j=0;j<=14;j++)for(let i=0;i<=12;i++){
   const v=j/14,u=i/12*2-1,width=(.125*Math.cos(v*Math.PI*.48)+.012)*Math.sin(Math.PI*(.14+v*.86));
   vertices.push(u*width,v*.35,.025*Math.sin(v*Math.PI)-.045*u*u*Math.sin(v*Math.PI));uv.push(i/12,v);
   if(j<14&&i<12){const k=j*13+i;ids.push(k,k+13,k+1,k+1,k+13,k+14);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();return g;
 },[]);
 useFrame(()=>{
  const c=clock.current,g=growthAt(c.age).crown;if(!root.current)return;
  root.current.visible=g>.001;root.current.scale.setScalar(Math.max(.001,g));
  const breath=(Math.sin(c.time*1.45-index*.12)+1)/2;
  root.current.rotation.x=(.30+breath*.68+(c.mode==='demo'?.2:0))*g;
 });
 return <group rotation={[0,index*Math.PI/3,0]}><group position={[0,1.015,.405]} ref={root}><mesh geometry={geometry} castShadow><meshPhysicalMaterial color={index%2===0?'#e5dfcf':'#d3d9c2'} roughness={.35} clearcoat={.6} side={THREE.DoubleSide}/></mesh><mesh position={[0,.035,0]} scale={[.07,.08,.026]}><sphereGeometry args={[1,20,12]}/><Ceramic/></mesh></group></group>;
}
export function LivingCup({clock,onTouch,onReady}:{clock:{current:LifeClock};onTouch:()=>void;onReady?:()=>void}){
 const model=useLuxModel('cup',clock,onReady);
 const root=useRef<THREE.Group>(null),body=useRef<THREE.Group>(null),halo=useRef<THREE.Mesh>(null);
 useFrame(()=>{
  const c=clock.current,g=growthAt(c.age),p=bodyPath(c.travel);
  if(root.current){root.current.position.set(p.x*g.legs,0,p.z*g.legs);root.current.rotation.y=p.yaw*g.legs;}
  if(body.current){body.current.position.y=.31*g.legs;const breath=Math.sin(c.time*1.7)*.015*g.wake;body.current.scale.set(1+breath,1-breath*.45,1+breath);body.current.rotation.z=g.wake*Math.sin(c.time*1.4)*.014;body.current.rotation.y=g.feelers*Math.sin(c.time*1.1)*.05;}
  if(halo.current){halo.current.visible=c.mode==='grow';halo.current.scale.setScalar(.85+Math.sin(c.time*2)*.06);(halo.current.material as THREE.MeshBasicMaterial).opacity=.12+.08*Math.sin(c.time*3);}
 });
 const touch=(e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();if(e.delta<5)onTouch();};
 return <group ref={root} onClick={touch}>
  {[0,1,2].map(i=><Leg key={i} index={i} clock={clock}/>)}
  <group ref={body}>
   <primitive object={model.root}/>
   <group scale={[model.radius/.405,model.dims.y/1.02,model.radius/.405]}>
   {[0,1].map(i=><Feeler key={i} index={i} clock={clock}/>)}
   {Array.from({length:6},(_,i)=><Petal key={i} index={i} clock={clock}/>)}
   </group>
  </group>
  <mesh ref={halo} rotation={[-Math.PI/2,0,0]} position={[0,.009,0]}><ringGeometry args={[.77,.78,96]}/><meshBasicMaterial color="#cdddb7" transparent opacity={.2}/></mesh>
 </group>;
}
