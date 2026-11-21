from PIL import Image, ImageDraw, ImageFont
ids = [('seal','密封盖 · 顶部'),('funnel','倒置伞面 · 顶部'),('arm','机械臂 · 侧面'),('wheels','轮式底盘 · 底部'),('shell','防护笼 · 环绕'),('handle','巨柄 · 侧面'),('parasite','寄生装置 · 侧面'),('gimbal','稳定环 · 环绕')]
CW, CH = 520, 380
LABEL = 34
W, H = CW*4, (CH+LABEL)*2
canvas = Image.new('RGB', (W, H), (13,16,20))
d = ImageDraw.Draw(canvas)
f = ImageFont.truetype('C:/Windows/Fonts/msyh.ttc', 22)
for i,(id,label) in enumerate(ids):
    col, row = i%4, i//4
    img = Image.open(f'报告/figs/organ-{id}.png').convert('RGB').resize((CW, CH))
    x, y = col*CW, row*(CH+LABEL)
    canvas.paste(img, (x, y))
    d.text((x+16, y+CH+6), label, font=f, fill=(200,206,214))
canvas.save('报告/figs/fig-organ-grid.png')
print(canvas.size)
