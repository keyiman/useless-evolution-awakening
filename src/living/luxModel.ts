import * as THREE from 'three';
import type {ExhibitId} from './exhibits';
const CONFIG={cup:[1.02,1.4],chair:[1.25,1.25],umbrella:[1.40,1.65],bin:[1.25,1.20]} as const;
const COMMON=`
uniform float lifeAge,lifeTime,lifeTravel,lifeDemo,lifeSeat,lifeLid,lifeLidCut,lifeHingeZ,lifeRadius,lifeSide;
uniform vec3 lifeDims;
float lifeS(float x){return smoothstep(0.0,1.0,x);}
mat2 lifeR(float a){return mat2(cos(a),sin(a),-sin(a),cos(a));}
vec3 lifeDeform(vec3 p){
 float wake=lifeS(lifeAge),locomotion=lifeS(lifeAge-1.0),sense=lifeS(lifeAge-2.0),bloom=lifeS(lifeAge-3.0);
 float breathing=sin(lifeTime*1.7)*wake;
 FAMILY_DEFORM
 return p;
}
vec3 lifeNormal(vec3 p,vec3 n){
 FAMILY_NORMAL
 return normalize(n);
}
`;
const DEFORM:Record<ExhibitId,string>={
 cup:`float w=lifeS((lifeSide*p.x-lifeRadius*.88)/(lifeRadius*.28));
 p.x=mix(p.x,lifeSide*lifeRadius*.93,w*sense);p.y=mix(p.y,lifeDims.y*.53,w*sense*.65);
 p.xz*=1.0+breathing*.012;`,
 chair:`float leg=1.0-smoothstep(lifeSeat*.88,lifeSeat,p.y);
 float phase=lifeTravel*3.3+(p.x*p.z>0.0?0.0:3.14159265);
 float swing=sin(phase)*locomotion;
 float bend=pow(clamp((lifeSeat-p.y)/lifeSeat,0.0,1.0),1.4);
 p.z+=swing*.14*bend*leg;
 p.y+=max(0.0,swing)*.075*bend*leg;
 p.x+=sign(p.x)*bloom*.055*bend*leg;p.z+=sign(p.z)*bloom*.035*bend*leg;
 float back=smoothstep(lifeSeat+lifeDims.y*.10,lifeDims.y,p.y);
 p.z+=back*back*(sense*sin(lifeTime*1.1)*.065+bloom*(.06+.04*sin(lifeTime*.8)));
 p.x+=back*sense*sin(lifeTime*.85)*.06;
 p.y+=bloom*back*back*.12;
 p.y+=breathing*.012*smoothstep(lifeSeat-.025,lifeSeat+.08,p.y)*(1.0-back);`,
 umbrella:`float canopy=smoothstep(lifeDims.y*.53,lifeDims.y*.69,p.y);
 float angle=atan(p.z,p.x),r=length(p.xz),edge=smoothstep(.1,lifeRadius,r);
 float open=1.0+breathing*.045+bloom*.10;
 p.xz*=mix(1.0,open,canopy);
 p.y+=canopy*(breathing*.035*edge+sense*sin(angle*5.0+lifeTime*1.5)*.035*edge);
 float tail=1.0-canopy;p.x+=tail*sin(lifeTime*1.5)*.045*locomotion*(1.0-p.y/lifeDims.y);`,
 bin:`float lid=step(lifeLidCut,p.y);
 float opening=wake*(.08+.06*sin(lifeTime*1.6))+sense*(.13+.15*sin(lifeTime*1.2))+bloom*(.18+.32*sin(lifeTime*1.05));
 if(lid>.5){vec2 q=p.yz-vec2(lifeLid,lifeHingeZ);q=lifeR(opening)*q;p.yz=q+vec2(lifeLid,lifeHingeZ);}
 float body=1.0-lid;p.xz*=1.0+breathing*.009*body;
 p.y+=body*locomotion*.018*sin(lifeTravel*3.4)*smoothstep(.0,lifeLid,p.y);`
};
const NORMAL:Record<ExhibitId,string>={
 cup:'',
 chair:`float leg=1.0-smoothstep(lifeSeat*.88,lifeSeat,p.y);float bend=sin(lifeTravel*3.3+(p.x*p.z>0.0?0.0:3.14159265))*lifeS(lifeAge-1.0)*leg*.15;n.yz=lifeR(bend)*n.yz;`,
 umbrella:`float canopy=smoothstep(lifeDims.y*.53,lifeDims.y*.69,p.y);n.xz*=1.0-sin(lifeTime*1.7)*lifeS(lifeAge)*.04*canopy;`,
 bin:`if(p.y>lifeLidCut){float opening=lifeS(lifeAge)*(.08+.06*sin(lifeTime*1.6))+lifeS(lifeAge-2.0)*(.13+.15*sin(lifeTime*1.2))+lifeS(lifeAge-3.0)*(.18+.32*sin(lifeTime*1.05));n.yz=lifeR(opening)*n.yz;}`
};
export function prepareLuxModel(source:THREE.Object3D,family:ExhibitId){
 source.updateMatrixWorld(true);const originalBounds=new THREE.Box3().setFromObject(source),size=originalBounds.getSize(new THREE.Vector3()),center=originalBounds.getCenter(new THREE.Vector3());
 const [height,span]=CONFIG[family],scale=Math.min(height/Math.max(.001,size.y),span/Math.max(.001,size.x,size.z));
 const transform=new THREE.Matrix4().makeScale(scale,scale,scale).multiply(new THREE.Matrix4().makeTranslation(-center.x,-originalBounds.min.y,-center.z));
 const root=new THREE.Group(),meshes:THREE.Mesh[]=[];root.userData.source='Aholo Lux3D';
 source.traverse(o=>{const src=o as THREE.Mesh;if(!src.isMesh)return;const geometry=src.geometry.clone(),position=geometry.getAttribute('position'),expanded=new THREE.Float32BufferAttribute(new Float32Array(position.count*3),3);for(let i=0;i<position.count;i++)expanded.setXYZ(i,position.getX(i),position.getY(i),position.getZ(i));geometry.setAttribute('position',expanded);
  const normal=geometry.getAttribute('normal');if(normal){const normals=new THREE.Float32BufferAttribute(new Float32Array(normal.count*3),3);for(let i=0;i<normal.count;i++)normals.setXYZ(i,normal.getX(i),normal.getY(i),normal.getZ(i));geometry.setAttribute('normal',normals);}geometry.applyMatrix4(transform.clone().multiply(src.matrixWorld));
  const clone=(m:THREE.Material)=>{const mat=m.clone() as THREE.MeshStandardMaterial;if('envMapIntensity' in mat)mat.envMapIntensity=1.0;return mat;};
  const mesh=new THREE.Mesh(geometry,Array.isArray(src.material)?src.material.map(clone):clone(src.material));mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;root.add(mesh);meshes.push(mesh);
 });
 const bounds=new THREE.Box3().setFromObject(root),dims=bounds.getSize(new THREE.Vector3());
 // The top rim of a cup locates its body independently of the projecting handle.
 let bodyX=0,bodyZ=0,radius=Math.min(dims.x,dims.z)*.5;
 if(family==='cup'){
  const rim=new THREE.Box3();for(const mesh of meshes){const p=mesh.geometry.getAttribute('position');for(let i=0;i<p.count;i++)if(p.getY(i)>dims.y*.96)rim.expandByPoint(new THREE.Vector3(p.getX(i),p.getY(i),p.getZ(i)));}
  if(!rim.isEmpty()){const c=rim.getCenter(new THREE.Vector3());bodyX=c.x;bodyZ=c.z;radius=Math.min(rim.max.x-rim.min.x,rim.max.z-rim.min.z)*.5;for(const mesh of meshes)mesh.geometry.translate(-bodyX,0,-bodyZ);}
 }
 const hist=Array.from({length:50},()=>0);
 for(const mesh of meshes){const p=mesh.geometry.getAttribute('position');for(let i=0;i<p.count;i++)hist[Math.min(49,Math.max(0,Math.floor(p.getY(i)/Math.max(.001,dims.y)*50)))]++;}
 const strongest=(a:number,b:number)=>{let index=a;for(let i=a;i<=b;i++)if(hist[i]>hist[index])index=i;return (index+.5)/50*dims.y;};
 const seat=strongest(17,30);let lid=strongest(28,38),lidCut=lid+.012,hingeZ=-radius*.86;
 if(family==='bin'){
  const slices=Array.from({length:60},()=>({minZ:Infinity,maxZ:-Infinity,count:0}));
  for(const mesh of meshes){const p=mesh.geometry.getAttribute('position');for(let i=0;i<p.count;i++){const row=slices[Math.min(59,Math.max(0,Math.floor(p.getY(i)/dims.y*60)))];row.count++;row.minZ=Math.min(row.minZ,p.getZ(i));row.maxZ=Math.max(row.maxZ,p.getZ(i));}}
  for(let i=33;i<53;i++){const prev=slices[i-1],row=slices[i];if(prev.count&&row.count&&prev.maxZ-prev.minZ>radius*1.5&&row.maxZ-row.minZ<radius*.7){lidCut=i/60*dims.y;lid=lidCut-.02;hingeZ=prev.minZ+.012;break;}}
 }
 const uniforms={lifeAge:{value:0},lifeTime:{value:0},lifeTravel:{value:0},lifeDemo:{value:0},lifeDims:{value:dims},lifeSeat:{value:seat},lifeLid:{value:lid},lifeLidCut:{value:lidCut},lifeHingeZ:{value:hingeZ},lifeRadius:{value:radius},lifeSide:{value:bodyX<0?1:-1}};
 const common=COMMON.replace('FAMILY_DEFORM',DEFORM[family]).replace('FAMILY_NORMAL',NORMAL[family]);
 const install=(material:THREE.Material,normal:boolean)=>{material.onBeforeCompile=shader=>{Object.assign(shader.uniforms,uniforms);shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\n'+common).replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed=lifeDeform(transformed);');if(normal)shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nobjectNormal=lifeNormal(position,objectNormal);');};material.customProgramCacheKey=()=>`lux-life-${family}-${normal}`;};
 for(const mesh of meshes){for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material])install(m,true);const depth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});install(depth,false);mesh.customDepthMaterial=depth;}
 return {root,meshes,dims,radius,seat,lid,lidCut,uniforms,dispose:()=>{for(const mesh of meshes){mesh.geometry.dispose();for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material])m.dispose();mesh.customDepthMaterial?.dispose();}}};
}
