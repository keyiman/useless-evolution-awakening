import fitz, os, sys
src = sys.argv[1]; out = sys.argv[2]
os.makedirs(out, exist_ok=True)
doc = fitz.open(src)
print("pages", doc.page_count)
for i, p in enumerate(doc):
    pix = p.get_pixmap(dpi=100)
    pix.save(os.path.join(out, f"p{i+1:02d}.png"))
print("done")
