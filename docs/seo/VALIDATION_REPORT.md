# Ellenőrzési és felülvizsgálati jelentés

Dátum: 2026. november 1. A mérések helyi, buildelt HTTP-előnézeten történtek; nem éles deployon. A forrás `index.html` file:// megnyitása nem tölti be a Vite moduljait/stílusait, ezért nem használható az elkészült oldal vizuális ellenőrzésére.

## Reprodukálható ellenőrzések

| Parancs | Ellenőrzött tartalom |
|---|---|
| `npm test` | konfiguráció, lejárt/hibás hozzájárulás, eseményduplikáció, paraméterlista, workflow YAML és branch/deploy védelem |
| `npm run build` | képgenerálás és Vite production build, önálló oldalak |
| `npm run check:seo` | cím/leírás/H1/headings, nyelv, canonical/OG, JSON-LD saját entitás- és típusellenőrzés, XML sitemap, robots, belső link/fragment/asset, képek alt/méret, 404 és CNAME, CSS+JS gzip budget |
| `npm run test:browser` | közvetlen route, 404, konzolhiba, axe WCAG 2 A/AA–2.2 AA automatizálható szabályok, 5 szélesség, mobilmenü, kézi galéria, kikapcsolt mérés, mozgásszüneteltetés |
| `npm run test:consent` | két külön production build: GA4 és GTM; elfogásos, külső mérés nélküli bootstrap, alap tiltás, elutasítás, mentés, elfogadás, egyszeri esemény, tisztított URL, visszavonás, saját süti törlése |
| `npm audit` | függőségek ismert advisoryi; a legutóbbi ellenőrzésben 0 sérülékenység |

A teljes lánc `npm run check`. A gépen `npm exec --yes --package=node@22 -- npm run check` futtatható a régi globális Node helyett. A böngésző lokálisan telepített Chrome 156, CI-ben Playwright Chromium. A tesztek nem küldenek valódi GA4/GTM-forgalmat.

A teljes végső futás eredménye: **4 unit/workflow teszt PASS**, **production build PASS**, **7 oldal SEO/budget PASS**, **7 böngészőteszt PASS**, **GA4 és GTM consent-szimuláció PASS**. Az axe teszt az összes hét útvonalon nulla automatikusan talált hibát jelzett a választott szabálykészletben. A mobil LCP küszöb nem teljesült, a terepi eredmények nem ellenőrzöttek.

## Vizuális ellenőrzés

Eredeti artifact: `.baseline-dist`, változtatás előtti képernyőképek: `artifacts/before/`. Új képernyőképek: `artifacts/after/`, valamint a böngészőteszt `test-results/` könyvtára. Méretek: 360, 390, 768, 1280, 1920 px, 900 px magasság, reduced-motion beállítás. A képernyőképrögzítés végiggörget a lusta képek betöltéséhez; az első baseline sorozat még nem tette ezt, így a teljesoldalas referenciafotók nem mindenhol töltődtek be. Ez korlátozza a képpontos összehasonlítást.

`node scripts/compare-layout.mjs` az eredeti 4174-es és új 4173-as buildet hasonlítja. A vizsgált header/hero/cím/kép/szolgáltatáskártya/referencia/munkamenet/kapcsolat elemek x/y/méret/betűcsalád/betűméret/szín/háttér tulajdonságai az öt szélességen azonosak voltak (`artifacts/layout-comparison.json`). Ez célzott geometriai/stílus-ellenőrzés, nem pixel-perfect vagy teljes WCAG-tanúsítás. A láblécben szándékosan új oldallinkek, adatvédelmi és mozgásszüneteltető gombok jelentek meg.

## Öt érdemi felülvizsgálati kör

1. **Technikai SEO:** a hiányzó metaadat/sitemap/canonical javítva; minden oldalon saját canonical, azonos leltárból generált sitemap. JSON-LD entitások összekapcsolva. Éles HTTP/www/soft404 hiba külön dokumentálva, külső infrastruktúra-feladat.
2. **Magyar tartalom és local SEO:** négy eltérő keresési szándékra hasznos előkészületi és ajánlatkérési tartalom. Nem lett kitalált ár, jogosultság, karbantartási ígéret vagy szolgáltatási településlista. A külső cégadat-hitelesítés hiánya miatt a LocalBusiness cím/nyitvatartás kiterjesztés kikapcsolva.
3. **Teljesítmény és akadálymentesség:** a galériák eredeti elrendezése/lapozási logikája megőrizve; új, elrendezést növelő galériagombok visszavonva. Billentyűzetes fókusz a hero- és márkasávon, reduced-motion és közös szüneteltetés. WebP-változat csak akkor előnyös, ha ténylegesen kisebb: a generátor JPEG-gel is összeveti, megtartja a kisebb fájlt. Galériamásolatok eager betöltése megszüntetve. A labor köztes regresszióját nem rejtettük el; a teljesítményjelentés rögzíti.
4. **Analitika, privacy és biztonság:** kölcsönösen kizárt GA4/GTM konfiguráció, alap tiltás, személyes URL-adatok kizárása, egyedi események, visszavonási újratöltés tesztelve. Az auditban érintett Vite patch javítva; a nagy, átmenetileg hozzáadott Lighthouse-függőség eltávolítva a projektből, CLI-ként elkülönítve fut. Valódi fiók/Tag Assistant és teljes jogi jóváhagyás továbbra is külső feladat.
5. **Integráció és regresszió:** külön PR/feature QA workflow, deploy továbbra is kizárólag main. A main workflow először konfigurálatlan builddel és elkülönített consent buildekkel tesztel, majd az explicit publikus repository-változókkal épít deployment artifactot és újra ellenőrzi a SEO-t. Így a valódi mérés aktiválása nem töri el a nulla-tracking alapállapot tesztjeit, és a tesztazonosítók nem kerülnek az éles artifactba.

## Nem ellenőrzött vagy külső függőség

- Google Rich Results Test és Schema.org online validátor: **NEM ELLENŐRZÖTT** interaktív beküldéssel. A saját teszt JSON-szintaxis-, selected-type- és entitásreferencia-ellenőrzés; nem a teljes Schema.org ontológia validátora.
- Search Console/Bing tulajdonjog, indexelés, Google-selected canonical: **NEM ELLENŐRZÖTT**, nincs fiókhozzáférés.
- Valós felhasználói CWV/INP/75. percentilis: **NEM ELLENŐRZÖTT**; a Lighthouse TBT nem INP.
- Éles új verzió, éles redirect/404/cache/DNS: nincs publikálás; az audit a régi éles állapotot írja le.
- Képernyőolvasóval végzett manuális teszt, minden zoom/assistive technológia és jogi megfelelőség: nem tanúsított.
- GitHub távoli CI állapota a PR/commit linkjén külön ellenőrizendő; a helyi PASS nem azonos a távoli CI PASS-szal.

## GitHub átadás

Implementációs commit: `9d566ddad9a6680c90156dadc7cf911626604b75`, feltöltve a `feature/enterprise-seo-optimization` ágra. Draft PR: [#1](https://github.com/viktorJMarton/ngmtkft/pull/1). Az alapág az implementáció szülője; nincs eltérés miatti merge-konfliktus. Main nem lett módosítva és deployment nem történt.

A [távoli CI-futás](https://github.com/viktorJMarton/ngmtkft/actions/runs/41314820779) **nem indított tesztet**: a job runner_id=0, üres lépéslistával leállt. A GitHub check annotációjának pontos üzenete: “The job was not started because your account is locked due to a billing issue.” Ez fiókszintű külső blokkolás; nem jelölhető sikeres CI-ként, és a helyi PASS nem helyettesíti. Fióktulajdonosi rendezés után a sikertelen job újrafuttatása szükséges, a PR addig draft marad.
