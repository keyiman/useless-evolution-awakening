import pymupdf
d=pymupdf.open('报告/废物进化论_物的觉醒_项目报告.pdf')
text=''.join(pg.get_text() for pg in d)
for i,line in enumerate(text.splitlines()):
    if '?' in line:
        print(i, line.encode('unicode_escape').decode())
