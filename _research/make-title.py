from PIL import Image, ImageDraw, ImageFont

W, H = 1440, 900
BG = (13, 16, 20)
WHITE = (242, 244, 247)
MUTED = (154, 161, 171)
ACCENT = (226, 112, 58)
FONT = "C:/Windows/Fonts/msyh.ttc"


def font(size, bold=False):
    return ImageFont.truetype("C:/Windows/Fonts/msyhbd.ttc" if bold else FONT, size)


def center(draw, text, y, size, color, bold=False):
    f = font(size, bold)
    box = draw.textbbox((0, 0), text, font=f)
    draw.text(((W - (box[2] - box[0])) / 2, y), text, font=f, fill=color)


def title():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    center(d, "2026 AHOLO GLOBAL 3D AI HACKATHON", 170, 24, ACCENT)
    d.line([(W / 2 - 40, 215), (W / 2 + 40, 215)], fill=ACCENT, width=3)
    center(d, "废物进化论", 300, 110, WHITE, True)
    center(d, "器官库", 440, 110, ACCENT, True)
    center(d, "32 个 Lux3D 器官 × 4 个日常物体", 610, 30, MUTED)
    center(d, "把“过度设计”变成可以亲手拼装的 3D 实验", 660, 30, MUTED)
    center(d, "React · Three.js · Aholo Lux3D G1-Turbo", 790, 20, (110, 118, 128))
    img.save("提交材料/video-raw2/title2.png")


def outro():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    center(d, "废物进化论 · 器官库", 330, 64, WHITE, True)
    center(d, "给日常物品装上本不该属于它的器官", 440, 28, MUTED)
    center(d, "看它如何一步步拒绝原来的用途", 490, 28, MUTED)
    center(d, "AHOLO LUX3D · 2026", 700, 20, ACCENT)
    img.save("提交材料/video-raw2/outro2.png")


title()
outro()
print("ok")
