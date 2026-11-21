from pptx import Presentation
p = Presentation('提交材料/废物进化论_路演.pptx')
text = '\n'.join(sh.text for s in p.slides for sh in s.shapes if sh.has_text_frame)
for key in ['32', '41,449', '4.1 万', 'Lux3D']:
    print(key, text.count(key))
print('slides', len(p.slides))
