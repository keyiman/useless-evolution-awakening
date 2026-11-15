export type NodeStatus='creating'|'generating'|'waiting'|'ready'|'error';
export interface Generation {id:string;parentId:string|null;generation:number;instruction:string;prompt:string;status:NodeStatus;taskId?:number;url?:string;error?:string;createdAt:number}
export interface Workspace {version:1;id:string;title:string;nodes:Generation[];selectedId:string|null}
export const STORAGE_KEY='ue-workshop-v1';
export const MUTATIONS=[
 {name:'行动结构',text:'保留原有主体，让底部长出与主体材质自然连接的关节足，能够支撑身体行走。'},
 {name:'感知器官',text:'保留整体轮廓，让原有把手或边缘逐渐分化成可弯曲的感知触角，连接自然。'},
 {name:'开合变化',text:'把原有开口改造成能够像呼吸一样开合的结构，保留物品的辨识度。'},
 {name:'浮游适应',text:'让主体进化出轻盈的浮游结构，以原有轮廓延展形成，不要简单外挂零件。'},
 {name:'共生生长',text:'让植物或菌丝与主体形成自然共生，沿着原有表面生长，形成一个完整的新生命。'}
];
export function newWorkspace(title='我的进化作品'):Workspace{return {version:1,id:crypto.randomUUID(),title,nodes:[],selectedId:null};}
export function ancestors(s:Workspace,id:string|null){const chain:Generation[]=[];let n=s.nodes.find(n=>n.id===id);while(n){chain.unshift(n);n=s.nodes.find(p=>p.id===n!.parentId);}return chain;}
export function buildPrompt(s:Workspace,parentId:string|null,instruction:string){
 const history=ancestors(s,parentId);
 const inheritance=history.length?`Original object: ${history[0].instruction}\nPrevious evolutionary changes:\n${history.slice(1).map((n,i)=>`${i+1}. ${n.instruction}`).join('\n').slice(-3200)}\nNew mutation requested by the player: ${instruction}`:`Original object requested by the player: ${instruction}`;
 return `${inheritance}\nCreate one complete, coherent, recognizable evolved object. Preserve the original object's identity, material character and useful inherited structures. New parts must grow naturally from or connect physically to the body. One object only, centered, complete silhouette, neutral studio background, no labels, no text, no pedestal, no people. Premium detailed 3D model with PBR materials.`;
}
export function addGeneration(s:Workspace,parentId:string|null,instruction:string):Workspace{
 if(s.nodes.length>=100)throw new Error('本作品已有100代记录，请另开一个作品。');
 if(instruction.trim().length<10||instruction.trim().length>1400)throw new Error('请用10–1400字描述你想要的形态。');
 const parent=s.nodes.find(n=>n.id===parentId);
 if(parentId&&(!parent||parent.status!=='ready'))throw new Error('请先等待这一代模型完成，再继续进化。');
 if(!parentId&&s.nodes.length)throw new Error('第一代已经存在，请从已有一代继续，或新建作品。');
 const node:Generation={id:crypto.randomUUID(),parentId,generation:parent?parent.generation+1:0,instruction:instruction.trim(),prompt:buildPrompt(s,parentId,instruction.trim()),status:'creating',createdAt:Date.now()};
 return {...s,nodes:[...s.nodes,node],selectedId:node.id};
}
export function decodeWorkspace(text:string):Workspace|null{
 try{if(text.length>1500000)return null;const s=JSON.parse(text) as Workspace;if(s.version!==1||typeof s.id!=='string'||typeof s.title!=='string'||s.title.length>80||!Array.isArray(s.nodes)||s.nodes.length>100)return null;
 const seen=new Map<string,Generation>();for(const n of s.nodes){if(typeof n.id!=='string'||seen.has(n.id)||typeof n.instruction!=='string'||n.instruction.length>1400||typeof n.prompt!=='string'||n.prompt.length>7000||!['creating','generating','waiting','ready','error'].includes(n.status)||!Number.isFinite(n.createdAt))return null;
  const p=n.parentId?seen.get(n.parentId):null;if(n.parentId&&!p||!n.parentId&&seen.size||n.generation!==(p?p.generation+1:0))return null;
  if(n.taskId!==undefined&&(!Number.isSafeInteger(n.taskId)||n.taskId<0))return null;if(n.url&&!/^\/models\/[a-f0-9]{20}\.glb$/.test(n.url))return null;if(n.status==='ready'&&!n.url||n.error!==undefined&&typeof n.error!=='string')return null;seen.set(n.id,n);
 }if(s.selectedId!==null&&!seen.has(s.selectedId))return null;return s;}catch{return null;}
}
