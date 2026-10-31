#!/usr/bin/env python3
"""Сваля бизнес каталога на bansko.bg (списък + страница на всеки бизнес) в работна папка.
Използване: python3 crawl.py <работна папка>   → <папка>/katalog.html, <папка>/listing.json, <папка>/pages/<slug>.html
Учтиво: една заявка в секунда. Домейнът bansko.bg трябва да е разрешен в средата."""
import re, html, json, os, subprocess, sys, time
work = sys.argv[1] if len(sys.argv) > 1 else "work"
os.makedirs(f"{work}/pages", exist_ok=True)
UA = "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120 Safari/537.36"
def fetch(url, out):
    return subprocess.run(["curl", "-sS", "-L", "-m", "40", "-A", UA, "-o", out, "-w", "%{http_code}", url], capture_output=True, text=True).stdout
print("listing:", fetch("https://bansko.bg/za-biznesa/biznes-katalog/", f"{work}/katalog.html"))
k = open(f"{work}/katalog.html", encoding="utf-8", errors="replace").read()
rows = []
for it in re.split(r'data-elementor-type="loop-item"', k)[1:]:
    u = re.search(r'href="(https://bansko\.bg/za-biznesa/biznes-katalog/[a-z0-9-]+/)"', it)
    if not u: continue
    name = re.search(r'elementor-heading-title[^>]*>([^<]*)<', it)
    img = re.search(r'<img[^>]+src="([^"]+)"', it)
    rows.append({"slug": u.group(1).rstrip("/").split("/")[-1], "name": html.unescape(name.group(1)).strip() if name else "",
                 "terms": [html.unescape(t) for t in re.findall(r'jet-listing-dynamic-terms__link">([^<]*)<', it)], "image": img.group(1) if img else ""})
json.dump(rows, open(f"{work}/listing.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(len(rows), "businesses")
for i, r in enumerate(rows, 1):
    out = f"{work}/pages/{r['slug']}.html"
    if os.path.exists(out) and os.path.getsize(out) > 10000: continue
    code = fetch(f"https://bansko.bg/za-biznesa/biznes-katalog/{r['slug']}/", out)
    print(i, len(rows), r["slug"], code, flush=True); time.sleep(0.8)
print("done")
