import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages().at(-1);
const edit=p.getByText('修改选题',{exact:true}).first();
console.log('edit',await edit.count(),await edit.isVisible().catch(()=>false));
await edit.click(); await p.waitForTimeout(1200);
const desc=p.locator('#panel-topic textarea').first();
console.log('textarea',await desc.count());
const text=`如果一只杯子不再盛水，它还能成为什么？

《废物进化论 · 物的觉醒》把水杯、椅子、雨伞、垃圾桶放上同一座展台。每件物品经历五个阶段：原物、苏醒、移动、感知、舒展。杯子长出三足、双触角和六瓣冠；椅子用自己的腿走路；雨伞离地感风；垃圾桶打开盖子，主动迎接世界。

四件主体由 Aholo Lux3D 生成，保留原始纹理；关节、形变与动作由作品后制，原始 GLB 可下载对照。没有分数和输赢，只想让你看一件物品，慢慢成为自己。

“不必有用，也可以有自己的生命。”`;
await desc.fill(text);
await p.getByText('保存修改',{exact:true}).first().click();
await p.waitForTimeout(2200);
console.log((await p.locator('body').innerText()).slice(0,900));
await p.screenshot({path:'_research/aholo-topic-new.png'});
await b.close();
