# Tulajdonosi hozzáférést igénylő teendők

## 1. Éles hosting és domain (publikálás előtt)

Az auditban HTTP, www és nem létező URL is 200 volt, Cloudflare fejlécekkel. Először azonosítsd a tényleges origint: Cloudflare Pages, GitHub Pages proxyval vagy más host. Ne változtass vaktában DNS-t.

- Cloudflare Redirect Rule: a HTTP és www kéréseket egy lépésben 301/308 átirányítással vezesd `https://ngmtkft.hu` alá, az eredeti path és query megőrzésével. A HTTPS non-www kérést a szabály zárja ki, hogy ne legyen loop. Ha nincs Cloudflare-átirányítási réteg, a host saját HTTPS/hostname beállítását használd.
- Pages esetén Settings → Pages: egyedi domain `ngmtkft.hu`, Enforce HTTPS, DNS ellenőrzés. Az artifact `CNAME` fájlja ezt a domaint nevezi meg. Ne publikáld ugyanazt indexelhető staging domainen; privát previewt vagy host szintű hitelesítést használj.
- Ismeretlen útvonalra **404 HTTP**, nem a főoldal 200-as fallbackje. Cloudflare Pages esetén ellenőrizd a top-level 404.html beépítését és a meglévő SPA/Worker fallback szabályt; GitHub Pages esetén használd az artifact 404.html fájlját. Ne irányíts minden hiányzó oldalt a kezdőlapra.
- A végző `/` nélküli könyvtári útvonal menjen egy lépésben a végző `/` URL-re. `/index.html` és a szolgáltatáskönyvtárak `index.html` alakja hoston átirányítható; a HTML canonical már a könyvtári URL-re mutat.
- Ellenőrizd HSTS, X-Content-Type-Options, Content-Encoding és cache-beállítások lehetőségét a tényleges hoston. CSP-t tesztelt forráslistával vezess be, figyelembe véve a JSON-LD, inline évszám és opcionális Google-tagek működését. Pages önmagában nem kezel tetszőleges `_headers` vagy `.htaccess` fájlt.

Publikálás utáni ellenőrzés: `curl -I -L` a HTTP/www/non-www változatokra; GET egy létező szolgáltatásra; GET véletlen hiányzó útvonalra; robots és sitemap 200; direct route 200; canonical és OG origin egyezés. A mostani helyi tesztek nem állítják, hogy az éles redirect már javult.

## 2. Cégadatok és Google Business Profile

A meglévő cím, telefonok és nyitvatartás az oldalon megmaradt, de a külső hitelesítéshez nem állt rendelkezésre cégprofil/tulajdonosi adat. Nyilvános keresésből nem sikerült hitelesen összekapcsolni az összes adatot a vállalkozással.

Ellenőrzési lista: aktuális cégnév és cím; publikus vagy szolgáltatási területes profil; valódi elérhetőségek; nyitvatartás és ünnepnapi kivételek; tényleges szolgáltatási települések; profil hitelesítése; a fő tevékenységhez illő elsődleges és valós másodlagos kategóriák; webcím `https://ngmtkft.hu/`; jogosultan közzétehető valódi fotók; tárgyilagos bemutatkozás; valódi ügyfélértékelések manipuláció nélkül. Ne adj kulcsszót a hivatalos cégnévhez.

A hitelesítés dokumentálása után frissítsd a `seo/site.js` adatokat és a `businessVerified` kapcsolót. Ekkor az Organization entitás LocalBusiness típusú lesz, azonos `@id` alatt; megjelenhet a cím, fő telefonszám, e-mail, nyitvatartás. A Schema.org Validator és a Google Rich Results Test ellenőrzése is szükséges, a figyelmeztetések csak igaz adatokkal javíthatók. A második telefon kontaktként látható marad. Nincs kitalált geo, ár vagy értékelés.

## 3. Search Console és Bing

Search Console → Add property → Domain → `ngmtkft.hu`. Másold ki **a Google által megadott** TXT értéket a DNS-zóna gyökerébe; ne törölj meglévő SPF/egyéb TXT rekordot. Várd meg a propagációt, majd Verify. A tokent később se töröld. Alternatíva URL-prefix property, valódi Google HTML-fájl a `public/` gyökerében vagy valódi meta token; ne találj ki azonosítót.

Sitemaps → `https://ngmtkft.hu/sitemap.xml`. URL Inspection a kezdőlapon és mind a négy szolgáltatásoldalon: fetch/indexelhetőség, deklarált és Google által választott canonical, mobil HTML, feltérképezés ideje. Kérj indexelést az új fontos oldalakra. Pages jelentésben nézd a soft 404, duplicate, excluded és crawled/not indexed okokat; sitemap beküldése nem garantál indexelést.

Bing Webmaster Toolsban a hitelesített Search Console property importálható, vagy a Bing saját verifikációját használd, majd küldd be ugyanazt a sitemapet. A Bing help oldalt a webes eszköz nem tudta elérni; aktuális felületi lépéseit aktiváláskor ellenőrizd. IndexNow jelenleg nincs bekapcsolva; Google támogatást nem állítunk.

Forrás: [Google tulajdonjog-ellenőrzés](https://support.google.com/webmasters/answer/9008080), [Bing Webmaster Tools](https://www.bing.com/webmasters/).

## 4. Analitika és jogosultságok

Hozz létre GA4 webes adatfolyamot, állítsd be a megőrzési időt, az automatikus Enhanced Measurement tiltását és a megfelelő hozzáféréseket. GTM esetén kövesd az [esemény- és konténerszerződést](ANALYTICS_CONSENT.md). Az alkalmazás bekapcsolásához a GitHub repository Settings → Secrets and variables → Actions → Variables részben add meg az egyik valódi `VITE_GA4_ID`/`VITE_GTM_ID` értéket és a jogi/tartalmi jóváhagyás után `VITE_ANALYTICS_APPROVED=true` értéket. Azonosítók nem titkok; privát API-kulcsot ne adj meg. A buildlépés ezeket a publikus változókat használja.

Tag Assistant és DebugView teszt után aktiválj konténert/buildet; a feature ág önmagában nem deployol. Sem GSC-, sem GBP-, sem GA4-, sem GTM-fiókot nem módosítottunk.

## 5. Looker Studio dashboard terv

Két külön adatforrás: Search Console Search performance és GA4. Fiókhozzáférés nélkül tényleges dashboard és támogatott importálható riportazonosító nem hozható létre; nem készült fiktív sablonazonosító.

| Riportlap | Dimenziók/szűrők | Mértékek és korlátok |
|---|---|---|
| Organikus keresés (GSC) | dátum, lekérdezés, landing URL, eszköz, ország | kattintás, megjelenés, CTR, átlagos pozíció; utóbbi nem egy rögzített rangsor |
| Helyi szándékok (GSC) | Tatabánya/klíma/villany kifejezések, landing URL | helyi lekérdezési trend; nincs kitalált volumen |
| Webhasználat (GA4) | oldal, eszköz, forrás/médium, Organic Search | hozzájárulást adó látogatók oldalmegtekintései és engagement; nem teljes forgalom |
| Kapcsolati szándék (GA4) | click_phone, click_email, click_directions, landing URL | interakciók, nem igazolt leadek; valódi lead később csak ellenőrzött rendszerből |
| Technikai állapot | GSC Pages/CWV + CI | indexelt oldalak, hibák, terepi CWV és CI; szükség esetén külön kézi adatforrás |

Azonos dátumtartomány és Europe/Budapest időzóna, havi összevetés és előző időszak; GSC és GA4 eltérő módszertanát, consent hiányt és adatfrissítési késést tüntesd fel. Az indexelt oldalak és CWV nem minden Looker/GSC connectorban érhetők el: ne találj ki dimenziót, szükség esetén külön jelentést linkelj. Blended adatnál canonical landing URL + dátum aggregációval védd ki a sokszorozódó sorokat. Az induló értékek üresek, nem nullával helyettesített történeti tények.

Heti: CI, 404/crawl hibák és indexelés. Havi: query/landing trend és kapcsolati szándékok. Negyedéves: tartalom, valós üzleti ajánlatok, adatvédelmi és mérési konfiguráció felülvizsgálata.
