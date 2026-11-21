from PIL import Image
import os, re
for f in sorted(os.listdir('提交材料/小红书')):
    if f.endswith('.png'):
        im=Image.open('提交材料/小红书/'+f)
        print(f, im.size)
text=open('提交材料/小红书/小红书文案.txt',encoding='utf-8').read()
print('chars',len(text))
print('title',text.splitlines()[0])
print('has tag', '#Aholo黑客松' in text)
