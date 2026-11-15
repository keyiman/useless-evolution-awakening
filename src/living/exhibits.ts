import catalog from '../lab/assetCatalog.json';
import {STAGES} from './motion';
export type ExhibitId='cup'|'chair'|'umbrella'|'bin';
export type StageInfo=typeof STAGES[number];
const stage=(name:string,verb:string,title:string,text:string,change:string,action:string,color='#b7c8ae'):StageInfo=>({name,verb,title,text,change,action,color});
export const EXHIBITS:{id:ExhibitId;name:string;number:string;english:string;url:string;source:string;stages:StageInfo[]}[]=[
 {id:'cup',name:'水杯',number:'001',english:'CERAMIC LIFE',url:catalog.bases.cup,source:'Aholo Lux3D · G1-Turbo',stages:STAGES},
 {id:'chair',name:'椅子',number:'002',english:'WOODLAND WANDERER',url:catalog.bases.chair,source:'Aholo Lux3D · G1-Turbo',stages:[
  stage('原物','等待被坐下','它一直，在原地等候。','木纹、软垫与四条安静的椅腿。这一次，没有人要坐下来。','木椅 · 尚未苏醒','静物观察'),
  stage('苏醒','木头的呼吸','木头深处，有了自己的节奏。','软垫轻轻起伏，椅背像刚醒来一样微微弯曲。四条腿开始试着承重。','软垫起伏 · 椅腿试探','苏醒与试探'),
  stage('迈步','四足慢行','四条椅腿，第一次为自己走路。','原有的椅腿交替弯曲、抬起，再放回地面。它不再需要谁搬动。','四足分区 · 交替迈步','四足行走'),
  stage('探身','转背张望','靠背，学会了好奇。','椅背柔韧地转向两侧，座面随之侧倾。它停下来，像在听周围的声音。','椅背转向 · 座面回应','转身与张望','#c2b9d9'),
  stage('舒展','木质的伸展','它终于，能让自己放松。','四足撑开，椅背向后舒展，软垫跟着呼吸起伏。熟悉的木椅有了自己的性格。','四足舒展 · 椅背伸腰','行走、张望与伸展','#dfbf9f')
 ]},
 {id:'umbrella',name:'雨伞',number:'003',english:'AERIAL BLOOM',url:catalog.bases.umbrella,source:'Aholo Lux3D · G1-Turbo',stages:[
  stage('原物','等待一场雨','它曾经，只为挡雨而展开。','伞面撑开，伞柄垂下。停在展台上的它，还不知道风也可以是邀请。','布面雨伞 · 尚未苏醒','静物观察'),
  stage('苏醒','伞面的呼吸','第一缕风，让它醒了过来。','伞面沿着伞骨缓慢收拢、舒张。每一片布面都开始回应空气。','伞骨收放 · 布面呼吸','伞面收放'),
  stage('浮游','离开地面','它撑住的，不再只是雨。','伞面有节奏地起伏，带动整把伞轻轻离地。伞柄成为平衡身体的尾巴。','伞面推进 · 悬浮平衡','浮游与摆尾'),
  stage('感风','倾身寻风','它会转向，看不见的风。','伞沿一片接一片地翻起，身体随风偏转，再慢慢找回平衡。','伞沿波动 · 方向感知','倾转与感风','#c2b9d9'),
  stage('舒展','空中的花','这一次，它为自己盛开。','布面舒展成更宽的轮廓，伞柄轻摆。呼吸、浮游与感风，汇成一次完整的飞行。','伞面舒展 · 完整浮游','浮游、感风与舒展','#dfbf9f')
 ]},
 {id:'bin',name:'垃圾桶',number:'004',english:'QUIET KEEPER',url:catalog.bases.bin,source:'Aholo Lux3D · G1-Turbo',stages:[
  stage('原物','沉默的容器','它装下过，许多被丢弃的东西。','金属桶身、脚踏与半开的桶盖。它一直安静地站着。','金属容器 · 尚未苏醒','静物观察'),
  stage('苏醒','第一次回应','这一次，是它自己想打开。','桶盖微微动了动，桶壁开始收放。踏板没有被踩下，它却有了回应。','桶盖轻动 · 桶壁呼吸','桶盖与呼吸'),
  stage('挪动','摇摆着前行','笨拙，也是一种自己的步伐。','桶底左右交替撑起，身体小心地挪动，再把重量落回地面。','桶底承重 · 左右挪动','摇摆挪动'),
  stage('感知','侧身倾听','桶盖，成了它的表情。','它侧过身体，桶盖缓慢张开，又像思考一样合拢。每一次停顿都有了情绪。','桶盖回应 · 侧身感知','倾听与回应','#c2b9d9'),
  stage('开合','向外界回应','它也可以，主动迎接世界。','桶盖打开，桶身舒展，再轻轻合拢。它不再只是被动的容器。','铰链开合 · 全身舒展','挪动、倾听与开合','#dfbf9f')
 ]}
];
export const EXHIBIT_MAP=Object.fromEntries(EXHIBITS.map(e=>[e.id,e])) as Record<ExhibitId,typeof EXHIBITS[number]>;
interface StorageLike {getItem:(key:string)=>string|null;setItem:(key:string,value:string)=>void}
export function readProgress(store:StorageLike,id:ExhibitId){try{const n=Number(store.getItem(`living-stage-${id}`)??(id==='cup'?store.getItem('living-cup-stage'):null));return Number.isInteger(n)&&n>=0&&n<=4?n:0;}catch{return 0;}}
export function writeProgress(store:StorageLike,id:ExhibitId,stage:number){try{store.setItem(`living-stage-${id}`,String(stage));}catch{}}
