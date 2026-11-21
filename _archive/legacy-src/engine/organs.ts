import type { FamilyId } from './types';

export type OrganId =
  | 'seal'
  | 'arm'
  | 'wheels'
  | 'gimbal'
  | 'funnel'
  | 'shell'
  | 'handle'
  | 'parasite'
  | 'solar'
  | 'antenna'
  | 'balloon'
  | 'parachute'
  | 'filter'
  | 'lamp'
  | 'speaker'
  | 'eye'
  | 'tank'
  | 'gauge'
  | 'lock'
  | 'hinge'
  | 'gear'
  | 'pipe'
  | 'valve'
  | 'jet'
  | 'suction'
  | 'drill'
  | 'legs'
  | 'spring'
  | 'mycelium'
  | 'fins'
  | 'feathers'
  | 'barnacle';

export type Anchor = 'top' | 'side' | 'bottom' | 'around';

export interface OrganEffects {
  /** 对可用性的整体影响，-1..1 */
  utility: number;
  /** 对荒诞度的影响，0..1 */
  absurdity: number;
  /** 对祖先辨识度的影响，-1..1 */
  recognition: number;
  /** 功能标记，测试与文案共用 */
  flags?: string[];
}

export interface OrganDef {
  id: OrganId;
  name: string;
  en: string;
  anchor: Anchor;
  /** 生成用提示词；运行时按同一字符串查缓存 */
  prompt: string;
  /** 归一化：按高度还是宽度缩放到 size（相对基础物体高度 1.0） */
  fit: 'height' | 'width';
  size: number;
  /** 相对基础物体（高 1.0、底部 y=0、中心 x/z=0）的位置 */
  pos: [number, number, number];
  rot: [number, number, number];
  effects: OrganEffects;
  blurb: string;
  color: string;
  /** 测试时的失败台词 */
  verdict: string;
}

export const ORGAN_LIST: OrganDef[] = [
  // ── 顶置 ─────────────────────────────────────────────
  {
    id: 'seal',
    name: '密封盖',
    en: 'sealed lid',
    anchor: 'top',
    prompt:
      'An isolated circular sealing lid module for a drinking vessel, brushed aluminum rim with a smoked glass inspection window and a black rubber gasket, no cup body, no other objects, product design render, centered, photorealistic, high detail.',
    fit: 'width',
    size: 0.62,
    pos: [0, 1.0, 0],
    rot: [Math.PI / 2, 0, 0],
    effects: { utility: -0.55, absurdity: 0.18, recognition: -0.05, flags: ['sealed'] },
    blurb: '一滴也不会洒，因为一滴也倒不出来。',
    color: '#7fd0ff',
    verdict: '密封盖承受住了全部水压，杯口没有一滴水流出。',
  },
  {
    id: 'funnel',
    name: '倒置伞面',
    en: 'inverted canopy',
    anchor: 'top',
    prompt:
      'An isolated inverted umbrella canopy used as a funnel, dark blue technical fabric over metal ribs, a central drain hole, no handle, no pole, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'width',
    size: 0.85,
    pos: [0, 0.98, 0],
    rot: [Math.PI, 0, 0],
    effects: { utility: -0.35, absurdity: 0.45, recognition: -0.15, flags: ['collect'] },
    blurb: '它把雨水收进杯里，也把你需要的水收走。',
    color: '#3f8f7a',
    verdict: '伞面把水全部收进中心孔，杯口反而接不到。',
  },
  {
    id: 'solar',
    name: '太阳能板',
    en: 'solar panel',
    anchor: 'top',
    prompt:
      'An isolated flat solar panel module, dark blue photovoltaic cells in a brushed aluminum frame, short mounting bracket underneath, no main object, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'width',
    size: 0.5,
    pos: [0, 1.0, 0],
    rot: [-0.35, 0, 0],
    effects: { utility: -0.05, absurdity: 0.22, recognition: -0.12, flags: ['power'] },
    blurb: '它开始给自己充电，不再需要你。',
    color: '#4f7fd6',
    verdict: '太阳能板把光都留给了自己，杯子进入待机。',
  },
  {
    id: 'antenna',
    name: '天线',
    en: 'antenna',
    anchor: 'top',
    prompt:
      'An isolated radio antenna module, thin metal mast with three cross elements and a coaxial connector at the base, no main object, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'height',
    size: 0.55,
    pos: [0, 1.0, 0],
    rot: [0, 0, 0.15],
    effects: { utility: -0.15, absurdity: 0.3, recognition: -0.18, flags: ['signal'] },
    blurb: '它一直在发送，没人知道发给谁。',
    color: '#c9d4e0',
    verdict: '天线占用了全部表面，信号比水先出去。',
  },
  {
    id: 'balloon',
    name: '气球',
    en: 'balloon',
    anchor: 'top',
    prompt:
      'An isolated single helium balloon, matte red rubber, tied with a thin string and a small plastic clip, no main object, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'height',
    size: 0.7,
    pos: [0, 1.0, 0],
    rot: [0, 0, 0],
    effects: { utility: -0.5, absurdity: 0.55, recognition: -0.25, flags: ['float'] },
    blurb: '它想离开桌面，顺便带走杯子。',
    color: '#e05252',
    verdict: '气球把杯子拉离桌面，你够不到它。',
  },
  {
    id: 'parachute',
    name: '降落伞',
    en: 'parachute',
    anchor: 'top',
    prompt:
      'An isolated small parachute canopy, off-white ripstop nylon with visible seams and suspension lines converging to a metal ring, no payload, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'width',
    size: 0.65,
    pos: [0, 1.0, 0],
    rot: [Math.PI, 0, 0],
    effects: { utility: -0.28, absurdity: 0.38, recognition: -0.2, flags: ['drag'] },
    blurb: '它为你准备了降落，虽然你只是要喝水。',
    color: '#d8d2c4',
    verdict: '伞衣张开，杯子被空气拖住，倒不出水。',
  },
  {
    id: 'filter',
    name: '滤芯',
    en: 'filter cartridge',
    anchor: 'top',
    prompt:
      'An isolated cylindrical water filter cartridge, white ceramic body with a threaded metal cap and a ribbed base, no main object, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'height',
    size: 0.3,
    pos: [0, 1.0, 0],
    rot: [0, 0, 0],
    effects: { utility: -0.3, absurdity: 0.2, recognition: -0.15, flags: ['filter', 'sealed'] },
    blurb: '它过滤掉水，也过滤掉喝水这件事。',
    color: '#e8e2d6',
    verdict: '滤芯把水留在内部，杯口只剩空气。',
  },
  {
    id: 'lamp',
    name: '灯罩',
    en: 'lamp shade',
    anchor: 'top',
    prompt:
      'An isolated small table lamp shade module, warm frosted glass dome with a brass rim and a socket underneath, no bulb, no main object, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'width',
    size: 0.6,
    pos: [0, 1.0, 0],
    rot: [0, 0, 0],
    effects: { utility: -0.1, absurdity: 0.25, recognition: -0.1, flags: ['glow'] },
    blurb: '它照亮杯子，让你更清楚地喝不到。',
    color: '#f2c46d',
    verdict: '灯罩把杯口盖住，光从缝隙里漏出来。',
  },

  // ── 侧置 ─────────────────────────────────────────────
  {
    id: 'arm',
    name: '机械臂',
    en: 'robotic arm',
    anchor: 'side',
    prompt:
      'An isolated compact robotic arm module with two joints and a gripper, matte black and safety orange, circular mounting flange at the base, no main object, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'height',
    size: 0.62,
    pos: [0.3, 0.5, 0],
    rot: [0, 0, -1.15],
    effects: { utility: -0.18, absurdity: 0.32, recognition: -0.18, flags: ['autonomous', 'arm'] },
    blurb: '它开始替你拿东西，然后开始替自己拿东西。',
    color: '#e2703a',
    verdict: '机械臂先一步把杯子移出了你的手。',
  },
  {
    id: 'handle',
    name: '巨柄',
    en: 'oversized handle',
    anchor: 'side',
    prompt:
      'An isolated oversized ceramic handle, C-shaped, cream glaze, two metal mounting points at the ends, no cup body, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'height',
    size: 0.5,
    pos: [-0.34, 0.55, 0.16],
    rot: [0, 0.3, Math.PI / 2 + 0.2],
    effects: { utility: -0.12, absurdity: 0.16, recognition: -0.05, flags: ['handle'] },
    blurb: '握得住，但端不平。',
    color: '#f3efe7',
    verdict: '巨柄让重心偏到手腕无法承受的角度。',
  },
  {
    id: 'parasite',
    name: '寄生装置',
    en: 'parasite device',
    anchor: 'side',
    prompt:
      'An isolated small parasitic clamp-on device, dark metal with a red indicator LED and a coiled cable, no main object, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'height',
    size: 0.28,
    pos: [0.26, 0.72, 0.12],
    rot: [0, 0.4, 0],
    effects: { utility: -0.25, absurdity: 0.35, recognition: -0.1, flags: ['parasite'] },
    blurb: '它不服务你，它只维护自己。',
    color: '#ff6b5a',
    verdict: '寄生装置优先给自己供电，杯子进入低功耗模式。',
  },
  {
    id: 'speaker',
    name: '扬声器',
    en: 'speaker',
    anchor: 'side',
    prompt:
      'An isolated compact loudspeaker module, black perforated grille and a rubber surround, small mounting bracket on the back, no main object, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'height',
    size: 0.3,
    pos: [0.28, 0.55, 0.1],
    rot: [0, 0.3, 0],
    effects: { utility: -0.12, absurdity: 0.3, recognition: -0.12, flags: ['noise'] },
    blurb: '它开始播放白噪音，掩盖你倒水的声音。',
    color: '#6b7280',
    verdict: '扬声器盖过了水声，你不知道倒满没有。',
  },
  {
    id: 'eye',
    name: '摄像头',
    en: 'camera eye',
    anchor: 'side',
    prompt:
      'An isolated small camera module, black cylindrical lens housing with a glass lens and a metal mounting bracket, no main object, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'height',
    size: 0.22,
    pos: [0.24, 0.68, 0.12],
    rot: [0, 0.5, 0],
    effects: { utility: -0.08, absurdity: 0.28, recognition: -0.15, flags: ['watch'] },
    blurb: '它盯着你，也盯着杯口。',
    color: '#3b4a5a',
    verdict: '摄像头锁定了你的手，杯子却不动。',
  },
  {
    id: 'tank',
    name: '储液罐',
    en: 'liquid tank',
    anchor: 'side',
    prompt:
      'An isolated small cylindrical liquid tank module, translucent polycarbonate body with metal bands and two hose ports, no main object, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'height',
    size: 0.5,
    pos: [0.3, 0.45, 0.12],
    rot: [0, 0.2, 0],
    effects: { utility: -0.2, absurdity: 0.25, recognition: -0.12, flags: ['store'] },
    blurb: '它替你存水，然后忘了给你。',
    color: '#7fb7c9',
    verdict: '储液罐把水存起来，杯口一直是空的。',
  },
  {
    id: 'gauge',
    name: '仪表',
    en: 'pressure gauge',
    anchor: 'side',
    prompt:
      'An isolated analog pressure gauge module, round white dial with a black needle and a brass threaded fitting, no main object, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'height',
    size: 0.2,
    pos: [0.26, 0.6, 0.14],
    rot: [0, 0.6, 0],
    effects: { utility: -0.05, absurdity: 0.18, recognition: -0.08, flags: ['measure'] },
    blurb: '它精确测量你还有多渴。',
    color: '#d9c9a3',
    verdict: '仪表显示压力正常，但水就是不出来。',
  },
  {
    id: 'lock',
    name: '锁扣',
    en: 'padlock',
    anchor: 'side',
    prompt:
      'An isolated heavy steel padlock module, brushed shackle and a black combination dial, no chain, no main object, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'height',
    size: 0.24,
    pos: [0.3, 0.62, 0.12],
    rot: [0, 0.3, 0],
    effects: { utility: -0.22, absurdity: 0.2, recognition: -0.1, flags: ['lock', 'sealed'] },
    blurb: '它锁住的不是杯子，是你喝水的权利。',
    color: '#8a8f96',
    verdict: '锁扣咬住杯盖，你找不到密码。',
  },
  {
    id: 'hinge',
    name: '铰链',
    en: 'hinge',
    anchor: 'side',
    prompt:
      'An isolated industrial hinge module, two brushed steel leaves with countersunk screw holes and a polished pin, no main object, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'height',
    size: 0.3,
    pos: [0.28, 0.5, 0.1],
    rot: [0, 0.2, 0],
    effects: { utility: -0.15, absurdity: 0.22, recognition: -0.12, flags: ['fold'] },
    blurb: '它让杯子可以折叠，但折起来就装不了水。',
    color: '#b0b6bd',
    verdict: '铰链把杯身折成两半，水从折痕漏光。',
  },
  {
    id: 'gear',
    name: '齿轮',
    en: 'gear',
    anchor: 'side',
    prompt:
      'An isolated brass spur gear module, thick teeth and a central keyed bore, no main object, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'height',
    size: 0.32,
    pos: [0.3, 0.42, 0.1],
    rot: [0, 0.2, 0],
    effects: { utility: -0.18, absurdity: 0.26, recognition: -0.14, flags: ['spin'] },
    blurb: '它转得很认真，但没连接任何东西。',
    color: '#c9a24b',
    verdict: '齿轮空转，杯子跟着抖，水洒了一桌。',
  },
  {
    id: 'pipe',
    name: '管道',
    en: 'pipe',
    anchor: 'side',
    prompt:
      'An isolated curved metal pipe module, stainless steel elbow with two flanged ends and a visible gasket, no main object, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'height',
    size: 0.45,
    pos: [0.3, 0.55, 0.1],
    rot: [0, 0.4, 0.6],
    effects: { utility: -0.2, absurdity: 0.24, recognition: -0.15, flags: ['route'] },
    blurb: '它给水安排了一条更长的路。',
    color: '#aeb6bf',
    verdict: '管道把水引到杯外，桌面先喝饱了。',
  },
  {
    id: 'valve',
    name: '阀门',
    en: 'gate valve',
    anchor: 'side',
    prompt:
      'An isolated brass gate valve module, red handwheel and threaded pipe fittings, no main object, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'height',
    size: 0.26,
    pos: [0.28, 0.6, 0.12],
    rot: [0, 0.3, 0],
    effects: { utility: -0.28, absurdity: 0.2, recognition: -0.12, flags: ['valve', 'sealed'] },
    blurb: '阀门关上的时候，杯子只是一个容器。',
    color: '#b56a4a',
    verdict: '阀门锁死，水流在管子里打转。',
  },
  {
    id: 'jet',
    name: '喷气口',
    en: 'jet nozzle',
    anchor: 'side',
    prompt:
      'An isolated small jet thruster module, conical steel nozzle with heat discoloration and a mounting flange, no main object, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'height',
    size: 0.3,
    pos: [0.3, 0.42, 0.12],
    rot: [0, 0.4, -0.6],
    effects: { utility: -0.35, absurdity: 0.5, recognition: -0.25, flags: ['thrust'] },
    blurb: '它让杯子飞起来，方向由不得你。',
    color: '#d07a3a',
    verdict: '喷口点火，杯子冲出你的手，水留在原地。',
  },
  {
    id: 'barnacle',
    name: '藤壶',
    en: 'barnacles',
    anchor: 'side',
    prompt:
      'An isolated cluster of barnacles encrusted on a curved metal plate, pale shells and dark bases, no main object, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'height',
    size: 0.3,
    pos: [0.3, 0.45, 0.1],
    rot: [0, 0.3, 0],
    effects: { utility: -0.3, absurdity: 0.35, recognition: -0.18, flags: ['foul'] },
    blurb: '它把杯子当成礁石，慢慢长满。',
    color: '#d8d2c4',
    verdict: '藤壶增重又增阻，杯子已经不像杯子。',
  },

  // ── 底置 ─────────────────────────────────────────────
  {
    id: 'wheels',
    name: '轮式底盘',
    en: 'wheeled base',
    anchor: 'bottom',
    prompt:
      'An isolated motorized wheeled base module, four small rubber wheels, brushed metal chassis with a circular mounting plate on top, no object above the plate, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'width',
    size: 0.62,
    pos: [0, 0.02, 0],
    rot: [0, 0, 0],
    effects: { utility: -0.3, absurdity: 0.4, recognition: -0.22, flags: ['autonomous', 'mobile'] },
    blurb: '它学会了在你想用它之前先离开。',
    color: '#c9643a',
    verdict: '轮子开始转动，它保持与你一臂的距离。',
  },
  {
    id: 'suction',
    name: '吸盘',
    en: 'suction cup',
    anchor: 'bottom',
    prompt:
      'An isolated heavy-duty rubber suction cup module, black rubber bell with a metal pump lever on top, no main object, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'width',
    size: 0.5,
    pos: [0, 0, 0],
    rot: [0, 0, 0],
    effects: { utility: -0.25, absurdity: 0.3, recognition: -0.15, flags: ['anchor'] },
    blurb: '它把杯子固定在桌上，包括你需要拿起它的时候。',
    color: '#4b4f55',
    verdict: '吸盘咬住桌面，杯子纹丝不动。',
  },
  {
    id: 'drill',
    name: '钻头',
    en: 'drill bit',
    anchor: 'bottom',
    prompt:
      'An isolated industrial spiral drill bit module, fluted steel bit with a chuck mount, no main object, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'height',
    size: 0.4,
    pos: [0, 0, 0],
    rot: [Math.PI, 0, 0],
    effects: { utility: -0.45, absurdity: 0.45, recognition: -0.25, flags: ['burrow'] },
    blurb: '它向下探索，不再向上装水。',
    color: '#9aa0a6',
    verdict: '钻头把桌面钻穿，杯子陷进洞里。',
  },
  {
    id: 'legs',
    name: '机械腿',
    en: 'robotic legs',
    anchor: 'bottom',
    prompt:
      'An isolated set of four small robotic legs, articulated aluminum struts with rubber feet, circular mounting plate on top, no main object, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'width',
    size: 0.6,
    pos: [0, 0, 0],
    rot: [0, 0, 0],
    effects: { utility: -0.3, absurdity: 0.42, recognition: -0.22, flags: ['autonomous', 'walk'] },
    blurb: '它学会走路，第一步是离开你。',
    color: '#c9ced6',
    verdict: '四条腿各走各的，杯子被撕成四个方向。',
  },
  {
    id: 'spring',
    name: '弹簧',
    en: 'coil spring',
    anchor: 'bottom',
    prompt:
      'An isolated heavy coil spring module, chrome steel wire with flat mounting caps at both ends, no main object, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'height',
    size: 0.3,
    pos: [0, 0, 0],
    rot: [0, 0, 0],
    effects: { utility: -0.2, absurdity: 0.35, recognition: -0.15, flags: ['bounce'] },
    blurb: '它让杯子跳起来，接不接得住另说。',
    color: '#b8bec6',
    verdict: '弹簧把杯子弹到半空，水在上升时就洒光了。',
  },
  {
    id: 'mycelium',
    name: '菌丝',
    en: 'mycelium',
    anchor: 'bottom',
    prompt:
      'An isolated cluster of pale fungal mycelium and small mushrooms growing on a dark soil block, no main object, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'height',
    size: 0.18,
    pos: [0, 0, 0],
    rot: [0, 0, 0],
    effects: { utility: -0.35, absurdity: 0.3, recognition: -0.2, flags: ['spread'] },
    blurb: '它把杯子当成新的栖息地。',
    color: '#cbbfa8',
    verdict: '菌丝爬满杯底，杯子开始腐烂。',
  },

  // ── 环绕 ─────────────────────────────────────────────
  {
    id: 'gimbal',
    name: '稳定环',
    en: 'gimbal ring',
    anchor: 'around',
    prompt:
      'An isolated three-axis gimbal ring assembly, polished aluminum and black anodized parts, open center, no object inside the ring, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'width',
    size: 1.05,
    pos: [0, 0.5, 0],
    rot: [Math.PI / 2, 0, 0],
    effects: { utility: -0.22, absurdity: 0.28, recognition: -0.2, flags: ['stable'] },
    blurb: '无论怎么倾斜，它都坚持把杯口扶正。',
    color: '#b9bec6',
    verdict: '稳定环反向旋转，把杯口重新扶正。',
  },
  {
    id: 'shell',
    name: '防护笼',
    en: 'protective cage',
    anchor: 'around',
    prompt:
      'An isolated cylindrical metal protective cage with vertical steel bars, a hinged door and a round top handle, open bottom, no object inside the cage, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'width',
    size: 1.05,
    pos: [0, 0.5, 0],
    rot: [0, 0, 0],
    effects: { utility: -0.4, absurdity: 0.25, recognition: -0.28, flags: ['sealed', 'caged'] },
    blurb: '保护得越好，越找不到打开它的理由。',
    color: '#9fb4c4',
    verdict: '防护笼锁死，你只能隔着钢条看它。',
  },
  {
    id: 'fins',
    name: '散热鳍',
    en: 'heat sink',
    anchor: 'around',
    prompt:
      'An isolated cylindrical heat sink module, radial aluminum fins around an open center, no object inside, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'width',
    size: 1.1,
    pos: [0, 0.5, 0],
    rot: [Math.PI / 2, 0, 0],
    effects: { utility: -0.15, absurdity: 0.25, recognition: -0.12, flags: ['heat'] },
    blurb: '它把热量散出去，也把杯口挡住。',
    color: '#aeb6bf',
    verdict: '散热鳍片挡住杯口，水还没倒就凉了。',
  },
  {
    id: 'feathers',
    name: '羽毛',
    en: 'feather collar',
    anchor: 'around',
    prompt:
      'An isolated ring of large bird feathers arranged in a collar, natural brown and white plumage, no main object, no background objects, product design render, centered, photorealistic, high detail.',
    fit: 'width',
    size: 1.0,
    pos: [0, 0.5, 0],
    rot: [0, 0, 0],
    effects: { utility: -0.18, absurdity: 0.3, recognition: -0.15, flags: ['insulate'] },
    blurb: '它让杯子保暖，也让你找不到杯口。',
    color: '#b99a6b',
    verdict: '羽毛把杯口围住，你只能从缝里看水。',
  },
];

export const ORGAN_MAP = Object.fromEntries(ORGAN_LIST.map((o) => [o.id, o])) as Record<OrganId, OrganDef>;

export interface BaseDef {
  family: FamilyId;
  name: string;
  en: string;
  /** 归一化后的视觉半径，用于器官锚点 */
  radius: number;
  blurb: string;
}

export const BASE_LIST: BaseDef[] = [
  { family: 'cup', name: '水杯', en: 'cup', radius: 0.3, blurb: '装水，然后被喝掉。' },
  { family: 'chair', name: '椅子', en: 'chair', radius: 0.34, blurb: '承重，然后被坐下。' },
  { family: 'umbrella', name: '雨伞', en: 'umbrella', radius: 0.5, blurb: '挡雨，然后被收起来。' },
  { family: 'bin', name: '垃圾桶', en: 'bin', radius: 0.32, blurb: '收垃圾，然后被清空。' },
];

export const BASE_MAP = Object.fromEntries(BASE_LIST.map((b) => [b.family, b])) as Record<FamilyId, BaseDef>;

/** 组合后的功能标签 → 测试结论。优先级从高到低。 */
export const TEST_RULES: { flag: string; headline: string; verdict: string }[] = [
  { flag: 'caged', headline: '它被保护得太好了', verdict: '防护笼锁死，只能看，不能用。' },
  { flag: 'sealed', headline: '它拒绝被打开', verdict: '密封结构把内容物和你隔在两个世界。' },
  { flag: 'fusion', headline: '它们长在了一起', verdict: '两个祖先的结构互相占用，谁也无法单独完成原来的功能。' },
  { flag: 'autonomous', headline: '它在你伸手之前先动了', verdict: '移动结构优先服务自己，而不是你。' },
  { flag: 'float', headline: '它开始向上，而不是向内', verdict: '浮力把杯子拉离桌面，你够不到它。' },
  { flag: 'thrust', headline: '它选择了方向，你只能松手', verdict: '喷口把杯子推走，水留在原地。' },
  { flag: 'burrow', headline: '它向下生长，桌面成了新的杯底', verdict: '钻头把桌面钻穿，杯子陷进洞里。' },
  { flag: 'anchor', headline: '它把自己固定在世界里', verdict: '吸盘咬住桌面，杯子纹丝不动。' },
  { flag: 'collect', headline: '它开始收集，而不是给出', verdict: '漏斗把水收进内部，出口被结构挡住。' },
  { flag: 'stable', headline: '它坚持保持水平', verdict: '稳定环抵消了你每一次倾倒的意图。' },
  { flag: 'bounce', headline: '它把倒水变成了投掷', verdict: '弹簧把杯子弹到半空，水在上升时就洒光了。' },
  { flag: 'spin', headline: '它空转，但把水甩了出去', verdict: '齿轮没有连接任何东西，只把杯子抖得站不稳。' },
  { flag: 'fold', headline: '它折起来，容量也折没了', verdict: '铰链把杯身折成两半，水从折痕漏光。' },
  { flag: 'glow', headline: '它发光，但照不亮杯口', verdict: '灯罩把杯口盖住，光从缝隙里漏出来。' },
  { flag: 'filter', headline: '它过滤掉水，也过滤掉喝水', verdict: '滤芯把水留在内部，杯口只剩空气。' },
  { flag: 'watch', headline: '它看着你，不让你喝', verdict: '摄像头锁定了你的手，杯子却不动。' },
  { flag: 'noise', headline: '它盖住了水声', verdict: '扬声器盖过了水声，你不知道倒满没有。' },
  { flag: 'heat', headline: '它把热量带走，也把杯口封住', verdict: '散热鳍片挡住杯口，水还没倒就凉了。' },
  { flag: 'foul', headline: '它把杯子变成礁石', verdict: '藤壶增重又增阻，杯子已经不像杯子。' },
  { flag: 'spread', headline: '它把杯子当成土壤', verdict: '菌丝爬满杯底，杯子开始腐烂。' },
  { flag: 'store', headline: '它替你存水，然后忘了给你', verdict: '储液罐把水存起来，杯口一直是空的。' },
  { flag: 'power', headline: '它先给自己供电', verdict: '太阳能板把光都留给了自己，杯子进入待机。' },
  { flag: 'signal', headline: '它一直在发送，没人知道发给谁', verdict: '天线占用了全部表面，信号比水先出去。' },
  { flag: 'drag', headline: '它让下落变慢，也让喝水变慢', verdict: '伞衣张开，杯子被空气拖住，倒不出水。' },
  { flag: 'measure', headline: '它精确地测量你的失败', verdict: '仪表显示压力正常，但水就是不出来。' },
  { flag: 'lock', headline: '它锁住的不是杯子，是你喝水的权利', verdict: '锁扣咬住杯盖，你找不到密码。' },
  { flag: 'valve', headline: '阀门关上了，杯子只是一个容器', verdict: '阀门锁死，水流在管子里打转。' },
  { flag: 'route', headline: '它给水安排了一条更长的路', verdict: '管道把水引到杯外，桌面先喝饱了。' },
  { flag: 'walk', headline: '它迈出了第一步', verdict: '四条腿各走各的，杯子被撕成四个方向。' },
  { flag: 'insulate', headline: '它保暖，也隔绝了你', verdict: '羽毛把杯口围住，你只能从缝里看水。' },
  { flag: 'handle', headline: '它握得住，但端不平', verdict: '巨柄把重心推到手腕无法承受的角度。' },
  { flag: 'parasite', headline: '它在维护自己', verdict: '寄生装置占用了全部功能预算。' },
];
