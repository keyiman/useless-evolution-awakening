export type V3=[number,number,number];
export const clamp=(v:number)=>Math.max(0,Math.min(1,v));
export const smooth=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};
export const STAGES=[
 {name:'原物',verb:'静静存在',title:'它还只是，一只杯子。',text:'熟悉的杯口、弯曲的把手。先绕着它看看，故事从这里开始。',change:'陶瓷杯 · 尚未苏醒',action:'静物观察',color:'#c5c4b6'},
 {name:'苏醒',verb:'第一次呼吸',title:'某种生命，正在里面醒来。',text:'杯壁有了轻轻的呼吸，底部鼓起三个幼小的芽。原本坚硬的陶瓷，开始柔软。',change:'杯壁呼吸 · 三足萌芽',action:'呼吸与试探',color:'#c4d5b4'},
 {name:'行走',verb:'迈出第一步',title:'它决定，自己去别处。',text:'三个芽伸成关节足，轮流撑起身体、试探地面。杯子第一次不再等待被人拿走。',change:'三只关节足 · 交替落地',action:'三足行走',color:'#a8c7ae'},
 {name:'感知',verb:'好奇地探查',title:'熟悉的把手，成了它的触角。',text:'杯把慢慢收回，两端向前生长。新生的触角轻轻摆动，它会停下、侧身，寻找周围的动静。',change:'杯把分化 · 双触角感知',action:'转向与探查',color:'#c2b9d9'},
 {name:'绽放',verb:'向世界舒展',title:'它不再盛放东西。它盛开自己。',text:'杯口分化出六片陶瓷冠瓣，像呼吸一样缓缓开合。行走、感知、舒展，终于属于同一个生命。',change:'六瓣冠 · 开合呼吸',action:'完整生命演示',color:'#dfbf9f'},
];
export function growthAt(age:number){return {wake:smooth(age),legs:smooth(age-1),feelers:smooth(age-2),crown:smooth(age-3)};}
export function bodyPath(t:number){return {x:.34*Math.sin(t*.48),z:.19*(Math.cos(t*.48)-1),yaw:.32*Math.sin(t*.48)};}
function contact(t:number,i:number):V3 {const p=bodyPath(t),a=i*Math.PI*2/3+Math.PI/2;return [p.x+.70*Math.cos(a-p.yaw),.018,p.z+.70*Math.sin(a-p.yaw)];}
export function footAt(t:number,i:number):V3 {
 const period=1.9,offset=i/3,raw=t/period+offset,phase=raw-Math.floor(raw),start=(Math.floor(raw)-offset)*period;
 const a=contact(start,i),b=contact(start+period,i),u=smooth((phase-.68)/.32);
 const world:V3=[a[0]+(b[0]-a[0])*u,.018+(phase>.68?Math.sin(Math.PI*clamp((phase-.68)/.32))*.17:0),a[2]+(b[2]-a[2])*u];
 const p=bodyPath(t),x=world[0]-p.x,z=world[2]-p.z;
 return [x*Math.cos(p.yaw)-z*Math.sin(p.yaw),world[1],x*Math.sin(p.yaw)+z*Math.cos(p.yaw)];
}
export function kneeAt(hip:V3,foot:V3,l1:number,l2:number,bend:V3):V3 {
 const d=foot.map((v,i)=>v-hip[i]),length=Math.hypot(...d),n=d.map(v=>v/Math.max(length,1e-8));
 const reach=Math.min(l1+l2-.000001,Math.max(Math.abs(l1-l2)+.000001,length));
 const along=(l1*l1-l2*l2+reach*reach)/(2*reach),height=Math.sqrt(Math.max(0,l1*l1-along*along));
 const dot=bend.reduce((s,v,i)=>s+v*n[i],0),side=bend.map((v,i)=>v-dot*n[i]),sn=Math.hypot(...side)||1;
 return hip.map((v,i)=>v+n[i]*along+side[i]/sn*height) as V3;
}
