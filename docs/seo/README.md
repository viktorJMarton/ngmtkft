# NGM-t Kft. SEO – üzemeltetési útmutató

A kiadási cél a meglévő Cloudflare Worker, nem új GitHub Pages-oldal. Publikálás előtt a tesztek és a megjelenés ellenőrzése szükséges; a kiadási lépések és a visszaállítás a [Cloudflare útmutatóban](CLOUDFLARE_DEPLOYMENT.md) szerepelnek. Az indexelés vagy helyezés nem garantálható. A baseline/validációs jelentések a kiadás előtti állapotot is dokumentálják, ezért a történeti „nem élesített” megállapítások nem aktuális deployment-státuszt jelentenek.

## Helyi megtekintés és ellenőrzés

Node **22.19+** szükséges. Az ezen a munkaállomáson alapértelmezett Node 20.15 nem támogatott. Átmenetileg `npm exec --yes --package=node@22 -- npm run check` is használható; tartósan a Node 22 telepítése javasolt.

```sh
npm ci
npm run dev
# A terminálban kiírt HTTP-címet nyisd meg (általában http://localhost:5173/).
# A forrás index.html közvetlen file:// megnyitása nem Vite-előnézet.
npm run check
```

Buildelt előnézet: `npm run build`, majd `node scripts/serve.mjs`; címe `http://127.0.0.1:4173/`. A kiszolgáló valós 404-et ad a hiányzó útvonalakra. A képgenerálás a prebuild/predev lépés része. `node --run build` nem futtat npm prebuild hookot, ezért helyette `npm run build` szükséges.

## Karbantartás és architektúra

- `seo/site.js`: éles origin, közös cégadatok, oldalleltár, önálló magyar tartalom. Helyi szolgáltatási kulcsszavak keresési szándék szerinti hipotézisek; nincs keresési mennyiségi adat. Nincs városonként ismételt doorway oldal.
- `seo/render.js`: HTML metaadat, JSON-LD, statikus belső oldalak, közös elérhetőségek, reszponzív képek. A kezdőlap szerkezete és eredeti stílusai megmaradnak. A főoldal elérhetőségei buildkor ugyanebből a közös adatforrásból származnak.
- `seo/plugin.js`: Vite fejlesztői route-ok, buildelt könyvtári `index.html` oldalak, sitemap, robots és 404. Nem SPA-routing és nincs szükség futó backend-re.
- `scripts/images.mjs`: az eredeti képekből méret szerint választott WebP/JPEG-változatok, méret- és hash-leltár, közösségi megosztókép. Az eredetiek megmaradnak; az SVG-logók nem kerülnek raszterizálásra. Generált fájlokat nem kell kézzel szerkeszteni vagy commitolni. A saját hash-nevű régi változatok generálás előtt törlődnek, így a lokális és a tiszta CI artifact egyezik.
- `src/seo.css`: az új oldalak és a hozzájárulási ablak elkülönített stílusai. `src/style.css`: eredeti megjelenési szabályok; a Tailwind csak az index/src/seo forrásokból gyűjt osztályokat, nem auditkimenetekből.
- `src/analytics-core.js` és `src/analytics.js`: tesztelhető mérési kapu és hozzájáruláskezelés. Alapértelmezés szerint a Google-kód nem töltődik be.
- A referenciák a főoldalon maradnak; külön tartalom nélküli referenciaoldal nem készült. Az önálló kapcsolatoldal ajánlatkérési támpontokat és elérhetőségeket ad. A technikai adatvédelmi oldal nem helyettesíti a teljes vállalkozási tájékoztatót.

Új indexelhető oldal: adj egyedi leírást, címet, hasznos tartalmat a `pages` leltárhoz; build után automatikusan bekerül a sitemapbe. Ne használj kitalált `lastmod` időpontot. Ellenőrizd a megjelenést, a belső hivatkozásokat és a sémákat. Negyedévente és minden nagyobb módosításnál futtasd a teljes ellenőrzést.

## Dokumentumok

- [Audit és döntések](BASELINE_AUDIT.md)
- [Mérés és hozzájárulás](ANALYTICS_CONSENT.md)
- [Külső aktiválás és dashboard](EXTERNAL_ACTIONS.md)
- [Ellenőrzési és felülvizsgálati jelentés](VALIDATION_REPORT.md)
- [Teljesítménymérések](PERFORMANCE_REPORT.md)
- [Cloudflare publikálás és visszaállítás](CLOUDFLARE_DEPLOYMENT.md)
