from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from PIL import Image
import os

W, H = 13.333, 7.5
BG = RGBColor(13, 16, 20)
PANEL = RGBColor(20, 24, 30)
ACCENT = RGBColor(226, 112, 58)
TEXT = RGBColor(242, 244, 247)
MUTED = RGBColor(154, 161, 171)
LINE = RGBColor(44, 51, 61)
GREEN = RGBColor(90, 180, 150)
FONT = "Microsoft YaHei"

prs = Presentation()
prs.slide_width = Inches(W)
prs.slide_height = Inches(H)
BLANK = prs.slide_layouts[6]


def slide():
    s = prs.slides.add_slide(BLANK)
    bg = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(W), Inches(H))
    bg.fill.solid(); bg.fill.fore_color.rgb = BG; bg.line.fill.background()
    return s


def text(s, x, y, w, h, content, size=18, color=TEXT, bold=False, align=PP_ALIGN.LEFT,
         spacing=1.15, font=FONT):
    tb = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.TOP
    lines = content.split("\n")
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.line_spacing = spacing
        r = p.add_run()
        r.text = line
        r.font.size = Pt(size)
        r.font.bold = bold
        r.font.color.rgb = color
        r.font.name = font
    return tb


def kicker(s, content, y=0.45):
    text(s, 0.72, y, 8.0, 0.3, content, 10, ACCENT, False)
    line = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.72), Inches(y + 0.34), Inches(0.6), Inches(0.02))
    line.fill.solid(); line.fill.fore_color.rgb = ACCENT; line.line.fill.background()


def pagenum(s, n):
    text(s, 12.3, 7.05, 0.6, 0.25, f"{n:02d}", 9, MUTED, False, PP_ALIGN.RIGHT)


def img(s, path, x, y, w, h, border=True):
    if not os.path.exists(path):
        box = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
        box.fill.solid(); box.fill.fore_color.rgb = PANEL
        box.line.color.rgb = LINE
        text(s, x + 0.2, y + h / 2 - 0.2, w - 0.4, 0.4, f"[missing] {os.path.basename(path)}", 10, MUTED, False, PP_ALIGN.CENTER)
        return
    iw, ih = Image.open(path).size
    scale = min(w / iw, h / ih)
    nw, nh = iw * scale, ih * scale
    s.shapes.add_picture(path, Inches(x + (w - nw) / 2), Inches(y + (h - nh) / 2), Inches(nw), Inches(nh))


def panel(s, x, y, w, h, color=PANEL):
    box = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    box.fill.solid(); box.fill.fore_color.rgb = color
    box.line.color.rgb = LINE
    box.adjustments[0] = 0.06
    return box


def bullet(s, x, y, w, title, body, color=ACCENT):
    dot = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(x), Inches(y + 0.08), Inches(0.1), Inches(0.1))
    dot.fill.solid(); dot.fill.fore_color.rgb = color; dot.line.fill.background()
    text(s, x + 0.2, y, w - 0.2, 0.32, title, 15, TEXT, True)
    text(s, x + 0.2, y + 0.38, w - 0.2, 0.62, body, 11, MUTED, False, spacing=1.3)


# 1 — title
s = slide()
text(s, 0.72, 0.55, 6.4, 0.3, "2026 AHOLO GLOBAL 3D AI HACKATHON", 10, ACCENT)
text(s, 0.72, 1.15, 6.6, 1.9, "废物进化论\n器官库", 46, TEXT, True, spacing=1.05)
text(s, 0.72, 3.05, 6.3, 0.5, "Useless Evolution: The Organ Library", 15, MUTED)
text(s, 0.72, 3.7, 6.1, 1.2, "32 个 Lux3D 器官 × 4 个日常物体\n把“过度设计”变成可以亲手拼装的 3D 实验", 15, TEXT, False, spacing=1.45)
img(s, "报告/figs/fig-lab-hero.png", 7.1, 0.7, 5.6, 6.1)
text(s, 0.72, 6.55, 6.4, 0.3, "React · Three.js · Node · Aholo Lux3D G1-Turbo", 9, MUTED)
pagenum(s, 1)

# 2 — numbers
s = slide()
kicker(s, "01 / 规模")
text(s, 0.72, 1.0, 8.5, 0.7, "一只杯子，32 种长歪的方式", 30, TEXT, True)
text(s, 0.72, 1.85, 11.8, 0.5, "不是 3 个候选，也不是 8 个固定部件；32 个独立器官、4 类锚点、最多 4 个叠加。", 14, MUTED)
kpis = [("32", "Lux3D 器官"), ("4", "基础物体"), ("41,449", "组合 / 基础"), ("32", "真实器官资产")]
for i, (n, label) in enumerate(kpis):
    x = 0.72 + i * 3.05
    panel(s, x, 2.75, 2.8, 1.55)
    text(s, x + 0.22, 2.92, 2.3, 0.7, n, 34, ACCENT, True)
    text(s, x + 0.22, 3.72, 2.4, 0.3, label, 10, MUTED)
text(s, 0.72, 4.75, 11.8, 0.9, "4 个槽位 × 32 个器官，含空组合共 41,449 种；再乘 4 个基础物体。\n组合数不是堆料，而是让同一只杯子走向完全不同的失败。", 13, MUTED, False, spacing=1.5)
pagenum(s, 2)

# 3 — problem
s = slide()
kicker(s, "02 / 问题")
text(s, 0.72, 1.0, 11.5, 0.7, "单次生成很惊艳，但没有“为什么”", 30, TEXT, True)
bullet(s, 0.72, 2.1, 5.6, "只能抽卡", "输入一句提示词，得到一个网格；想比较两个方向，只能重新生成。")
bullet(s, 0.72, 3.15, 5.6, "过程不可见", "玩家看不到是哪一个结构让杯子不能用，也看不到代价。")
bullet(s, 0.72, 4.2, 5.6, "每次都要等", "Lux3D 任务 2–5 分钟；把生成放进运行时，体验会被等待切碎。")
panel(s, 7.0, 2.0, 5.6, 3.9)
text(s, 7.25, 2.2, 5.1, 0.3, "这一版的选择", 11, ACCENT)
text(s, 7.25, 2.65, 5.1, 2.9, "赛前：用 Lux3D 建好 32 个器官 + 4 个基础\n\n运行时：只做组合、评价、测试\n\n模型调用：0 次", 16, TEXT, False, spacing=1.55)
pagenum(s, 3)

# 4 — pipeline
s = slide()
kicker(s, "03 / 方向")
text(s, 0.72, 1.0, 11.5, 0.7, "Lux3D 是生产线，不是运行时魔法", 30, TEXT, True)
steps = [("赛前 · Lux3D", "32 个器官\n4 个基础"), ("资产库", "GLB + manifest\n提示词哈希"), ("运行时 · R3F", "拼装 / 评价\n测试 / 分享"), ("玩家", "自由组合\n自主变异")]
for i, (t, b) in enumerate(steps):
    x = 0.72 + i * 3.15
    panel(s, x, 2.3, 2.8, 1.7)
    text(s, x + 0.2, 2.48, 2.4, 0.3, t, 13, ACCENT, True)
    text(s, x + 0.2, 2.9, 2.4, 0.8, b, 11, TEXT, False, spacing=1.4)
    if i < 3:
        text(s, x + 2.84, 2.95, 0.3, 0.3, "→", 18, ACCENT, True)
text(s, 0.72, 4.45, 11.8, 0.9, "所有可见几何都在开发阶段生成、压缩、写入 manifest；\nDemo 只加载本地 GLB，断网也能玩。", 14, MUTED, False, spacing=1.5)
pagenum(s, 4)

# 5 — organ library
s = slide()
kicker(s, "04 / 器官库")
text(s, 0.72, 1.0, 8.0, 0.7, "32 个器官，四类锚点", 30, TEXT, True)
text(s, 0.72, 1.8, 5.0, 0.4, "顶部 8 · 侧面 14 · 底部 6 · 环绕 4", 13, ACCENT)
img(s, "报告/figs/fig-organ-grid.png", 0.72, 2.35, 7.4, 4.4)
panel(s, 8.4, 2.35, 4.2, 4.4)
text(s, 8.65, 2.55, 3.7, 0.3, "每个器官都有", 11, ACCENT)
text(s, 8.65, 2.95, 3.7, 3.5, "独立提示词\n独立 GLB\n独立功能代价\n独立测试标签\n\n不是换色，也不是贴图。", 14, TEXT, False, spacing=1.5)
pagenum(s, 5)

# 6 — free combination
s = slide()
kicker(s, "05 / 组合")
text(s, 0.72, 1.0, 8.5, 0.7, "最多 4 个，4.1 万种组合", 30, TEXT, True)
img(s, "报告/figs/fig-lab-default.png", 0.72, 1.95, 8.4, 4.9)
for i, (t, b) in enumerate([("分类筛选", "顶 / 侧 / 底 / 环绕"), ("点击叠加", "超过 4 个替换最早"), ("实时评价", "U / A / R / Q"), ("一键分享", "只含组合，不含密钥")]):
    y = 1.95 + i * 1.22
    text(s, 9.45, y, 3.2, 0.3, t, 13, ACCENT, True)
    text(s, 9.45, y + 0.32, 3.2, 0.5, b, 11, MUTED)
pagenum(s, 6)

# 7 — fusion
s = slide()
kicker(s, "06 / 融合")
text(s, 0.72, 1.0, 8.0, 0.7, "两个祖先，长在一起", 30, TEXT, True)
img(s, "报告/figs/fig-lab-fusion.png", 0.72, 1.95, 7.8, 4.9)
panel(s, 8.9, 2.0, 3.7, 3.2)
text(s, 9.15, 2.2, 3.2, 0.3, "融合代价", 11, ACCENT)
text(s, 9.15, 2.65, 3.2, 2.3, "可用性  −0.12\n荒诞度  +0.30\n辨识度  −0.18\n\n测试优先提示\n“它们长在了一起”", 14, TEXT, False, spacing=1.5)
text(s, 0.72, 7.0, 8.0, 0.25, "第二个基础缩到 0.62，偏移到侧后方，与主基础互相穿插。", 10, MUTED)
pagenum(s, 7)

# 8 — autonomous
s = slide()
kicker(s, "07 / 自主变异")
text(s, 0.72, 1.0, 9.0, 0.7, "不点按钮，它也会变", 30, TEXT, True)
img(s, "报告/figs/fig-lab-auto.png", 0.72, 1.95, 7.8, 4.9)
panel(s, 8.9, 2.0, 3.7, 3.4)
text(s, 9.15, 2.2, 3.2, 0.3, "每 4.8 秒", 11, ACCENT)
text(s, 9.15, 2.65, 3.2, 2.5, "32% 概率掉落\n否则长出一个\n\n变异写入记录\n可以回看每一步", 14, TEXT, False, spacing=1.5)
text(s, 0.72, 7.0, 8.0, 0.25, "“自己长出了「气球」”——玩家不操作，物体会自己选择方向。", 10, MUTED)
pagenum(s, 8)

# 9 — evaluation
s = slide()
kicker(s, "08 / 评价")
text(s, 0.72, 1.0, 9.0, 0.7, "评价不是黑箱", 30, TEXT, True)
panel(s, 0.72, 1.95, 6.0, 3.1, RGBColor(18, 22, 27))
text(s, 1.0, 2.15, 5.5, 0.3, "公式", 10, ACCENT)
text(s, 1.0, 2.6, 5.5, 2.2, "U = clamp(U_base + Σ organ.utility − 0.12·fusion)\nA = clamp(0.08 + Σ absurdity + 0.30·fusion)\nR = clamp(1.00 + Σ recognition − 0.18·fusion)\nQ = 0.4U + 0.3A + 0.2R + 0.1·组合度", 11, TEXT, False, spacing=1.55)
text(s, 7.1, 1.95, 5.4, 0.3, "四器官例子", 11, ACCENT)
text(s, 7.1, 2.4, 5.4, 2.6, "水杯 0.90\n− 密封盖 0.55\n− 机械臂 0.18\n− 轮式底盘 0.30\n− 防护笼 0.40\n= −0.53 → U 0.00", 13, TEXT, False, spacing=1.45)
text(s, 0.72, 5.3, 11.8, 0.8, "每个数字都能在模型上找到对应器官；右侧面板逐项展开，不把总分藏在黑箱里。", 13, MUTED)
pagenum(s, 9)

# 10 — test
s = slide()
kicker(s, "09 / 测试")
text(s, 0.72, 1.0, 9.0, 0.7, "结构决定它怎么失败", 30, TEXT, True)
img(s, "报告/figs/fig-lab-test.png", 0.72, 1.95, 8.0, 4.9)
panel(s, 9.0, 2.0, 3.6, 3.8)
text(s, 9.25, 2.2, 3.1, 0.3, "触发结构", 10, ACCENT)
text(s, 9.25, 2.65, 3.1, 3.0, "防护笼\n\n“它被保护得\n太好了”\n\n只列出真正\n拥有该标签的\n器官", 13, TEXT, False, spacing=1.45)
text(s, 0.72, 7.0, 8.0, 0.25, "倾斜 / 移动 / 下沉 / 弹跳 / 旋转 / 折叠：动作直接作用在当前拼装出的 GLB 上。", 10, MUTED)
pagenum(s, 10)

# 11 — pipeline details
s = slide()
kicker(s, "10 / 生产")
text(s, 0.72, 1.0, 9.0, 0.7, "32 个器官，怎么建出来", 30, TEXT, True)
steps = [("提示词", "隔离模块模板\n不含杯子 / 背景"), ("批量任务", "4 个一批并行\n串行轮询落盘"), ("压缩", "WebP 1024\nmeshopt"), ("复核", "manifest 保留\ntaskId / 体积")]
for i, (t, b) in enumerate(steps):
    x = 0.72 + i * 3.15
    panel(s, x, 2.0, 2.8, 1.7)
    text(s, x + 0.2, 2.18, 2.4, 0.3, t, 13, ACCENT, True)
    text(s, x + 0.2, 2.6, 2.4, 0.9, b, 11, TEXT, False, spacing=1.4)
text(s, 0.72, 4.15, 11.8, 0.4, "首批 8 个器官的 taskId 已写入报告；其余 24 个同样记录在 manifest。", 12, MUTED)
panel(s, 0.72, 4.85, 11.9, 1.55)
text(s, 1.0, 5.05, 11.3, 1.1, "4788220 密封盖   ·   4788267 机械臂   ·   4788512 轮式底盘   ·   4788559 稳定环\n4788769 倒置伞面   ·   4789643 防护笼   ·   4789049 巨柄   ·   4789094 寄生装置", 12, TEXT, False, spacing=1.6)
pagenum(s, 11)

# 12 — end
s = slide()
kicker(s, "11 / 边界与下一步")
text(s, 0.72, 1.0, 11.5, 0.8, "先把“能玩”做扎实", 32, TEXT, True)
cols = [
    ("已完成", "32 个器官资产\n自由组合 / 融合\n自主变异 / 评价 / 测试\n旧版进化树保留为拓展"),
    ("刻意没做", "运行时生成\n物理仿真\n自动装配求解\n超过 4 个槽位"),
    ("下一步", "扩到 60+ 器官\n器官间相互反应\n轻量物理\n器官工坊"),
]
for i, (t, b) in enumerate(cols):
    x = 0.72 + i * 4.05
    panel(s, x, 2.0, 3.7, 2.9)
    text(s, x + 0.25, 2.2, 3.2, 0.3, t, 12, ACCENT, True)
    text(s, x + 0.25, 2.65, 3.2, 2.0, b, 12, TEXT, False, spacing=1.6)
text(s, 0.72, 5.35, 11.8, 0.9, "废物进化论 · 器官库\n给日常物品装上本不该属于它的器官，看它如何一步步拒绝原来的用途。", 16, TEXT, False, spacing=1.5)
pagenum(s, 12)

out = "提交材料/废物进化论_路演_v2.pptx"
prs.save(out)
print("saved", out)
