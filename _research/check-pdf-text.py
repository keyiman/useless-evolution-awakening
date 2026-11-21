import pymupdf, os
p='报告/废物进化论_物的觉醒_项目报告.pdf'
d=pymupdf.open(p)
text=''.join(pg.get_text() for pg in d)
print('pages',d.page_count,'bytes',os.path.getsize(p))
for name,ch in [('replacement','\ufffd'),('box','\u25a1'),('question','?')]:
    print(name, text.count(ch))
print('first', text[:120].encode('unicode_escape').decode())
print('last', text[-160:].encode('unicode_escape').decode())
