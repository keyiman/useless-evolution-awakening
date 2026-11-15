import fs from 'node:fs';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
/** Geometry tests stub only image decoding; real texture decoding is verified in browser QA. */
export async function loadLuxSource(url:string){
 (globalThis as any).Image=class{height=1;onload:any;set src(_v:string){queueMicrotask(()=>this.onload?.());}};
 (globalThis as any).self=globalThis;(globalThis as any).createImageBitmap=async()=>({width:1,height:1});(globalThis as any).ProgressEvent=class{constructor(..._args:any[]){}};
 const bytes=fs.readFileSync('public'+url);
 return (await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene;
}
