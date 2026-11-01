import { site, pages } from './site.js';
import { readFileSync, existsSync } from 'node:fs';
function responsiveImages(html) {
  if (!existsSync('seo/images.generated.json')) return html;
  const images=JSON.parse(readFileSync('seo/images.generated.json','utf8'));
  return html.replace(/<img\b[^>]*>/g, tag=>{
    const src=tag.match(/\bsrc="([^"]+)"/)?.[1];const image=images[src];if(!image)return tag;
    const best=image.outputs.at(-1);
    const sizes='(max-width: 767px) calc(100vw - 2rem), (max-width: 1279px) 50vw, 640px';
    const fallback=tag.replace(/\s(?:width|height|srcset|sizes)="[^"]*"/g,'').replace(`src="${src}"`,`src="${best.file}" width="${image.width}" height="${image.height}" srcset="${image.outputs.map(o=>`${o.file} ${o.width}w`).join(', ')}" sizes="${sizes}"`);
    if(!image.avifOutputs) return fallback;
    return `<picture style="display: contents"><source type="image/avif" srcset="${image.avifOutputs.map(o=>`${o.file} ${o.width}w`).join(', ')}" sizes="${sizes}">${fallback}</picture>`;
  });
}
export const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const url = path => site.origin + path;
const references = {
  '/klimatelepites-tatabanya/': { anchor: 'referenciak', image: '/images/lakossagi/06.jpg', width: 1600, height: 1317, alt: 'Kültéri klímaegység egy családi ház barna homlokzatán, az eresz alatt', label: 'Lakossági klímatelepítési munkafotók' },
  '/ipari-klimatechnika/': { anchor: 'referenciak-ipari', image: '/images/ipari/04.jpg', width: 2048, height: 1536, alt: 'Mennyezeti kazettás klímaegységek szerelése nagyobb helyiségben, létrával és védőtasakokkal', label: 'Ipari klímatechnikai munkafotók' },
  '/klima-kereskedelem/': { anchor: 'referenciak-uzlet', image: '/images/uzlet/03.jpg', width: 1536, height: 2048, alt: 'Klímaberendezések, kartondobozok és szerelési segédanyagok az üzlet bemutatóterében', label: 'Üzlet és bemutatótér fotói' },
};
function referenceSection(page) {
  const reference=references[page.path];if(!reference)return '';
  return `<section class="mt-8"><h2 class="text-2xl font-bold">${reference.label}</h2><figure class="mt-5"><img class="photo rounded-2xl" src="${reference.image}" alt="${reference.alt}" width="${reference.width}" height="${reference.height}" loading="lazy" decoding="async"><figcaption class="mt-3">${reference.alt}.</figcaption></figure><p class="mt-3"><a href="/#${reference.anchor}">További képek a meglévő referenciagalériában</a></p></section>`;
}
export function graph(page) {
  const organization = { '@type': 'Organization', '@id': url('/#organization'), name: site.name, url: url('/'), logo: url('/images/ngmt-logo.svg') };
  if (site.businessVerified) Object.assign(organization, { '@type': 'LocalBusiness', telephone: site.phones[0], email: site.email, address: { '@type': 'PostalAddress', streetAddress: 'Búzavirág u. 8.', addressLocality: 'Tatabánya', postalCode: '2800', addressCountry: 'HU' }, openingHoursSpecification: { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], opens: '07:30', closes: '16:00' } });
  const nodes = [organization, { '@type': 'WebSite', '@id': url('/#website'), url: url('/'), name: site.name, inLanguage: 'hu-HU', publisher: { '@id': organization['@id'] } }, { '@type': 'WebPage', '@id': url(page.path + '#webpage'), url: url(page.path), name: page.title, description: page.description, inLanguage: 'hu-HU', isPartOf: { '@id': url('/#website') } }];
  if (page.path !== '/') nodes.push({ '@type': 'BreadcrumbList', '@id': url(page.path + '#breadcrumb'), itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kezdőlap', item: url('/') }, { '@type': 'ListItem', position: 2, name: page.label, item: url(page.path) }] });
  if (page.service) nodes.push({ '@type': 'Service', '@id': url(page.path + '#service'), name: page.label, url: url(page.path), provider: { '@id': organization['@id'] }, description: page.intro });
  return { '@context': 'https://schema.org', '@graph': nodes };
}
export function metadata(page) {
  return `<title>${escape(page.title)}</title><meta name="description" content="${escape(page.description)}"><link rel="canonical" href="${url(page.path)}"><link rel="icon" type="image/svg+xml" href="/images/ngmt-logo.svg">
  <meta property="og:type" content="website"><meta property="og:site_name" content="${site.name}"><meta property="og:locale" content="hu_HU"><meta property="og:title" content="${escape(page.title)}"><meta property="og:description" content="${escape(page.description)}"><meta property="og:url" content="${url(page.path)}"><meta property="og:image" content="${url('/images/og-cover.jpg')}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Klímaszerelési munka egy társasház homlokzatán"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(page.title)}"><meta name="twitter:description" content="${escape(page.description)}"><meta name="twitter:image" content="${url('/images/og-cover.jpg')}"><script type="application/ld+json">${JSON.stringify(graph(page)).replace(/</g, '\\u003c')}</script>`;
}
export function contact() {
  return `<section id="kapcsolat" class="bg-[#102b3c] py-12 text-white"><div class="container-site"><h2 class="section-title">Egyeztessünk a feladatról</h2><address class="not-italic mt-5"><p>${site.name} · ${site.address}</p><p><a class="contact-link" href="mailto:${site.email}">${site.email}</a></p><p><a class="contact-link" href="tel:${site.phones[0]}">${escape(site.phoneLabels[0])}</a> · <a class="contact-link" href="tel:${site.phones[1]}">${escape(site.phoneLabels[1])}</a></p></address><p class="mt-3">${site.hours} · Szombat–vasárnap: zárva</p><p class="mt-3"><a class="contact-link" href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(site.address)}" target="_blank" rel="noopener noreferrer">Útvonaltervezés a Google Mapsen (új lapon)</a></p></div></section>`;
}
export function renderPage(html, page) {
  for (const [key,value] of Object.entries({NAME:site.name, EMAIL:site.email, PHONE:site.phones[0], PHONE_SECONDARY:site.phones[1], PHONE_LABEL:site.phoneLabels[0], PHONE_SECONDARY_LABEL:site.phoneLabels[1], MAP_URL:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`, ADDRESS:site.address, HOURS:site.hours, AREA:site.area})) html=html.replaceAll(`{{${key}}}`,escape(value));
  html = html.replace(/<!-- seo:start -->[\s\S]*?<!-- seo:end -->/g, '').replace(/<title>[\s\S]*?<\/title>/g, '').replace(/<meta name="description"[^>]*>/g, '');
  html = html.replace('</head>', `<!-- seo:start -->${metadata(page)}<!-- seo:end --></head>`).replaceAll('./images/', '/images/');
  if (page.path !== '/') {
    const main = `<main id="tartalom" tabindex="-1"><article class="container-site py-12 md:py-20 service-detail"><nav aria-label="Morzsamenü"><a href="/">Kezdőlap</a> / ${escape(page.label)}</nav><p class="eyebrow mt-7">NGM-t Kft. · Tatabánya</p><h1 class="section-title mt-4">${escape(page.label)}${page.path.includes('tatabanya') ? ' Tatabányán' : ''}</h1><p class="mt-7 text-lg">${escape(page.intro)}</p>${page.sections.map(([heading, text]) => `<section class="mt-8"><h2 class="text-2xl font-bold">${escape(heading)}</h2><p class="mt-3 leading-relaxed">${escape(text)}</p></section>`).join('')}<section class="mt-8"><h2 class="text-2xl font-bold">Kapcsolódó oldalak</h2><ul>${pages.filter(p=>p.path!==page.path).map(p=>`<li><a href="${p.path}">${escape(p.label)}</a></li>`).join('')}<li><a href="/#referenciak-lakossagi">Munkafotók és referenciák</a></li></ul></section></article>${contact()}</main>`;
    const withReferences=main.replace('<section class="mt-8"><h2 class="text-2xl font-bold">Kapcsolódó oldalak</h2>',referenceSection(page)+'<section class="mt-8"><h2 class="text-2xl font-bold">Kapcsolódó oldalak</h2>');
    html = html.replace(/<main\b[\s\S]*?<\/main>/, withReferences.replace('/#referenciak-lakossagi','/#referenciak')).replace(/href="#(kezdolap|szolgaltatasok|referenciak|rolunk)"/g, 'href="/#$1"');
  }
  return responsiveImages(html);
}
