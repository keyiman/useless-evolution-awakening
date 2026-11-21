import {chromium} from 'playwright-core';
import fs from 'node:fs';
const catalog=JSON.parse(fs.readFileSync('src/lab/assetCatalog.json','utf8'));
const browser=await chromium.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage();
try{
 await page.route('**/__anatomy__.html',r=>r.fulfill({contentType:'text/html',body:'<html><body></body></html>'}));
 await page.goto('http://127.0.0.1:5173/__anatomy__.html');
 console.log(JSON.stringify(await page.evaluate(async(catalog)=>{
  const THREE=await import('/node_modules/three/build/three.module.js');
  const {GLTFLoader}=await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
  const {MeshoptDecoder}=await import('/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js');
  const {normalizeModel,measureAnatomy}=await import('/src/lab/attachment.ts');
  const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);const output={};
  for(const family of ['cup','chair','umbrella','bin']){
   const g=await loader.loadAsync(catalog.bases[family]);const root=normalizeModel(g.scene,.92,1.12);root.updateMatrixWorld(true);
   const box=new THREE.Box3().setFromObject(root);const dims=box.getSize(new THREE.Vector3());const pts=[];
   root.traverse(m=>{if(m.isMesh){const p=m.geometry.getAttribute('position');for(let i=0;i<p.count;i+=2)pts.push(new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld));}});
   const rows=[];for(let y=.35;y<.999;y+=.025){const p=pts.filter(p=>Math.abs(p.y/dims.y-y)<.012);const b=new THREE.Box3().setFromPoints(p);const d=b.getSize(new THREE.Vector3());const c=b.getCenter(new THREE.Vector3());rows.push([+y.toFixed(3),+d.x.toFixed(3),+d.z.toFixed(3),+(d.x*d.z).toFixed(4),+c.z.toFixed(3),p.length]);}
   output[family]={dims:dims.toArray(),rows};
  }
  return output;
 },catalog),null,2));
}finally{await browser.close();}
