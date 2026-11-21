# 六代逃离实验 Implementation Plan

Goal: 将主模式改为可完成的三关、最多六次突变的进化挑战，保留自由实验。
Architecture: 纯函数 expedition.ts 管理挑战、候选与联动；Expedition.tsx 处理交互；Creature.tsx 与 attachment.ts 管理规范化、连接及动画。旧 Lab 作为自由实验入口保留并共享定位修复。
Tech Stack: 现有 React / TypeScript / R3F / Three.js，无新增依赖。
Constraints: 不调用付费生成接口；规则测试不是物理模拟；无 Git 仓库，不做提交；在当前已授权会话内顺序实施。

- [x] 1. 新增 scripts/expedition-check.ts，先验证缺失模块导致失败；覆盖确定性、成功失败、重复结算防护、三种联动、候选无死路、分享校验。实现 src/engine/expedition.ts，运行 npx tsx scripts/expedition-check.ts。
- [x] 2. 新增 scripts/attachment-check.ts，构造带原始平移与缩放的几何复现定位错误；实现 src/lab/attachment.ts，规范化后居中落地，计算语义锚点与接触面；对挑战池所有原型进行包围盒验证。
- [x] 3. 新建 Creature.tsx，加载预生成模型、可视连接、逐部件生长与联动动画；挑战场景加入抓取探针、风场、能量场，与试验阶段同步。
- [x] 4. 新建 Expedition.tsx / expedition.css：原型选择、三关进度、三选一卡、试验与结算、发现图鉴、分享重放、窄屏布局。Root.tsx 默认入口改到新模式，?sandbox=1 保留旧 Lab。器官和原型使用静态 manifest 精确提示词匹配，不依赖后台查询。
- [x] 5. 修复旧 Assembled.tsx 共享坐标与附着计算，旧入口增加挑战返回链接；文档说明新主玩法。
- [x] 6. npm run build / npm run test:engine / 新规则检查通过；浏览器完成两条结算路径、重复播放、切换、分享、四原型、加载失败和390宽度检查，截图复核；记录结论。

