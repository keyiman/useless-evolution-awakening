import { chromium } from 'playwright-core';
import { mkdirSync, renameSync } from 'node:fs';

const DIR = '提交材料/video-raw';
mkdirSync(DIR, { recursive: true });

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars'],
});
const context = await browser.newContext({
  viewport: { width: 1600, height: 1000 },
  recordVideo: { dir: DIR, size: { width: 1600, height: 1000 } },
});
const page = await context.newPage();

const cap = async (text) => {
  await page.evaluate((t) => {
    let el = document.getElementById('demo-cap');
    if (!el) {
      el = document.createElement('div');
      el.id = 'demo-cap';
      el.style.cssText =
        'position:fixed;left:50%;top:86px;transform:translateX(-50%);z-index:99999;' +
        'background:rgba(9,12,16,.86);border:1px solid #2b333d;border-radius:999px;' +
        'padding:11px 26px;color:#e9eef5;font:500 17px/1.4 "Microsoft YaHei",sans-serif;' +
        'letter-spacing:.02em;box-shadow:0 10px 30px rgba(0,0,0,.35);white-space:nowrap;';
      document.body.appendChild(el);
    }
    el.textContent = t;
  }, text);
};

const wait = (ms) => page.waitForTimeout(ms);
const clickSlot = async (slot) => {
  await page.locator('.candidate').nth(slot).locator('button.btn.primary').click();
};

await page.goto('http://localhost:5173/?demo=cup&gen=0', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.hud-title', { timeout: 20000 });
await wait(3000);
await cap('输入一个种子，让一件日常物品开始进化');
await wait(2500);

await cap('每一代，从六种结构变异中三选一：增生 / 变比 / 反转 / 递归 / 融合 / 寄生');
await page.locator('.candidate').nth(0).hover();
await wait(800);
await page.locator('.candidate').nth(1).hover();
await wait(800);
await page.locator('.candidate').nth(2).hover();
await wait(800);

await cap('被选中的分支交给 Aholo Lux3D 生成真实 GLB');
await clickSlot(2);
await wait(3500);

await cap('谱系保留每一次选择，可随时回溯');
await clickSlot(1);
await wait(3500);
await clickSlot(0);
await wait(5500);
await clickSlot(2);
await wait(5500);
await clickSlot(1);
await wait(3500);

await cap('五代之后，它仍然能装水——但拒绝出水');
await wait(1000);
const box = await page.locator('.stage canvas').boundingBox();
if (box) {
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 260, cy - 40, { steps: 30 });
  await page.mouse.up();
}
await wait(2500);

await cap('无用性测试：倾斜到最大角度，密封盖挡住全部水');
await page.getByRole('button', { name: '无用性测试' }).click();
await wait(2500);

await cap('同一个种子、同一条路径，永远得到同一组结果');
await page.getByRole('button', { name: '返回观察' }).click();
await wait(600);
await page.getByRole('button', { name: '分享' }).click();
await wait(4500);

const video = page.video();
await context.close();
await browser.close();
if (video) {
  const path = await video.path();
  const target = '提交材料/video-raw/demo.webm';
  renameSync(path, target);
  console.log('video saved', target);
}
