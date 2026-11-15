import {useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import type {LifeClock} from './LivingCup';

const PALETTE=['#57776a','#77917a','#668c7b','#7d8099','#a49377'];
const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,1.0,1.0);}`;
const fragment=`
varying vec2 vUv;
uniform vec3 accent;
uniform float aspect;
float grain(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
 vec2 p=(vUv-vec2(.55,.53))*vec2(aspect,1.0);
 float glow=exp(-dot(p,p)*5.8);
 float aureole=exp(-pow((length(p)-.37)*14.0,2.0))*.10;
 float shaft=exp(-pow((p.x+p.y*.42-.18)*3.8,2.0))*.10;
 vec3 base=mix(vec3(.006,.013,.012),vec3(.015,.028,.024),vUv.y);
 vec3 color=base+accent*(glow*.40+aureole+shaft);
 color+=(grain(gl_FragCoord.xy)-.5)*.0018;
 gl_FragColor=vec4(color,1.0);
 #include <colorspace_fragment>
}`;
function Backdrop({clock}:{clock:{current:LifeClock}}){
 const {size}=useThree();
 const colors=useMemo(()=>PALETTE.map(c=>new THREE.Color(c)),[]);
 const uniforms=useMemo(()=>({accent:{value:colors[0].clone()},aspect:{value:1}}),[colors]);
 useFrame(()=>{const a=THREE.MathUtils.clamp(clock.current.age,0,4),i=Math.floor(a);uniforms.accent.value.copy(colors[i]).lerp(colors[Math.min(i+1,4)],a-i);uniforms.aspect.value=size.width/Math.max(1,size.height);});
 return <mesh frustumCulled={false} renderOrder={-1000}><planeGeometry args={[2,2]}/><shaderMaterial vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} depthTest={false} depthWrite={false} toneMapped={false}/></mesh>;
}
function stoneTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
 const context=canvas.getContext('2d')!;const image=context.createImageData(512,512);
 let seed=941;for(let i=0;i<image.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)|0;const n=((seed>>>0)/4294967296-.5)*8;image.data[i]=73+n;image.data[i+1]=89+n;image.data[i+2]=76+n;image.data[i+3]=255;}
 context.putImageData(image,0,0);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(3,3);return texture;
}
export function ExhibitEnvironment({clock}:{clock:{current:LifeClock}}){
 const {gl,scene,camera,size}=useThree();const rim=useRef<THREE.MeshStandardMaterial>(null);
 const texture=useMemo(stoneTexture,[]);
 const plinth=useMemo(()=>new THREE.LatheGeometry([
  new THREE.Vector2(0,-.14),new THREE.Vector2(1.20,-.14),new THREE.Vector2(1.25,-.125),new THREE.Vector2(1.265,-.10),new THREE.Vector2(1.255,-.075),new THREE.Vector2(1.235,-.065),new THREE.Vector2(1.23,-.018),new THREE.Vector2(1.215,-.005),new THREE.Vector2(0,-.005)
 ],128),[]);
 useEffect(()=>{const generator=new THREE.PMREMGenerator(gl),room=new RoomEnvironment(),map=generator.fromScene(room,.04);scene.environment=map.texture;return()=>{scene.environment=null;map.dispose();room.dispose();generator.dispose();};},[gl,scene]);
 useEffect(()=>()=>{texture.dispose();},[texture]);
 useEffect(()=>{const aspect=size.width/Math.max(1,size.height),d=Math.max(4.5,3.65/aspect);camera.position.copy(new THREE.Vector3(1.65,1.0,2.5).normalize().multiplyScalar(d).add(new THREE.Vector3(0,.67,0)));camera.lookAt(0,.77,0);},[camera,size.width,size.height]);
 useFrame(()=>{if(rim.current)rim.current.emissiveIntensity=clock.current.mode==='grow'?.22:.07;});
 return <>
  <Backdrop clock={clock}/>
  <ambientLight intensity={.45}/>
  <directionalLight position={[2.4,5,3.5]} intensity={2.1} castShadow shadow-mapSize={[1024,1024]} shadow-radius={3} shadow-normalBias={.012} shadow-bias={-.0002}><orthographicCamera attach="shadow-camera" args={[-2.2,2.2,2.2,-2.2,.1,12]}/></directionalLight>
  <directionalLight position={[-3,2,1]} intensity={.85} color="#b1cbbd"/>
  <directionalLight position={[0,3,-3]} intensity={2.15} color="#ecd3ad"/>
  <mesh geometry={plinth} castShadow receiveShadow><meshStandardMaterial map={texture} roughness={.83} color="#a4b4a4"/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.003,0]}><ringGeometry args={[1.157,1.16,128]}/><meshStandardMaterial ref={rim} color="#b6b495" metalness={.4} roughness={.6} emissive="#d1c69c" emissiveIntensity={.07}/></mesh>
  <mesh position={[0,-.074,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.24,.003,8,128]}/><meshStandardMaterial color="#a5a282" roughness={.5} metalness={.5}/></mesh>
  <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,-.16,0]}><planeGeometry args={[12,12]}/><shadowMaterial transparent opacity={.20}/></mesh>
 </>;
}
