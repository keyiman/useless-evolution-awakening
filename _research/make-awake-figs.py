from PIL import Image, ImageDraw, ImageFont

BASE = '报告/figs-awake'
FONT = 'C:/Windows/Fonts/msyh.ttc'
FONT_B = 'C:/Windows/Fonts/msyhbd.ttc'
BG = (12, 21, 18)
TXT = (232, 238, 230)
MUTED = (166, 178, 168)
ACCENT = (216, 162, 106)

def font(size, bold=False):
    return ImageFont.truetype(FONT_B if bold else FONT, size)

def cover(im, w, h):
    im = im.convert('RGB')
    s = max(w / im.width, h / im.height)
    im = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
    x = (im.width - w) // 2
    y = (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))

stages = ['01 原物', '02 苏醒', '03 行走', '04 感知', '05 绽放']
thumbs = []
for i in range(5):
    im = Image.open(f'{BASE}/cup-ui-{i+1}.png').crop((400, 80, 1200, 820))
    thumbs.append(cover(im, 300, 277))
W, H = 5 * 300 + 4 * 12 + 48, 44 + 277 + 52 + 24
canvas = Image.new('RGB', (W, H), BG)
d = ImageDraw.Draw(canvas)
d.text((24, 14), '水杯 · 五个进化阶段', font=font(26, True), fill=TXT)
for i, (thumb, label) in enumerate(zip(thumbs, stages)):
    x = 24 + i * (300 + 12)
    canvas.paste(thumb, (x, 44))
    d.text((x + 2, 44 + 277 + 10), label, font=font(22), fill=ACCENT if i == 4 else TXT)
canvas.save(f'{BASE}/fig-stage-strip.png')
print('stage strip', canvas.size)

items = [
    (f'{BASE}/cup-ui-demo.png', '水杯', '05 绽放', (400, 80, 1200, 820)),
    (f'{BASE}/chair-ui-demo.png', '椅子', '05 舒展', (400, 80, 1200, 820)),
    (f'{BASE}/umbrella-ui-demo.png', '雨伞', '05 舒展', (400, 80, 1200, 820)),
    ('_research/new-shots/bin-stage-5.png', '垃圾桶', '05 开合', (400, 80, 1200, 650)),
]
cells = []
for path, name, stage, box in items:
    im = Image.open(path).crop(box)
    cells.append((cover(im, 620, 460), name, stage))
W, H = 2 * 620 + 16 + 48, 44 + 2 * (460 + 46) + 24
canvas = Image.new('RGB', (W, H), BG)
d = ImageDraw.Draw(canvas)
d.text((24, 14), '四件展品 · 第五阶段', font=font(26, True), fill=TXT)
for i, (cell, name, stage) in enumerate(cells):
    x = 24 + (i % 2) * (620 + 16)
    y = 44 + (i // 2) * (460 + 46)
    canvas.paste(cell, (x, y))
    d.text((x + 2, y + 460 + 8), f'{name} · {stage}', font=font(22), fill=TXT)
canvas.save(f'{BASE}/fig-four.png')
print('four', canvas.size)

old = cover(Image.open('报告/figs/fig-lab-hero.png'), 760, 475)
new = cover(Image.open(f'{BASE}/cup-ui-demo.png'), 760, 475)
W, H = 2 * 760 + 16 + 48, 44 + 475 + 52 + 24
canvas = Image.new('RGB', (W, H), BG)
d = ImageDraw.Draw(canvas)
d.text((24, 14), '从“器官拼装”到“角色进化”', font=font(26, True), fill=TXT)
for i, (im, label) in enumerate([(old, '旧版 · 32 器官自由拼装'), (new, '新版 · 4 件展品 × 5 阶段')]):
    x = 24 + i * (760 + 16)
    canvas.paste(im, (x, 44))
    d.text((x + 2, 44 + 475 + 10), label, font=font(22), fill=ACCENT if i else MUTED)
canvas.save(f'{BASE}/fig-old-new.png')
print('old-new', canvas.size)