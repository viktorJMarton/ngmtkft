import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { load } from 'cheerio';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { pages, site } from '../seo/site.js';
import { graph } from '../seo/render.js';
import { readdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
const titles=new Set(), descriptions=new Set(), documents=new Map();
const fileFor=url=>'dist'+(url.endsWith('/')?url+'index.html':url);
for(const page of pages) {
 const html=await readFile(fileFor(page.path),'utf8'); const $=load(html); documents.set(page.path,$);
 assert.equal($('html').attr('lang'),'hu',page.path+' language');
 assert.equal($('title').length,1); const title=$('title').text().trim();assert(title);assert(!titles.has(title),'duplicate title');titles.add(title);
 const description=$('meta[name="description"]').attr('content');assert(description);assert(!descriptions.has(description),'duplicate description');descriptions.add(description);
 assert.equal($('h1').length,1,page.path+' H1');assert($('h1').text().trim());
 let level=0; $('h1,h2,h3,h4,h5,h6').each((_,h)=>{const next=Number(h.tagName[1]); assert(next<=level+1,page.path+' heading jump');level=next;});
 assert.equal($('link[rel="canonical"]').length,1);assert.equal($('link[rel="canonical"]').attr('href'),site.origin+page.path);
 assert(!/noindex|nofollow/i.test($('meta[name="robots"]').attr('content')||''));
 for(const property of ['og:type','og:title','og:description','og:url','og:image','og:locale']) assert($(`meta[property="${property}"]`).attr('content'),page.path+' '+property);
 assert.equal($('meta[property="og:url"]').attr('content'),site.origin+page.path);
 await stat(fileFor(new URL($('meta[property="og:image"]').attr('content')).pathname));
 const data=JSON.parse($('script[type="application/ld+json"]').text());assert.deepEqual(data,graph(page));
 const ids=new Set(data['@graph'].map(n=>n['@id']));assert.equal(ids.size,data['@graph'].length);
 for(const node of data['@graph']) {assert(node['@type']); assert(node['@id'].startsWith(site.origin));}
 function refs(value) {if(!value||typeof value!=='object')return;if(value['@id'])assert(ids.has(value['@id']),'unresolved schema entity');for(const child of Object.values(value)) if(typeof child==='object') refs(child);}
 refs(data['@graph']);
 for(const node of data['@graph']) {
  if(node['@type']==='Organization') {assert(node.name);assert.equal(node.url,site.origin+'/');}
  if(node['@type']==='Service') {assert(node.name);assert(node.provider?.['@id']);assert(node.description);}
  if(node['@type']==='BreadcrumbList') {assert.equal(node.itemListElement.length,2);node.itemListElement.forEach((item,i)=>{assert.equal(item.position,i+1);assert(item.item.startsWith(site.origin));});}
 }
 assert(!html.includes('localhost'));assert(!html.includes('github.io'));
 for(const el of $('img').toArray()) {assert($(el).attr('alt')!==undefined,'image alt');assert(Number($(el).attr('width'))>0);assert(Number($(el).attr('height'))>0);}
 const allIds=$('[id]').toArray().map(el=>$(el).attr('id'));assert.equal(allIds.length,new Set(allIds).size,page.path+' duplicate IDs');
}
for(const [path,$] of documents) {
 for(const element of $('[href],[src],[srcset]').toArray()) {
  const values=['href','src'].map(a=>$(element).attr(a)).filter(Boolean);
  const srcset=$(element).attr('srcset');if(srcset) values.push(...srcset.split(',').map(s=>s.trim().split(' ')[0]));
  for(const value of values) {
   const target=new URL(value,site.origin+path);if(target.origin!==site.origin)continue;
   await stat(fileFor(target.pathname));
   if(target.hash && target.pathname.endsWith('/')) {const other=documents.get(target.pathname);assert(other && other('[id]').toArray().some(el=>other(el).attr('id')===decodeURIComponent(target.hash.slice(1))),`broken fragment ${path}: ${value}`);}
  }
 }
}
const xml=await readFile('dist/sitemap.xml','utf8');assert.equal(XMLValidator.validate(xml),true);
const sitemap=new XMLParser().parse(xml);assert.equal(sitemap.urlset['@_xmlns'],undefined); // Parser omits attributes by default.
const locations=sitemap.urlset.url.map(row=>row.loc);assert.deepEqual(new Set(locations),new Set(pages.map(p=>site.origin+p.path)));assert.equal(locations.length,pages.length);assert(!xml.includes('<lastmod>'));
assert(xml.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'));
assert.equal(await readFile('dist/robots.txt','utf8'),`User-agent: *\nAllow: /\nSitemap: ${site.origin}/sitemap.xml\n`);
assert((await readFile('dist/404.html','utf8')).includes('content="noindex"'));
assert.equal((await readFile('dist/CNAME','utf8')).trim(),new URL(site.origin).hostname);
let compressed=0;
for(const name of await readdir('dist/assets')) if(/\.(css|js)$/.test(name))compressed+=gzipSync(await readFile('dist/assets/'+name)).length;
assert(compressed<=45000,`CSS+JS gzip budget exceeded: ${compressed}/45000 bytes`);
console.log(`SEO PASS: ${pages.length} static pages, metadata, headings, schema graph, sitemap, robots, links, assets, image attributes.`);
console.log(`Static performance budget PASS: CSS+JS ${compressed}/45000 gzip bytes.`);
