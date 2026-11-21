import json
d = json.load(open(r"D:\大创\黑客松3D\_research\openapi.json", encoding="utf-8"))
s = d["components"]["schemas"]
for k in ["lux3d_TextTo3dRequest","lux3d_TaskCreateResponse","lux3d_TaskQueryResponse"]:
    print("="*40, k)
    print(json.dumps(s[k], ensure_ascii=False, indent=1)[:5000])
print("=== security schemes")
print(json.dumps(d["components"].get("securitySchemes"), ensure_ascii=False, indent=1))
