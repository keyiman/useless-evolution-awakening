import fitz
doc = fitz.open('报告/废物进化论_项目报告_v2.pdf')
for i, page in enumerate(doc):
    text = page.get_text().strip().replace('\n',' ')
    print(f'p{i+1:02d} imgs={len(page.get_images())} chars={len(text)} tail={text[-70:]}')
