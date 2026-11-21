import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const pages=b.contexts()[0].pages(); console.log('pages',pages.length);
const p=pages.at(-1);
console.log('URL',p.url());
console.log((await p.locator('body').innerText()).slice(0,2000));
await p.screenshot({path:'_research/aholo-dialog.png'});
await b.close();
