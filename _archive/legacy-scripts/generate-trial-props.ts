import 'dotenv/config';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createTextTo3D, findAsset, getTask, jobs, type JobMeta } from '../server/lux3d';
import { TRIAL_PROPS } from '../src/engine/trialProps';

const STATE='_research/trial-prop-jobs.json';
type Pending=JobMeta & { finished?:boolean; url?:string; error?:string };
const pending:Record<string,Pending>=existsSync(STATE)?JSON.parse(readFileSync(STATE,'utf8')):{};
const save=()=>writeFileSync(STATE,JSON.stringify(pending,null,2));
const pause=(ms:number)=>new Promise(r=>setTimeout(r,ms));
async function main(){
  if(!process.argv.includes('--generate')){
    console.log(TRIAL_PROPS.map(p=>({id:p.id,name:p.name,cached:!!findAsset(p.prompt),prompt:p.prompt})));
    console.log('Pass --generate to create missing props. Existing task IDs are resumed.');return;
  }
  for(const prop of TRIAL_PROPS){
    const cached=findAsset(prop.prompt);
    if(cached){console.log('CACHED',prop.id,cached.file);continue;}
    let job=pending[prop.id];
    if(!job){
      const result=await createTextTo3D({prompt:prop.prompt,nodeId:`trial:${prop.id}`,nodeLabel:prop.name,family:'trial',generation:0,faceCount:65000,version:'G1-Turbo'});
      if(result.cachedUrl){console.log('CACHED',prop.id,result.cachedUrl);continue;}
      job={taskId:result.taskId,key:result.key,prompt:prop.prompt,nodeId:`trial:${prop.id}`,nodeLabel:prop.name,family:'trial',generation:0,createdAt:new Date().toISOString()};
      pending[prop.id]=job;save();console.log('CREATED',prop.id,job.taskId);
    }
    if(job.error)throw new Error(`${prop.id}: previous task failed: ${job.error}`);
    jobs.set(String(job.taskId),job);
    const started=Date.now();let last=-1;let failures=0;
    while(Date.now()-started<25*60*1000){
      try{
        const status=await getTask(job.taskId);failures=0;
        if(status.status!==last){console.log('STATUS',prop.id,status.status);last=status.status;}
        if(status.status===3&&status.url){job.url=status.url;job.finished=true;save();console.log('READY',prop.id,status.url);break;}
        if(status.status===4||status.status===6){job.error=status.error??`terminal ${status.status}`;save();throw new Error(`${prop.id}: ${job.error}`);}
      }catch(e){
        if(job.error)throw e;
        failures++;console.log('POLL RETRY',prop.id,(e as Error).message);
        if(failures>=5)throw e;
      }
      await pause(6000);
    }
    if(!job.finished)throw new Error(`${prop.id}: timed out; saved task can be resumed`);
  }
  console.log('All trial props available locally.');
}
main().catch(e=>{console.error('FAILED',e.message);process.exitCode=1;});
