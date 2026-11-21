import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const pages=b.contexts()[0].pages(); console.log('pages',pages.length);
for(const p of pages){ console.log('URL',p.url()); console.log((await p.locator('body').innerText()).slice(0,600)); }
await b.close();
