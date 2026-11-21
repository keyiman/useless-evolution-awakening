import sys, re
from bs4 import BeautifulSoup
for f in ["my.html","hackathon.html"]:
    p = r"D:\大创\黑客松3D\_research\%s" % f
    html = open(p, encoding="utf-8", errors="ignore").read()
    soup = BeautifulSoup(html, "lxml")
    for s in soup(["script","style","noscript"]): s.decompose()
    text = re.sub(r"\n{3,}", "\n\n", soup.get_text("\n"))
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    print("="*20, f, len(lines))
    print("\n".join(lines[:120]))
