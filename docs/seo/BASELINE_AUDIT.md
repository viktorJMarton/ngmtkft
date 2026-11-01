# Kiinduló audit és műszaki döntések

Audit: 2026. november 1., Europe/Budapest. A munka tiszta `main` munkafából indult, az origin `viktorJMarton/ngmtkft`. Helyi AGENTS.md nem volt. Dedikált ág: `feature/enterprise-seo-optimization`.

## Közvetlenül megfigyelt kiinduló állapot

Vite 7, Tailwind 4, DaisyUI 5; egy statikus HTML, JavaScript-animációk, helyi fotók. `src/motion.js` tartalmazza a görgetési és viewport logikát; ezt nem írtuk át. GitHub Actions build és Pages deployment csak main ágon. A README több elavult, munkanévre és képekre vonatkozó állítást tartalmazott; az új operatív leírás ebben a könyvtárban van.

| Vizsgálat | Előtte | Implementált állapot |
|---|---|---|
| Önálló HTML-oldalak | 1 | 7, ebből 4 szolgáltatásoldal |
| Title, description, H1 | főoldalon jelen | minden oldalon egyedi cím/leírás, egy H1 |
| Canonical / OG / JSON-LD | hiányzott | oldalonként generált |
| robots.txt / sitemap | hiányzott | buildelt artifact része, 7 kanonikus URL |
| 404 artifact | hiányzott | önálló noindex 404.html |
| Képek | 46 asset, ebből 36 raszter | eredetiek + 480/800/1200/1440 px WebP/JPEG, ahol nincs felnagyítás |
| Analitika | nincs azonosított integráció | kikapcsolt, konfigurálható GA4 vagy GTM |
| Hozzájárulás | nincs | alapértelmezett tiltás, elfogadás/elutasítás/testreszabás/visszavonás |
| Automatikus lapozás | reduced-motion esetén is futott | reduced-motion megállítja, láblécben mozgásszüneteltetés |
| CI SEO / böngésző kapu | nincs | unit, HTML/SEO, axe, böngésző és consent teszt |

Az első build sikerült, de a gép Node 20.15 verziója miatt Vite engine-figyelmeztetéssel. A további ellenőrzések támogatott Node 22.23.4 alatt futottak. A Vite 7.3.6 auditban jelzett hibái miatt kompatibilis 7.3.7 patchfrissítés történt. Nem került backend vagy CMS a projektbe.

## Élő HTTP-audit

A webes olvasóeszköz nem tudta elérni a domaint. Ezt követően a curl hálózati ellenőrzés sikerült (13:50 UTC / 14:50 Budapest):

| URL | Megfigyelt státusz |
|---|---|
| `https://ngmtkft.hu/` | 200, TLS-kapcsolat sikeres alapértelmezett tanúsítványellenőrzéssel |
| `http://ngmtkft.hu/` | 200, nincs HTTPS-átirányítás |
| `https://www.ngmtkft.hu/` | 200, nincs non-www átirányítás |
| `https://ngmtkft.hu/seo-nemletezo-utvonal/` | 200, a főoldallal azonos válasz: soft 404 |

A főoldal és a hiányzó útvonal GET-válaszának SHA-256 értéke azonos: `18172C7DE2AD11DF0D3A187D403ED63DD45097C271EE369AD3A751DA3A8B632C`. Cloudflare válaszfejlécek; `Cache-Control: public, max-age=0, must-revalidate`, `Content-Type: text/html`. A megfigyelt válaszban nem volt HSTS/CSP/X-Content-Type-Options, sem Content-Encoding. Utóbbi fejléc hiánya HEAD kérésből nem bizonyítja a tömörítés hiányát. Teljes TLS-protokoll-, DNS- és cacheaudit NEM ELLENŐRZÖTT.

Az élő főoldal címe és tartalmi struktúrája a kiinduló oldalhoz illeszkedett; az éles deployment commitja nem volt megállapítható, bájtszintű repository-egyezést nem állítunk. Az éles átirányítás és fallback nincs módosítva: domain/Cloudflare/origin jogosultságot igényel. A lokális tesztkiszolgáló 404 eredménye nem bizonyítja az éles szerver 404-kezelését. A Pages workflow és a tényleges Cloudflare origin kapcsolatát publikálás előtt tisztázni kell.

## Döntések és elsődleges források

1. **Dokumentált ajánlás:** statikus, JavaScript nélkül olvasható szolgáltatásoldalak, egyedi intent és önhivatkozó canonical. Nincs felesleges SSR framework, nincs ismétlődő településoldal. [Google canonical dokumentáció](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).
2. **Dokumentált ajánlás:** a sitemap csak indexelhető canonical URL-eket tartalmaz, nem garantál indexelést. Nincs bizonyítatlan lastmod, changefreq vagy priority. [Google sitemap dokumentáció](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
3. **Adatminőségi követelmény:** Organization/WebSite/WebPage, belső oldalakon BreadcrumbList, a szolgáltatásoknál Service. A LocalBusiness alosztályhoz a meglévő elérhetőségek külső hitelesítése még hiányzik; `businessVerified=false`, nem publikálunk új cím/nyitvatartás-sémaállítást. A hitelesítés után kapcsolható be. Értékelés, ár, koordináta és minősítés nem lett hozzáadva. [Schema.org](https://schema.org/LocalBusiness), [Google LocalBusiness](https://developers.google.com/search/docs/appearance/structured-data/local-business). A valid séma nem jelent automatikus rich result jogosultságot.
4. **Konzervatív adatvédelmi döntés:** basic consent, Google-kód csak elfogadás után; minden reklámcél denied marad. A banner önmagában nem jogi megfelelőségi bizonyíték. [Google Consent Mode](https://developers.google.com/tag-platform/security/guides/consent), [EDPB 05/2020](https://www.edpb.europa.eu/documents/guideline/guidelines-052020-on-consent-under-regulation-2016679_en), [NAIH weboldal-hozzájárulási határozat](https://naih.hu/hatarozatok-vegzesek/file/620-weboldal-suti-hozzajarulas-keretrendszerenek-jogi-megfelelosege).
5. **UX és mérési cél:** LCP≤2,5 s, INP≤200 ms, CLS≤0,1 a valós felhasználók 75. percentilisén. A labor és terepadat külön jelentendő. [web.dev Web Vitals](https://web.dev/articles/vitals). Képernyőolvasós manuális tanúsítás nem történt. [W3C mozgásszüneteltetés](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html).
6. **Hostingkorlát:** a Pages nem tetszőleges webszerver; Apache/Netlify átirányítási fájl helyett a tényleges hoston kell beállítani a HTTPS/hostname szabályokat. [GitHub saját domain útmutató](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
7. **Opcionális/halasztott:** nem készült llms.txt, mert a Google AI-keresési megjelenéshez nem szükséges speciális fájl. IndexNow kulcs és külön automatizmus nem került be a kevés oldalból álló, ritkán frissülő site-ba; a sitemap az elsődleges bejelentési eszköz. [Google AI funkciók](https://developers.google.com/search/docs/appearance/ai-features). Egyik sem Google-helyezési garancia.

Keresési mennyiség, konkurenciaerősség, leadarány és valós felhasználói CWV-adat nem állt rendelkezésre. A tartalom lakossági telepítés, ipari kivitelezés, kapcsolódó villanyszerelés és kereskedelem szándékait választja szét. Karbantartást, felülvizsgálatot, sürgősségi szolgáltatást és hatósági jogosultságot nem állít újonnan a vállalkozásról.
