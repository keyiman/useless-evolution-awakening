"""用 python-pptx 生成 16:9 深色路演 PPT。图片来自 报告/figs。"""
import os
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

BG = RGBColor(0x0D, 0x10, 0x14)
FG = RGBColor(0xF2, 0xF4, 0xF7)
MUTED = RGBColor(0x9A, 0xA3, 0xAE)
ACCENT = RGBColor(0xE2, 0x70, 0x3A)
LINE = RGBColor(0x2A, 0x31, 0x3A)
FONT = "Microsoft YaHei"
MONO = "Consolas"

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
BLANK = prs.slide_layouts[6]
W, H = 13.333, 7.5


def slide():
    s = prs.slides.add_slide(BLANK)
    bg = s.shapes.add_shape(1, 0, 0, prs.slide_width, prs.slide_height)
    bg.fill.solid()
    bg.fill.fore_color.rgb = BG
    bg.line.fill.background()
    return s


def text(s, x, y, w, h, runs, size=18, color=FG, bold=False, font=FONT, align=PP_ALIGN.LEFT, spacing=1.15):
    tb = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = MSO_ANCHOR.TOP
    for i, line in enumerate(runs if isinstance(runs, list) else [runs]):
        for j, part in enumerate(str(line).split("\n")):
            if i == 0 and j == 0:
                p = tf.paragraphs[0]
            else:
                p = tf.add_paragraph()
            p.alignment = align
            p.line_spacing = spacing
            r = p.add_run()
            r.text = part
            r.font.size = Pt(size)
            r.font.bold = bold
            r.font.color.rgb = color
            r.font.name = font
    return tb


def bar(s, x, y, w=0.6, color=ACCENT):
    sh = s.shapes.add_shape(1, Inches(x), Inches(y), Inches(w), Inches(0.06))
    sh.fill.solid()
    sh.fill.fore_color.rgb = color
    sh.line.fill.background()


def image(s, path, x, y, w=None, h=None):
    if not os.path.exists(path):
        return False
    kw = {}
    if w: kw["width"] = Inches(w)
    if h: kw["height"] = Inches(h)
    s.shapes.add_picture(path, Inches(x), Inches(y), **kw)
    return True


def kicker(s, t):
    text(s, 0.8, 0.55, 6, 0.3, t, size=11, color=ACCENT, bold=True)


def title(s, t, sub=None):
    text(s, 0.8, 0.9, 11.5, 0.9, t, size=32, bold=True)
    if sub:
        text(s, 0.8, 1.75, 11.5, 0.6, sub, size=14, color=MUTED)


def footer(s, n):
    text(s, 0.8, 7.0, 8, 0.3, "废物进化论 · 不适者生存　|　2026 Aholo 全球 3D AI 黑客松", size=9, color=MUTED)
    text(s, 12.1, 7.0, 0.6, 0.3, f"{n:02d}", size=9, color=MUTED, align=PP_ALIGN.RIGHT)


# 1 cover
s = slide()
text(s, 0.9, 0.9, 7, 0.35, "2026 AHOLO GLOBAL 3D AI HACKATHON", size=11, color=ACCENT, bold=True)
text(s, 0.85, 1.6, 7.2, 2.2, ["废物进化论", "不适者生存"], size=54, bold=True, spacing=1.05)
text(s, 0.9, 4.1, 7, 0.5, "USELESS EVOLUTION", size=16, color=MUTED)
text(s, 0.9, 4.75, 6.4, 1.2,
     "输入一个种子，看一件日常物品逐代进化，\n直到它仍然装满了水，却拒绝让任何人喝到。",
     size=16, color=FG, spacing=1.4)
text(s, 0.9, 6.55, 6.5, 0.4, "React · Three.js · Aholo Lux3D G1-Turbo", size=11, color=MUTED)
image(s, "报告/figs/fig-asset-g5.png", 7.7, 1.15, w=5.0)
text(s, 7.75, 6.15, 5, 0.4, "G5 · 封口水杯（Lux3D 真实生成）", size=10, color=MUTED)

# 2 problem
s = slide()
kicker(s, "01　问题")
title(s, "只优化一个指标的系统，会越来越成功地变得不可用")
bar(s, 0.8, 2.55)
text(s, 0.85, 2.85, 11.6, 1.4,
     "水杯可以做到“一滴也不洒”，代价是“一滴也倒不出来”。\n每一个新增部件都合理，整体却不再适合被使用。",
     size=20, spacing=1.45)
for i, (h, d) in enumerate([
    ("珍道具 Chindogu", "逻辑上成立、使用上失败的发明"),
    ("规格膨胀", "功能越多，核心任务越容易被挤掉"),
    ("谱系可视化", "让每一次选择与失败都能被追溯"),
]):
    x = 0.85 + i * 4.0
    text(s, x, 4.6, 3.6, 0.4, h, size=16, bold=True)
    text(s, x, 5.05, 3.6, 0.9, d, size=12, color=MUTED, spacing=1.3)
footer(s, 2)

# 3 what
s = slide()
kicker(s, "02　作品")
title(s, "一个可玩的 3D 进化树，而不是一次抽卡")
steps = [("01", "选祖先 · 定种子", "4 个家族，种子决定全部随机"), ("02", "每代三选一", "6 算子 / 8 稀有事件 / 可回溯"), ("03", "Lux3D 生成", "真实 GLB，进入无用性测试")]
for i, (n, h, d) in enumerate(steps):
    x = 0.85 + i * 4.05
    text(s, x, 2.5, 3.6, 0.3, n, size=11, color=ACCENT, font=MONO, bold=True)
    text(s, x, 2.85, 3.6, 0.5, h, size=18, bold=True)
    text(s, x, 3.4, 3.6, 0.8, d, size=12, color=MUTED, spacing=1.3)
image(s, "报告/figs/fig-intro.png", 0.85, 4.35, w=11.6)
footer(s, 3)

# 4 play
s = slide()
kicker(s, "03　玩法")
title(s, "把“代价”放在选择之前")
image(s, "报告/figs/fig-candidates.png", 0.8, 2.2, w=11.7)
for i, (h, d) in enumerate([
    ("三选一", "同一父节点、同一槽位，三个候选永久可复现"),
    ("谱系 DAG", "可回溯、可分叉，已生成的分支不会被删除"),
    ("双亲杂交", "两个标本融合，继承双方的结构冲突"),
]):
    x = 0.85 + i * 3.95
    text(s, x, 5.35, 3.7, 0.35, h, size=14, bold=True)
    text(s, x, 5.75, 3.7, 0.8, d, size=10.5, color=MUTED, spacing=1.3)
footer(s, 4)

# 5 algorithm
s = slide()
kicker(s, "04　算法")
title(s, "随机必须可复现，失败必须可解释")
text(s, 0.85, 2.2, 5.4, 0.35, "确定性随机", size=14, bold=True)
text(s, 0.85, 2.6, 5.4, 0.9, "key = 版本 | 种子 | 父哈希 | 槽位\nrng = mulberry32(cyrb128(key))", size=11, color=MUTED, font=MONO, spacing=1.5)
text(s, 0.85, 3.7, 5.4, 0.35, "综合评分", size=14, bold=True)
text(s, 0.85, 4.1, 5.4, 0.6, "Q = 0.30N + 0.30A + 0.20R + 0.20D", size=13, color=ACCENT, font=MONO)
text(s, 0.85, 4.8, 5.4, 1.6, "400 条路径双次重放：\n确定性不一致 0 · 非法值 0 · 候选重复 0", size=13, color=FG, spacing=1.4)

rows = [("M1", "增生", "附件增加，维护成本上升"), ("M2", "变比", "比例改变，接触几何失效"), ("M3", "反转", "出入口交换，能量进得去出不来"), ("M4", "递归", "嵌套保护，被保护者不可用"), ("M5", "融合", "异物拓扑，两套功能耦合冲突"), ("M6", "寄生", "机器只为维护自己而工作")]
y = 2.2
for i, (k, n, d) in enumerate(rows):
    text(s, 6.6, y, 0.5, 0.3, k, size=11, color=ACCENT, font=MONO, bold=True)
    text(s, 7.2, y - 0.02, 1.0, 0.3, n, size=12, bold=True)
    text(s, 8.2, y - 0.02, 4.4, 0.3, d, size=10.5, color=MUTED)
    y += 0.62
footer(s, 5)

# 6 lux3d
s = slide()
kicker(s, "05　Lux3D 管线")
title(s, "把结构描述变成可信的产品级网格")
flow = ["POST 创建任务", "轮询状态", "下载 GLB", "本地缓存"]
for i, f in enumerate(flow):
    x = 0.85 + i * 3.05
    sh = s.shapes.add_shape(1, Inches(x), Inches(2.35), Inches(2.55), Inches(0.75))
    sh.fill.solid(); sh.fill.fore_color.rgb = RGBColor(0x16, 0x1B, 0x21)
    sh.line.color.rgb = LINE
    text(s, x + 0.1, 2.52, 2.35, 0.4, f, size=12, bold=True, align=PP_ALIGN.CENTER)
    if i < 3:
        text(s, x + 2.6, 2.5, 0.4, 0.4, "→", size=16, color=ACCENT)
text(s, 0.85, 3.45, 6.0, 0.3, "提示词由基因型生成（五段式）", size=13, bold=True)
text(s, 0.85, 3.85, 6.2, 2.4,
     "Object: one drinking cup…\nInherited: cylindrical body, open rim…\nMutation: the opening is sealed shut…\nGeometry: connected parts, one object…\nStyle: premium industrial design…",
     size=9.5, color=MUTED, font=MONO, spacing=1.5)
text(s, 7.4, 3.45, 5.2, 0.3, "参数", size=13, bold=True)
for i, (k, v) in enumerate([("version", "G1-Turbo"), ("outputFormat", '["glb"]'), ("faceCount", "120000"), ("enablePbr", "true")]):
    text(s, 7.4, 3.9 + i * 0.42, 2.2, 0.3, k, size=10.5, color=MUTED, font=MONO)
    text(s, 9.5, 3.9 + i * 0.42, 3.0, 0.3, v, size=10.5, color=FG, font=MONO)
text(s, 7.4, 5.9, 5.2, 0.8, "结果 URL 仅 2 小时有效，服务端拿到即下载并写入 manifest。", size=10.5, color=MUTED, spacing=1.3)
footer(s, 6)

# 7 assets
s = slide()
kicker(s, "06　资产迭代")
title(s, "同一颗种子，每一代看到的结构描述都不同")
for i, (g, cap) in enumerate([("0", "原始水杯"), ("3", "寄生 + 递归"), ("5", "反转 · 封口")]):
    image(s, f"报告/figs/fig-asset-g{g}.png", 0.8 + i * 4.1, 2.25, w=3.75)
    text(s, 0.85 + i * 4.1, 4.75, 3.75, 0.4, f"G{g}　{cap}", size=12, color=FG)
text(s, 0.85, 5.45, 11.6, 0.9, "仍然能盛水，但 pour 与 drink 被密封盖压到接近零；几何平均把整体 U 从 0.90 拉到 0.17。", size=12, color=MUTED, spacing=1.35)
footer(s, 7)

# 8 test
s = slide()
kicker(s, "07　无用性测试")
title(s, "它现在一滴也不会洒——因为一滴也倒不出来")
image(s, "报告/figs/fig-test.png", 0.8, 2.2, w=7.2)
text(s, 8.4, 2.4, 4.1, 3.5,
     "测试失败\n\n倾斜到最大角度，水面始终不越过杯口。\n\n密封盖 与 饮用口\n两个各自合理的结构，互相否定。",
     size=13, spacing=1.5)
footer(s, 8)

# 9 engineering
s = slide()
kicker(s, "08　工程")
title(s, "可复现、可降级、可部署")
for i, (n, l) in enumerate([("400", "条路径双次重放"), ("0", "次确定性不一致"), ("12", "个真实 Lux3D 资产"), ("6%", "压缩后体积占比")]):
    x = 0.85 + i * 3.0
    text(s, x, 2.35, 2.6, 0.8, n, size=40, bold=True, font=MONO, color=ACCENT)
    text(s, x, 3.2, 2.6, 0.6, l, size=11, color=MUTED)
text(s, 0.85, 4.25, 11.6, 2.0,
     "· 生成失败只影响表现型：保留草模、显示原因、可重试，谱系与分享链接不变。\n"
     "· 并发限制 1，前端串行化；提示词哈希缓存命中即秒开。\n"
     "· API Key 仅存在于服务端环境变量，构建产物与分享链接均不包含。\n"
     "· 原始 GLB 约 11 MB → webp + meshopt 约 0.7 MB。",
     size=13, spacing=1.6)
footer(s, 9)

# 10 end
s = slide()
text(s, 0.9, 1.6, 11.5, 1.2, "同一个种子，同一条路径，\n永远得到同一组结果。", size=40, bold=True, spacing=1.25)
bar(s, 0.9, 3.5)
text(s, 0.9, 3.9, 11.5, 1.0, "废物进化论：不适者生存　|　Useless Evolution", size=18, color=ACCENT)
text(s, 0.9, 4.6, 11.5, 1.4,
     "Demo：【部署后填写】\n源代码：【仓库地址】\n团队：【成员与分工】",
     size=13, color=MUTED, spacing=1.6)
text(s, 0.9, 6.6, 11.5, 0.4, "Aholo Lux3D G1-Turbo · Three.js · React · Node", size=10, color=MUTED)

os.makedirs("提交材料", exist_ok=True)
out = "提交材料/废物进化论_路演.pptx"
prs.save(out)
print("saved", out, "slides", len(prs.slides))
