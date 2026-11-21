import { chromium } from 'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9222');
const p=b.contexts()[0].pages().at(-1);
const urls=p.locator('input[type=url]');
await urls.nth(0).fill('https://www.xiaohongshu.com/explore/6af99ab60000000018028749?xsec_token=YBLRjsOctx_XaWXilg1LVLsU4EhLnzAM4jFgFgA1-DTLk%3D&xsec_source=pc_creatormng');
await urls.nth(1).fill('https://github.com/keyiman/useless-evolution-awakening');
await p.waitForTimeout(500);
// click the two agreement labels by text
for(const txt of ['我确认作品使用 Aholo Lux3D 完成，且可运行、可演示','我已阅读并同意《群核科技 Aholo 全球 3D AI 黑客松参赛作品提交须知》，确认所提交的作品和信息真实、完整，并同意按公布的赛事规则参与资格审核、评审及结果公示。']){
 const loc=p.getByText(txt,{exact:true}).first(); console.log('label',txt.slice(0,10),await loc.count()); if(await loc.count()) await loc.click({force:true});
 await p.waitForTimeout(300);
}
console.log((await p.locator('body').innerText()).slice(0,1100));
await p.screenshot({path:'_research/aholo-filled.png'});
await b.close();
