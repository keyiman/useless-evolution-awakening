from PIL import Image, ImageDraw
import os
files = [f'_research/report-pages/p{i:02d}.png' for i in range(1,13)]
ims = [Image.open(f) for f in files]
w,h = 300, 424
cols,rows = 4,3
sheet = Image.new('RGB',(cols*w+ (cols+1)*8, rows*h + (rows+1)*8),(120,120,120))
for i,im in enumerate(ims):
    im = im.resize((w,h), Image.LANCZOS)
    x = 8 + (i%cols)*(w+8); y = 8 + (i//cols)*(h+8)
    sheet.paste(im,(x,y))
sheet.save('_research/report-contact.png')
print(sheet.size)
