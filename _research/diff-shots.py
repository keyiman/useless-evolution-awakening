from PIL import Image, ImageChops, ImageStat
for name in ['cup','chair','umbrella','bin']:
    a = Image.open(f'_research/new-shots/{name}-stage-1.png').convert('RGB')
    b = Image.open(f'_research/new-shots/{name}-stage-5.png').convert('RGB')
    d = ImageChops.difference(a,b)
    st = ImageStat.Stat(d)
    print(name, 'size', a.size, 'mean diff', [round(x,2) for x in st.mean], 'bbox', d.getbbox())
    d.save(f'_research/new-shots/{name}-diff.png')
