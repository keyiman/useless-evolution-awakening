from pathlib import Path
files = ['00-title.mp4','01-demo.mp4','02-fusion.mp4','03-auto.mp4','04-share.mp4','99-outro.mp4']
lines = []
for f in files:
    p = Path('提交材料/video-clips') / f
    lines.append("file '" + p.resolve().as_posix() + "'")
Path('提交材料/video-clips/concat.txt').write_text('\n'.join(lines), encoding='utf-8')
print('\n'.join(lines))
