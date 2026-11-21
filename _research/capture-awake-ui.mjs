import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const out = '报告/figs-awake';
mkdirSync(out, { recursive: true });
const b = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
});
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
for (const id of ['cup', 'chair', 'umbrella', 'bin']) {
  await p.addInitScript((id) => {
    localStorage.setItem(`living-stage-${id}`, '4');
    localStorage.setItem('living-active-exhibit', id);
  }, id);
  await p.goto(`http://127.0.0.1:8787/?object=${id}&r=fig-demo-${id}`, { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('.life-gallery[data-ready="true"]', { timeout: 30000 });
  await p.waitForTimeout(2400);
  const replay = p.locator('button', { hasText: '再看它动起来' });
  if (await replay.count()) await replay.click();
  await p.waitForTimeout(3000);
  await p.screenshot({ path: `${out}/${id}-ui-demo.png` });
  console.log('ui demo', id);
}
for (let stage = 0; stage < 5; stage++) {
  await p.addInitScript((stage) => {
    localStorage.setItem('living-stage-cup', String(stage));
    localStorage.setItem('living-active-exhibit', 'cup');
  }, stage);
  await p.goto(`http://127.0.0.1:8787/?object=cup&r=fig-stage-${stage}`, { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('.life-gallery[data-ready="true"]', { timeout: 30000 });
  await p.waitForTimeout(2200);
  if (stage === 4) {
    const replay = p.locator('button', { hasText: '再看它动起来' });
    if (await replay.count()) await replay.click();
    await p.waitForTimeout(3000);
  }
  await p.screenshot({ path: `${out}/cup-ui-${stage + 1}.png` });
  console.log('cup ui', stage + 1);
}
await b.close();