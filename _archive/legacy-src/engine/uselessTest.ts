import type { FamilyId, Genes } from './types';
import { FAMILIES } from './families';

export type TestAnimation = 'ok' | 'sealed' | 'gimbal' | 'arm' | 'cage' | 'walkaway' | 'funnel' | 'reject' | 'claw' | 'nested' | 'flip' | 'splash';

export interface TestStep {
  at: number;
  text: string;
}

export interface TestResult {
  success: boolean;
  animation: TestAnimation;
  headline: string;
  steps: TestStep[];
  verdict: string;
  /** 失败原因标签，用于报告统计 */
  reason: string;
}

export function runUselessTest(family: FamilyId, genes: Genes): TestResult {
  const m = genes.metrics;
  const f = FAMILIES[family];

  if (family === 'cup') {
    if (genes.flags.rimSealed || m.drink < 0.3) {
      return {
        success: false, animation: genes.flags.rimSealed ? 'sealed' : 'gimbal', reason: genes.flags.rimSealed ? '开口封闭' : '稳定结构阻断',
        headline: genes.flags.rimSealed ? '杯子拒绝出水' : '稳定环把水留在了杯里',
        steps: [
          { at: 0, text: '你把杯子倾斜 45°，准备喝水。' },
          { at: 800, text: genes.flags.rimSealed ? '密封盖承受住了全部水压，杯口没有一滴水流出。' : '三轴稳定环反向旋转，把杯口重新扶正。' },
          { at: 1600, text: `倒出成功率 ${Math.round(m.pour * 100)}%，饮用成功率 ${Math.round(m.drink * 100)}%。` },
        ],
        verdict: '它越来越擅长阻止自己被使用。',
      };
    }
    if (genes.flags.autonomous) {
      return {
        success: false, animation: 'walkaway', reason: '自主逃离',
        headline: '杯子在你伸手之前先移动了',
        steps: [
          { at: 0, text: '你拿起杯子，杯底的轮子开始转动。' },
          { at: 900, text: '它向桌沿移动，保持杯口始终朝向远离你的方向。' },
          { at: 1800, text: '它停在桌角，杯口朝外，水一滴也没有洒。' },
        ],
        verdict: '功能全部正常，只是服务对象不是你。',
      };
    }
    return {
      success: true, animation: 'ok', reason: '正常',
      headline: '杯子仍然是一只杯子',
      steps: [
        { at: 0, text: '你举起杯子，杯口对准嘴边。' },
        { at: 800, text: '水正常流出，没有机械结构介入。' },
      ],
      verdict: '至少这一代，它还记得自己是用来喝水的。',
    };
  }

  if (family === 'chair') {
    if (genes.flags.seatFlipped) {
      return {
        success: false, animation: 'flip', reason: '坐面反转',
        headline: '椅面朝向了天空',
        steps: [
          { at: 0, text: '你走到椅子前，准备坐下。' },
          { at: 800, text: '坐面是翻转的，承重结构朝上，唯一平整的一面贴着地面。' },
          { at: 1600, text: `入座成功率 ${Math.round(m.access * 100)}%。` },
        ],
        verdict: '结构强度满分，可坐面积为零。',
      };
    }
    if (genes.flags.autonomous) {
      return {
        success: false, animation: 'walkaway', reason: '自主移动',
        headline: '椅子自己走了',
        steps: [
          { at: 0, text: '你靠近椅子。' },
          { at: 700, text: '四条腿开始迈步，椅子保持与你 1.2 米的距离。' },
          { at: 1500, text: '它绕过房间中央，停在窗边继续晒太阳。' },
        ],
        verdict: '它不再承担坐具义务。',
      };
    }
    if (m.access < 0.35) {
      return {
        success: false, animation: 'cage', reason: '护栏阻断',
        headline: '护栏在你坐下之前合拢',
        steps: [
          { at: 0, text: '你靠近坐面。' },
          { at: 700, text: '折叠护栏自动闭合，把坐面包成一个笼子。' },
          { at: 1500, text: `入座成功率 ${Math.round(m.access * 100)}%，支撑力 ${Math.round(m.support * 100)}%。` },
        ],
        verdict: '它保护坐垫的方式，是不让任何人坐。',
      };
    }
    return {
      success: true, animation: 'ok', reason: '正常',
      headline: '还能坐',
      steps: [
        { at: 0, text: '你坐下，椅子没有移动。' },
        { at: 800, text: '支撑结构稳定，护栏保持收起。' },
      ],
      verdict: '这一代仍然是一把椅子。',
    };
  }

  if (family === 'umbrella') {
    if (genes.flags.canopyInverted) {
      return {
        success: false, animation: 'funnel', reason: '伞面反转',
        headline: '雨被精准地收集到你头上',
        steps: [
          { at: 0, text: '你走进雨区，撑开伞。' },
          { at: 800, text: '伞面是翻转的漏斗，雨水沿伞骨汇到中心。' },
          { at: 1600, text: '水柱从伞顶的孔洞直接落下，落在你的肩上。' },
        ],
        verdict: '挡雨成功率 0%，集雨成功率 100%。',
      };
    }
    if (genes.flags.autonomous) {
      return {
        success: false, animation: 'walkaway', reason: '自主逃离',
        headline: '伞自己去找雨了',
        steps: [
          { at: 0, text: '你撑开伞，雨点落下。' },
          { at: 700, text: '伞柄脱离你的手，四足支架开始移动。' },
          { at: 1500, text: '它走到空地中央，把自己完全打开，替你淋完了这场雨。' },
        ],
        verdict: '它保护的是自己的伞面。',
      };
    }
    if (genes.flags.nested >= 2 || m.grip < 0.35) {
      return {
        success: false, animation: 'nested', reason: '结构过载',
        headline: '层层伞冠吃掉了持伞空间',
        steps: [
          { at: 0, text: '你试图把伞举过头顶。' },
          { at: 800, text: `${genes.flags.nested} 层伞冠互相嵌套，总重量与体积超过单手持握上限。` },
          { at: 1600, text: `持握成功率 ${Math.round(m.grip * 100)}%，伞下空间为负。` },
        ],
        verdict: '每一层都在挡雨，除了最里面那一层。',
      };
    }
    return {
      success: true, animation: 'ok', reason: '正常',
      headline: '伞还能挡雨',
      steps: [
        { at: 0, text: '你撑开伞，走进雨区。' },
        { at: 800, text: '伞面完整，雨水沿伞缘落下。' },
      ],
      verdict: '暂时还是一把伞。',
    };
  }

  if (genes.flags.autonomous) {
    return {
      success: false, animation: 'walkaway', reason: '自主逃离',
      headline: '垃圾桶开始追逐垃圾源',
      steps: [
        { at: 0, text: '你把纸团投向桶口。' },
        { at: 700, text: '桶底轮子启动，桶身向你移动。' },
        { at: 1500, text: '它判定你是垃圾源，开始追逐你。' },
      ],
      verdict: '接收率 0%，追击率 100%。',
    };
  }
  if (genes.flags.rimSealed || m.accept < 0.3) {
    return {
      success: false, animation: m.accept < 0.3 && !genes.flags.rimSealed ? 'claw' : 'reject', reason: genes.flags.rimSealed ? '入口封闭' : '机械爪拦截',
      headline: genes.flags.rimSealed ? '垃圾桶拒收一切垃圾' : '机械爪把垃圾还给了你',
      steps: [
        { at: 0, text: '你把纸团投向桶口。' },
        { at: 700, text: genes.flags.rimSealed ? '污染检测门判定纸团可能弄脏内壁，入口保持闭合。' : '机械爪在半空接住纸团，沿原路送回你手里。' },
        { at: 1500, text: `接收成功率 ${Math.round(m.accept * 100)}%，卫生评分 ${Math.round(m.hygiene * 100)}%。` },
      ],
      verdict: '它为了保持洁净，拒绝了唯一的工作。',
    };
  }
  return {
    success: true, animation: 'ok', reason: '正常',
    headline: '垃圾被接收',
    steps: [
      { at: 0, text: '你把纸团投向桶口。' },
      { at: 800, text: '纸团落进桶内，桶盖复位。' },
    ],
    verdict: '这一代仍然是一个垃圾桶。',
  };
}

export function testLabel(family: FamilyId): string {
  return FAMILIES[family].testName;
}
