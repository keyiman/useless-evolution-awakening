const smooth=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
export function trialDeviceFrame(time:number|null){
  if(time===null)return {carriage:.92,wind:0,power:1,disconnect:0};
  const t=Math.max(0,time);
  const reach=t<1.7?smooth(t/1.7):1-smooth((t-2.1)/1.3);
  const disconnect=smooth((t-.65)/.7);
  return {carriage:.92-.46*reach,wind:t<3.4?Math.sin(t/3.4*Math.PI):0,power:1-disconnect,disconnect};
}
