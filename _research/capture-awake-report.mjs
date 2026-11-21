import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const out = '鎶ュ憡/figs-awake';
mkdirSync(out, { recursive: true });
const b = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
});
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
const css = `html,body,#root{background:#0c1512!important;overflow:hidden!important}
.life-header,.life-console,.life-timeline,.life-footer,.life-story,.life-status,.life-caption,.life-loading,.life-growth{display:none!important}
.life-gallery{height:100vh!important;min-height:0!important}
.life-main{display:block!important;height:100vh!important;padding:0!important}
.life-exhibit{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;min-height:0!important;border:0!important}
.life-canvas{position:absolute!important;inset:0!important;width:100vw!important;height:100vh!important}
.life-canvas canvas{width:100vw!important;height:100vh!important}`;
for (const id of ['cup', 'chair', 'umbrella', 'bin']) {
  await p.addInitScript((id) => {
    localStorage.setItem(`living-stage-${id}`, '4');
    localStorage.setItem('living-active-exhibit', id);
  }, id);
  await p.goto(`http://127.0.0.1:8787/?object=${id}&r=awake-demo-${id}`, { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('.life-gallery[data-ready="true"]', { timeout: 30000 });
  await p.waitForTimeout(2600);
  const replay = p.locator('button', { hasText: '鍐嶇湅瀹冨姩璧锋潵' });
  if (await replay.count()) await replay.click();
  await p.waitForTimeout(3200);
  await p.addStyleTag({ content: css });
  await p.waitForTimeout(350);
  await p.screenshot({ path: `${out}/${id}-clean-5.png` });
  console.log('demo clean', id);
}
// Cup stages 1-5; stage 5 in demo.
for (let stage = 0; stage < 5; stage++) {
  await p.addInitScript((stage) => {
    localStorage.setItem('living-stage-cup', String(stage));
    localStorage.setItem('living-active-exhibit', 'cup');
  }, stage);
  await p.goto(`http://127.0.0.1:8787/?object=cup&r=awake-demo-stage-${stage}`, { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('.life-gallery[data-ready="true"]', { timeout: 30000 });
  await p.waitForTimeout(2400);
  if (stage === 4) {
    const replay = p.locator('button', { hasText: '鍐嶇湅瀹冨姩璧锋潵' });
    if (await replay.count()) await replay.click();
    await p.waitForTimeout(3200);
  }
  await p.addStyleTag({ content: css });
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${out}/cup-clean-${stage + 1}.png` });
  console.log('cup stage', stage + 1);
}
await b.close();
