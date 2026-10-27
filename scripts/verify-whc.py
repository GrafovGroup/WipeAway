from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse,unquote
import json,xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[1];out=root/'whc-dist';manifest=json.loads((root/'whc-routes.json').read_text());errors=[];links=set();assets=set()
class Page(HTMLParser):
 def __init__(self):super().__init__();self.h1=0;self.canonical=None;self.title=False;self.title_text='';self.jsonld=False;self.schema_text='';self.schemas=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='h1':self.h1+=1
  if tag=='title':self.title=True
  if tag=='link' and a.get('rel')=='canonical':self.canonical=a.get('href')
  if tag=='script' and a.get('type')=='application/ld+json':self.jsonld=True;self.schema_text=''
  if tag=='a' and a.get('href','').startswith('/'):links.add(a['href'])
  if tag in ['script','img'] and a.get('src','').startswith('/'):assets.add(a['src'])
  if tag=='link' and a.get('rel') in ['stylesheet','icon','shortcut icon'] and a.get('href','').startswith('/'):assets.add(a['href'])
 def handle_data(self,s):
  if self.title:self.title_text+=s
  if self.jsonld:self.schema_text+=s
 def handle_endtag(self,tag):
  if tag=='title':self.title=False
  if tag=='script' and self.jsonld:
   self.schemas.append(json.loads(self.schema_text));self.jsonld=False
for route in manifest['pages']:
 file=out/route.strip('/')/'index.html';p=Page();p.feed(file.read_text())
 if p.h1!=1 or not p.title_text or not p.canonical:errors.append('Metadata: '+route)
 for s in p.schemas:
  if s.get('@type')=='Article' and not s.get('datePublished'):errors.append('Article date: '+route)
for ref in links|assets:
 p=out/unquote(urlparse(ref).path).lstrip('/')
 if not p.is_file() and not (p/'index.html').is_file():errors.append('Missing: '+ref)
urls=[n.text for n in ET.parse(out/'sitemap.xml').getroot().findall('{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
assert len(urls)==42
for url in urls:
 assert (out/urlparse(url).path.strip('/')/'index.html').is_file(),url
assert 'Commercial wipes and dispensers, explained.' in (out/'index.html').read_text()
assert 'formspree.io/f/xdeownaz' in (out/'order/index.html').read_text()
assert (out/'404.html').is_file()
ht=(out/'.htaccess').read_text()
for old,new in manifest['redirects']:assert old in ht and new in ht
assert 'https://wipeaway.ca/sitemap.xml' in (out/'robots.txt').read_text()
if errors:raise SystemExit('\n'.join(errors))
print(f'PASS: {len(urls)} pages; {len(links)} internal links; {len(assets)} asset references; {len(manifest["redirects"])} redirect rules; sitemap, robots and 404 output.')
