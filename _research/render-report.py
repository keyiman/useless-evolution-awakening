import pymupdf, os
pdf = pymupdf.open('报告/废物进化论_物的觉醒_项目报告.pdf')
print('pages', pdf.page_count)
out = '_research/report-pages'
os.makedirs(out, exist_ok=True)
for i, page in enumerate(pdf):
    pix = page.get_pixmap(dpi=110)
    pix.save(f'{out}/p{i+1:02d}.png')
    print(i+1, pix.width, pix.height)
