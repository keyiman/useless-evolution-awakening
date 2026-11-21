from PIL import Image
im = Image.open('报告/figs-awake/cup-ui-demo.png').convert('RGB')
im = im.crop((350, 90, 1374, 775))
im = im.resize((1600, 1070), Image.LANCZOS)
im.save('报告/figs-awake/fig-cover.png')
print(im.size)
