const fs=require('fs');
const file='README.md';let text=fs.readFileSync(file,'utf8');
text=text.replace('> 选一个日常物品，输入一个种子，看它在六种结构算子下逐代“升级”，\n> 直到它仍然装满了水，却拒绝让任何人喝到。','> 在六次突变以内，让一件日常物品挣脱抓取、穿过风暴、独立生存。\n> 对人类越来越没用，对自己越来越完整。');
text=text.replace('## 1. 作品是什么（当前默认：器官库）',`## 1. 作品是什么（当前默认：逃离实验）

默认主模式现为一局可完成的进化挑战：选择水杯、椅子、雨伞或垃圾桶，在三道环境关卡中做三选一突变，每关最多两次机会，总计最多六代。

- **目标与取舍**：机动、稳固、防护、自养四类能力；新结构替换同位置旧结构，最多保留四个。
- **环境试验**：主动启动抓取探针、风场、断供试验，观察形态如何应对；成功进入下一环境，连续两次未通过则结算。
- **三种组合联动**：感知眼 × 机械腿 → 警觉游走体；气球 × 喷气口 → 逆风浮游体；菌丝 × 吸盘 → 扎根共生体。联动有能力增益和专属行为，发现保存在当前设备。
- **形态变化**：主体几何会随突变收束、膨胀或产生起伏；器官按接触面附着，菌丝沿真实表面生长。椅子承接底部结构使用连接支架，镜头按完整形态取景。
- **分享与复玩**：同种子、同选择可复现，分享链接保留当前进化阶段；结算后可换种子重开或带着形态进入自由实验。
- **表现边界**：能力与胜负由可解释规则决定，动画是规则驱动的行为演示，并非物理仿真。主体和机械器官复用本地 Lux3D 资产，连接结构、主体变形与菌丝为程序化表现，不新增在线生成费用。
- **布局**：模型置中，底部三选一卡片，结构详情按需展开；适配桌面和手机纵向滚动。

打开默认地址即可游玩；原器官沙盒改为 \`?sandbox=1\`，旧进化树保留在 \`?tree=1\`，旧分享链接继续兼容。

### 1.1 自由实验（原器官库）`);
text=text.replace('### 1.1 拓展模式：三选一进化树','### 1.2 拓展模式：三选一进化树');
text += `\n## 新主模式验证\n\n\`npm run test:expedition\` 检查胜负路径、分享重放、联动、坐标归一化、接触面与主体变形。\n\`npm run test:engine\` 继续验证旧进化引擎。\n启动本地服务后运行 \`npm run test:play\`，在 Chrome 中验证成功/失败、重播、分享、重开、四原型和390宽页面；截图存于 \`_research/expedition-qa/\`。Chrome 路径见脚本，可按本机环境调整。\n本地 GLB 清单变化后运行 \`npm run gen:catalog\` 刷新前端资产目录。\n`;
fs.writeFileSync(file,text);
const p=JSON.parse(fs.readFileSync('package.json','utf8'));
p.scripts['test:expedition']='tsx scripts/expedition-check.ts && tsx scripts/attachment-check.ts && tsx scripts/morphology-check.ts';
p.scripts['test:play']='tsx scripts/expedition-fixtures.ts && node scripts/expedition-qa.mjs';
p.scripts['gen:catalog']='tsx scripts/build-asset-catalog.ts';fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n');
let lab=fs.readFileSync('src/lab/Lab.tsx','utf8');
lab=lab.replace("if (!data.f || !Array.isArray(data.o)) return null;", "if (!BASE_MAP[data.f as FamilyId] || !Array.isArray(data.o)) return null;");
lab=lab.replace("o: data.o.filter((x: string) => ORGAN_MAP[x as OrganId]),", "o: [...new Set<OrganId>(data.o.filter((x: string) => ORGAN_MAP[x as OrganId]))].slice(0,4),");
fs.writeFileSync('src/lab/Lab.tsx',lab);
