import fitz, os
os.makedirs('_research/pdf-pages', exist_ok=True)
doc = fitz.open('报告/废物进化论_项目报告_v2.pdf')
print('pages', len(doc))
for i, page in enumerate(doc):
    pix = page.get_pixmap(dpi=85)
    pix.save(f'_research/pdf-pages/p{i+1:02d}.png')
print('rendered')
