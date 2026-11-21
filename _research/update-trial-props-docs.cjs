const fs=require('fs');
const p=JSON.parse(fs.readFileSync('package.json','utf8'));
p.scripts['gen:trial-props']='tsx scripts/generate-trial-props.ts';
p.scripts['test:trial-devices']='tsx scripts/trial-device-check.ts && tsx scripts/trial-props-qa.ts && node scripts/trial-props-resilience-qa.mjs';
fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n');
let readme=fs.readFileSync('README.md','utf8');
readme=readme.replace('主动启动抓取探针、风场、断供试验','主动启动机械夹爪、工业风机、供能基座试验');
readme += '\n### Lux3D 试验设备\n\n三种环境道具现为实际 Lux3D GLB：抓取机械臂（沿滑轨接近/退回）、工业风机（配合风流）、外部供能基座（配合拔线断电）。设备在待机时可见；设备尚未加载完成时不能启动试验，失败可重试并保留代数。游戏只加载预生成的本地文件，不在游玩时创建生成任务。\n\n`npm run test:trial-devices` 验证三设备文件、三场景与重播、手机取景、设备加载失败恢复；需本地8787服务。`npm run gen:trial-props` 只预览提示词；明确需要重新生成缺失资产时才使用 `npm run gen:trial-props -- --generate`，会继续已记录的任务，不会重复创建。\n';
fs.writeFileSync('README.md',readme);
