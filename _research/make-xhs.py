from PIL import Image, ImageDraw, ImageFont, ImageOps
import os

OUT = '提交材料/小红书'
os.makedirs(OUT, exist_ok=True)
BG = (10, 20, 16)
CREAM = (238, 233, 219)
MUTED = (160, 178, 166)
ACCENT = (216, 162, 106)
LINE = (54, 70, 61)

BOLD = 'C:/Windows/Fonts/msyhbd.ttc'
REG = 'C:/Windows/Fonts/msyh.ttc'

def f(size, bold=False):
    return ImageFont.truetype(BOLD if bold else REG, size)

def text(d, xy, s, size, color=CREAM, bold=False, anchor='la'):
    d.text(xy, s, font=f(size, bold), fill=color, anchor=anchor)

def fit(path, w, h):
    im = Image.open(path).convert('RGB')
    return ImageOps.fit(im, (w, h), Image.LANCZOS, centering=(0.5, 0.5))

def base():
    return Image.new('RGB', (1080, 1440), BG)

def footer(d, idx):
    d.line([(64, 1340), (1016, 1340)], fill=LINE, width=2)
    text(d, (64, 1360), '#Aholo黑客松', 30, ACCENT, True)
    text(d, (1016, 1368), f'{idx:02d} / 04', 20, MUTED, False, 'ra')

# 01 Cover
im = base(); d = ImageDraw.Draw(im)
text(d, (64, 56), '2026 AHOLO 全球 3D AI 黑客松', 24, MUTED)
text(d, (1016, 56), 'PROJECT 001', 22, MUTED, False, 'ra')
text(d, (60, 120), '废物进化论', 104, CREAM, True)
text(d, (64, 246), '物的觉醒', 54, ACCENT, True)
text(d, (68, 312), 'THE AWAKENING OF THINGS', 22, MUTED)
im.paste(fit('报告/figs-awake/fig-cover.png', 952, 637), (64, 388))
d.line([(64, 1062), (1016, 1062)], fill=LINE, width=2)
text(d, (64, 1082), '四件日常物品 · 五个进化阶段', 28, CREAM, True)
text(d, (64, 1124), '水杯 / 椅子 / 雨伞 / 垃圾桶', 24, MUTED)
text(d, (64, 1208), '“不必有用，也可以有自己的生命。”', 28, CREAM)
text(d, (64, 1284), '3D 生成 · 后制动画', 28, ACCENT, True)
text(d, (1016, 1292), 'Aholo Lux3D', 20, MUTED, False, 'ra')
footer(d, 1)
im.save(f'{OUT}/01-cover.png')

# 02 Four exhibits
im = base(); d = ImageDraw.Draw(im)
text(d, (64, 56), 'FOUR SPECIMENS', 24, MUTED)
text(d, (60, 120), '四件展品', 92, CREAM, True)
text(d, (64, 226), '四种性格', 58, ACCENT, True)
im.paste(fit('报告/figs-awake/fig-four.png', 952, 789), (64, 330))
text(d, (64, 1150), '水杯 · 椅子 · 雨伞 · 垃圾桶', 30, CREAM, True)
text(d, (64, 1194), '保留原来的材质、轮廓与使用痕迹', 24, MUTED)
text(d, (64, 1258), '它们没有变成别的东西，只是第一次为自己动起来。', 24, CREAM)
footer(d, 2)
im.save(f'{OUT}/02-four-exhibits.png')

# 03 Five stages
im = base(); d = ImageDraw.Draw(im)
text(d, (64, 56), 'ONE CUP · FIVE STAGES', 24, MUTED)
text(d, (60, 120), '一只杯子的', 68, CREAM, True)
text(d, (64, 198), '五次变化', 68, ACCENT, True)
rows = [
    ('01', '原物', '它还只是，一只杯子。'),
    ('02', '苏醒', '杯壁呼吸，三足萌芽。'),
    ('03', '行走', '它决定，自己去别处。'),
    ('04', '感知', '把手旁，长出双触角。'),
    ('05', '绽放', '它不再盛放，它盛开自己。'),
]
for i, (num, name, desc) in enumerate(rows):
    y = 300 + i * 198
    im.paste(fit(f'报告/figs-awake/cup-clean-{i+1}.png', 240, 180), (64, y))
    text(d, (340, y + 18), num, 24, ACCENT, True)
    text(d, (390, y + 8), name, 38, CREAM, True)
    text(d, (340, y + 66), desc, 24, MUTED)
    d.line([(340, y + 118), (1016, y + 118)], fill=LINE, width=1)
footer(d, 3)
im.save(f'{OUT}/03-five-stages.png')

# 04 Workshop
im = base(); d = ImageDraw.Draw(im)
text(d, (64, 56), 'MAKE YOUR OWN', 24, MUTED)
text(d, (60, 120), '你也可以', 76, CREAM, True)
text(d, (64, 206), '让它继续进化', 64, ACCENT, True)
im.paste(fit('_research/new-shots/workshop.png', 952, 595), (64, 330))
text(d, (64, 960), '输入描述 → Aholo 生成 → 从任意一代分支', 28, CREAM, True)
text(d, (64, 1006), '每一代都保存提示词、父节点与任务编号。', 24, MUTED)
text(d, (64, 1050), '生成的是新的形态，不是对上一代网格的精确编辑。', 24, MUTED)
text(d, (64, 1130), '“不必有用，也可以有自己的生命。”', 26, CREAM)
text(d, (64, 1190), '在四件展品之外，留一个自己创作的位置。', 24, MUTED)
footer(d, 4)
im.save(f'{OUT}/04-workshop.png')

print('done', os.listdir(OUT))