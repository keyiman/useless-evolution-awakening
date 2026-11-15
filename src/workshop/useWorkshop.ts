import {useEffect,useRef,useState} from 'react';
import {addGeneration,buildPrompt,decodeWorkspace,newWorkspace,STORAGE_KEY,type Workspace,type Generation} from './state';
const load=()=>{try{return decodeWorkspace(localStorage.getItem(STORAGE_KEY)??'')??newWorkspace();}catch{return newWorkspace();}};
async function api(path:string,signal:AbortSignal,body?:unknown){const r=await fetch(path,{signal:AbortSignal.any([signal,AbortSignal.timeout(60000)]),...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});const data=await r.json();if(!r.ok)throw new Error(data.error??'请求暂时未成功');return data;}
function delay(ms:number,signal:AbortSignal){return new Promise<void>((resolve,reject)=>{const done=()=>{signal.removeEventListener('abort',cancel);resolve();};const id=setTimeout(done,ms);const cancel=()=>{clearTimeout(id);reject(new DOMException('Stopped','AbortError'));};signal.addEventListener('abort',cancel,{once:true});});}
export function useWorkshop(){
 const [session,setSession]=useState<Workspace>(load),[notice,setNotice]=useState('');const latest=useRef(session);latest.current=session;
 const active=session.nodes.find(n=>n.status==='creating'||n.status==='generating');
 const patch=(id:string,value:Partial<Generation>)=>setSession(s=>({...s,nodes:s.nodes.map(n=>n.id===id?{...n,...value}:n)}));
 useEffect(()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(session));}catch{setNotice('本机存储空间不足，请先导出记录。');}},[session]);
 useEffect(()=>{
  if(!active)return;const id=active.id,ctrl=new AbortController();let stopped=false;
  const run=async()=>{
   let node=latest.current.nodes.find(n=>n.id===id)!;
   if(!node.taskId){try{const created=await api('/api/lux3d/generate',ctrl.signal,{prompt:node.prompt,nodeId:node.id,nodeLabel:latest.current.title,family:'custom',generation:node.generation,version:'G1-Turbo'});if(stopped)return;
    if(created.cachedUrl){patch(id,{status:'ready',url:created.cachedUrl,taskId:created.taskId,error:undefined});return;}
    if(!Number.isSafeInteger(created.taskId)||created.taskId<=0)throw new Error('没有取得有效任务编号');node={...node,taskId:created.taskId};patch(id,{status:'generating',taskId:created.taskId,error:undefined});
   }catch(e){if(!stopped)patch(id,{status:'error',error:e instanceof Error?e.message:'提交失败，请重试'});return;}}
   let failures=0;const started=Date.now();
   while(!stopped){
    try{const result=await api(`/api/lux3d/task/${node.taskId}`,ctrl.signal);if(stopped)return;failures=0;
     if(result.status===3&&typeof result.url==='string'&&/^\/models\/[a-f0-9]{20}\.glb$/.test(result.url)){patch(id,{status:'ready',url:result.url,error:undefined});return;}
     if(result.status===4||result.status===6){patch(id,{status:'error',taskId:undefined,error:result.error??'这一代没有生成成功，可以修改描述后另试，或重新提交。'});return;}
     patch(id,{status:'generating',error:undefined});
    }catch(e){if(stopped)return;if(++failures>=3){patch(id,{status:'waiting',error:e instanceof Error?e.message:'暂时无法查询任务'});return;}}
    if(Date.now()-started>20*60*1000){patch(id,{status:'waiting',error:'等待较久，可稍后继续查询；无需重新提交。'});return;}
    try{await delay(Math.min(16000,3500*(failures+1)),ctrl.signal);}catch{return;}
   }
  };void run();return()=>{stopped=true;ctrl.abort();};
 },[active?.id]);
 const submit=(instruction:string)=>{try{const s=latest.current;if(s.nodes.some(n=>n.status==='creating'||n.status==='generating'))throw new Error('请先等待当前生成完成，或停止等待。');const chosen=s.nodes.find(n=>n.id===s.selectedId);if(chosen?.status==='error'){if(instruction.trim().length<10||instruction.length>1400)throw new Error('请用10–1400字描述你想要的形态。');patch(chosen.id,{instruction:instruction.trim(),prompt:buildPrompt(s,chosen.parentId,instruction.trim()),status:'creating',taskId:undefined,error:undefined});}else setSession(addGeneration(s,s.selectedId,instruction));setNotice('');return true;}catch(e){setNotice(e instanceof Error?e.message:'暂时无法提交');return false;}};
 return {session,setSession,notice,setNotice,active,submit,select:(id:string)=>setSession(s=>({...s,selectedId:id})),resume:(id:string)=>{const n=latest.current.nodes.find(n=>n.id===id);if(n&&!active)patch(id,{status:n.taskId?'generating':'creating',error:undefined});},stop:(id:string)=>patch(id,{status:'waiting',error:'已停止本页等待。Aholo任务仍可能继续，稍后可恢复查询。'}),restart:(title:string)=>setSession(newWorkspace(title.trim()||'我的进化作品'))};
}
