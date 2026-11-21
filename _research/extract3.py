import re, sys
from bs4 import BeautifulSoup
for name in ["submission","registration","register"]:
    p = r"D:\大创\黑客松3D\_research\%s.html" % name
    html = open(p, encoding="utf-8", errors="ignore").read()
    soup = BeautifulSoup(html, "lxml")
    for s in soup(["script","style","noscript"]): s.decompose()
    text = re.sub(r"\n{3,}", "\n\n", soup.get_text("\n"))
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    print("="*30, name, len(lines))
    print("\n".join(lines[:160]))
