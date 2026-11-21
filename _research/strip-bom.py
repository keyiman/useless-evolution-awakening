import os
roots = ['src','server','scripts','提交材料','.']
files = []
for r in roots:
    for dp, dn, fn in os.walk(r):
        if '_research' in dp or 'node_modules' in dp or '.git' in dp: continue
        for f in fn:
            if f.endswith(('.ts','.tsx','.mjs','.md','.css','.json','.html')):
                p = os.path.join(dp,f)
                if p.count(os.sep) > 3: continue
                files.append(p)
fixed=[]
for p in files:
    b=open(p,'rb').read()
    if b.startswith(b'\xef\xbb\xbf'):
        open(p,'wb').write(b[3:]); fixed.append(p)
print('stripped', len(fixed))
for p in fixed: print(' ', p)
