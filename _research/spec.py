import json
p = r"D:\大创\黑客松3D\_research\openapi.json"
d = json.load(open(p, encoding="utf-8"))
for path in ["/lux3d/v1/generate/text-to-3d/task/create","/lux3d/v1/generate/task/get","/lux3d/v1/generate/img-to-3d/task/create"]:
    print("="*80); print(path)
    print(json.dumps(d["paths"][path], ensure_ascii=False, indent=1)[:6000])
