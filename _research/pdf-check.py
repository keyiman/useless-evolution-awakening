import fitz
doc = fitz.open('报告/废物进化论_项目报告.pdf')
text = '\n'.join(p.get_text() for p in doc)
for key in ['32 个器官', '41,449', '4.1 万', 'Lux3D', '28 MB']:
    print(key, text.count(key))
print('pages', len(doc))
