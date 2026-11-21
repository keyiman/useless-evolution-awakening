import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages().at(-1);
await p.locator('button[type=submit]').click();
await p.waitForTimeout(5000);
console.log('URL',p.url());
console.log((await p.locator('body').innerText()).slice(0,1600));
await p.screenshot({path:'_research/aholo-submit.png'});
await b.close();
