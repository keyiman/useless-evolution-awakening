import assert from 'node:assert/strict';
import {growthAt,footAt,kneeAt,bodyPath,STAGES} from '../src/living/motion';
assert.equal(STAGES.length,5);
for(let a=0;a<=4;a+=.025){const g=growthAt(a);for(const v of Object.values(g))assert.ok(Number.isFinite(v)&&v>=0&&v<=1);}
assert.equal(growthAt(0).legs,0);assert.equal(growthAt(2).legs,1);assert.equal(growthAt(4).crown,1);
const distance=(a:number[],b:number[])=>Math.hypot(...a.map((v,i)=>v-b[i]));
for(let t=0;t<12;t+=.025){
 for(let i=0;i<3;i++){
  const f=footAt(t,i);assert.ok(f[1]>=.018-1e-8);
  const angle=i*Math.PI*2/3+Math.PI/2;const hip:[number,number,number]=[Math.cos(angle)*.31,.38,Math.sin(angle)*.31];
  const knee=kneeAt(hip,f,.45,.45,[Math.cos(angle),.25,Math.sin(angle)]);
  assert.ok(Math.abs(distance(knee,hip)-.45)<1e-5);assert.ok(Math.abs(distance(knee,f)-.45)<1e-5);
 }
}
// During stance, a planted toe remains stationary in world space while the body travels.
const world=(t:number,i:number)=>{const p=bodyPath(t),f=footAt(t,i);return [p.x+f[0]*Math.cos(p.yaw)+f[2]*Math.sin(p.yaw),f[1],p.z-f[0]*Math.sin(p.yaw)+f[2]*Math.cos(p.yaw)];};
assert.ok(distance(world(.12,0),world(.32,0))<1e-7);
assert.ok(distance(footAt(1.30,0),footAt(1.35,0))<.12,'no foot teleport at phase boundary');
console.log('Living motion passed: continuous growth, grounded tripod gait, planted stance, exact two-link lengths.');
