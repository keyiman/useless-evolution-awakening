import Gallery from './living/Gallery';
import {lazy,Suspense} from 'react';
const Workshop=lazy(()=>import('./workshop/Workshop'));
export default function Root(){return new URLSearchParams(location.search).has('create')?<Suspense fallback={<div style={{padding:40,color:'#d7dfbf'}}>正在打开自主进化工作台…</div>}><Workshop/></Suspense>:<Gallery/>;}
