import json
m=json.load(open('public/models/manifest.json',encoding='utf-8'))
for k,v in sorted(m.items(), key=lambda x:(x[1]['family'],x[1]['generation'])):
    print(v['family'], v['generation'], v['bytes'], v.get('originalBytes'), v.get('optimized'), v['file'])
print('total', sum(v['bytes'] for v in m.values())/1048576)
