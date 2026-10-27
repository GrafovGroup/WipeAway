#!/usr/bin/env python3
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import sys
import xml.etree.ElementTree as ET

BASE=(sys.argv[1] if len(sys.argv)>1 else "http://localhost:5174").rstrip("/")
ORIGINAL=["/","/products/wipe-dispensers","/products/disinfecting-sanitizing-refill-wipes","/products/wipe-dispenser-signs","/products/other-wipe-products","/clients-that-use-our-wipe-stands","/order","/products/buy-wipe-dispensers-in-toronto","/products/buy-wipe-floor-stands-in-vancouver","/products/buy-wipe-dispensers-in-montreal","/products/buy-wipe-floor-dispensers-in-calgary","/products/buy-wipe-dispensers-in-edmonton","/products/buy-wipe-dispensers-in-ottawa","/products/buy-wipe-dispensers-in-winnipeg","/about","/blog","/blog/right-wipe-dispensers-for-commercial-facilities","/blog/best-pracitces-for-sanitizing-wipe-dispensers-in-office-buildings","/blog/innovations-in-disinfecting-wipe-dispensers-for-commercial-facilities"]

class Parser(HTMLParser):
    def __init__(self): super().__init__(); self.h1=0; self.title=""; self._title=False; self.canonical=""; self.links=[]; self.images=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=="h1": self.h1+=1
        if tag=="title": self._title=True
        if tag=="link" and a.get("rel")=="canonical": self.canonical=a.get("href","")
        if tag=="a" and a.get("href"): self.links.append(a["href"])
        if tag=="img" and a.get("src"): self.images.append(a["src"])
    def handle_endtag(self,tag):
        if tag=="title": self._title=False
    def handle_data(self,data):
        if self._title: self.title+=data

def fetch(url):
    req=Request(url,headers={"User-Agent":"WipeAway-QA/1.0"})
    with urlopen(req,timeout=20) as r: return r.status,r.geturl(),r.read()

errors=[]
fetch_cache={}
def cached_fetch(url):
    key=url.split("#",1)[0]
    if key not in fetch_cache: fetch_cache[key]=fetch(key)
    return fetch_cache[key]
status,_,xml=fetch(BASE+"/sitemap.xml")
root=ET.fromstring(xml)
urls=[n.text.replace("https://wipeaway.ca",BASE) for n in root.findall("{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
seen=set(); internal_links=set()
for url in urls:
    try: status,final,body=fetch(url)
    except Exception as exc: errors.append(f"FETCH {url}: {exc}"); continue
    if status!=200: errors.append(f"STATUS {status}: {url}")
    p=Parser(); p.feed(body.decode("utf-8","replace"))
    if p.h1!=1: errors.append(f"H1 {p.h1}: {url}")
    if not p.title.strip(): errors.append(f"TITLE missing: {url}")
    if "| WipeAway | WipeAway" in p.title: errors.append(f"TITLE duplicate brand: {url}")
    if not p.canonical: errors.append(f"CANONICAL missing: {url}")
    for src in p.images:
        key=urljoin(url,src); seen.add(key)
        try:
            image_status,_,_=cached_fetch(key)
            if image_status!=200: errors.append(f"IMAGE {image_status}: {key} on {url}")
        except Exception as exc: errors.append(f"IMAGE {key} on {url}: {exc}")
    for href in p.links:
        absolute=urljoin(url,href)
        parsed=urlparse(absolute)
        if parsed.netloc==urlparse(BASE).netloc and parsed.scheme in ("http","https"): internal_links.add(absolute.split("#",1)[0])

for absolute in sorted(internal_links):
    try:
        link_status,_,_=cached_fetch(absolute)
        if link_status>=400: errors.append(f"LINK {link_status}: {absolute}")
    except Exception as exc: errors.append(f"LINK {absolute}: {exc}")

for route in ORIGINAL:
    try:
        status,final,_=cached_fetch(BASE+route)
        if status!=200: errors.append(f"LEGACY {status}: {route}")
    except HTTPError as exc:
        if exc.code not in (301,302,307,308): errors.append(f"LEGACY {exc.code}: {route}")
    except Exception as exc: errors.append(f"LEGACY {route}: {exc}")

print(f"Checked {len(urls)} sitemap pages, {len(ORIGINAL)} original URLs and {len(seen)} unique image URLs.")
if errors:
    print("\n".join(errors)); raise SystemExit(1)
print("PASS: titles, canonicals, H1s, internal links, images and original URLs.")
