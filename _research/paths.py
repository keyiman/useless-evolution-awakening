import json
d = json.load(open(r"D:\大创\黑客松3D\_research\openapi.json", encoding="utf-8"))
for p in d["paths"]:
    print(p)
