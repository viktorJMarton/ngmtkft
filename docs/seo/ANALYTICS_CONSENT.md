# Analitika és hozzájárulás

## Aktiválás

Alapállapotban nincs Google script vagy hálózati mérés. A `.env.example` üres nyilvános azonosítókat tartalmaz. Egyszerre **egy** mód választható:

1. Kisebb üzemeltetési igényhez közvetlen GA4: `VITE_GA4_ID` a valódi Google-tag azonosítóval, `VITE_GTM_ID` üres.
2. Marketing/analitikai adminisztrációhoz GTM: `VITE_GTM_ID` a valódi konténerrel, `VITE_GA4_ID` üres. A GA4 tagot ekkor kizárólag a konténer kezeli.

Mindkét azonosító megadása, hibás formátum, fejlesztői mód vagy a `VITE_ANALYTICS_APPROVED=true` jóváhagyási kapcsoló hiánya esetén a mérés nem indul. Az azonosítók nyilvánosak, az ügyfélkód részei; API-kulcs és Google hitelesítő adat ide nem való. Build után új érték csak új builddel érvényesül.

A Pages workflow buildlépése a repository Variables megfelelő `VITE_*` értékeit olvassa. Ha nincsenek megadva, a mérés kikapcsolva marad. Aktiválás előtt az adatvédelmi tájékoztató, a szolgáltatók és a mérési beállítások tulajdonosi jóváhagyása szükséges.

## Eseményszerződés

| Esemény | Jelentés | Egyediség | GA4 key event javaslat |
|---|---|---|---|
| page_view | elfogadás utáni oldalmegtekintés | dokumentumonként egyszer | nem |
| view_service | szolgáltatásoldal megtekintése | dokumentumonként egyszer | nem |
| view_contact | kapcsolatblokk látható, vagy kapcsolatoldalon hozzájárulás | dokumentumonként egyszer | nem |
| click_phone | tel link aktiválása | minden szándékos kattintás | csak tulajdonosi döntés után, kapcsolatfelvételi szándékként |
| click_email | mailto link aktiválása | minden szándékos kattintás | csak szándékként |
| click_directions | Google Maps link aktiválása | minden szándékos kattintás | általában nem |

Nincs űrlap, ezért nincs `generate_lead`. A telefon/e-mail kattintás nem igazolt érdeklődés vagy létrejött üzlet. Ne keverd ezek darabszámát a minősített leadekkel.

A saját eseményparaméterek kizárólag `page_location` (query és fragment nélküli canonical), `page_title`, `page_type`. Nincs kattintott URL, telefonszám, e-mail-cím, név, szabad szöveg. A közvetlen GA4 konfiguráció a referrert üresre állítja, a Google Signals és reklámszemélyre szabás tiltott. A látogató által módosítható query/fragment sosem kerül a saját eseményekhez.

## GTM konténer beállítása

Hozz létre három Data Layer Variable-t: `page_location`, `page_title`, `page_type`. A saját események `{event, page_location, page_title, page_type}` objektumok. A hozzájárulási parancsok a szabványos Google `consent` parancsok, nem egyedi GTM-triggerek.

1. Egy Google tag az igazi GA4 azonosítóhoz. Automatikus page view kikapcsolva (`send_page_view=false`), Google Signals és hirdetési személyre szabás kikapcsolva. `page_location` a saját canonical data layer változó, `page_referrer` üres.
2. Egy GA4 Event tag, explicit Custom Event triggerrel: `^(page_view|view_service|view_contact|click_phone|click_email|click_directions)$`. Csak ezek az események mehetnek át. Az eseménynév az aktuális Event változó.
3. A Google tagot a GA4 Event tag előtti setup tagként futtasd, és a Google tag firing option legyen **Once per page**. Így a konfiguráció a korán sorba állított page_view előtt elkészül. Ne hozz létre másik All Pages page_view taget.
4. Minden analitikai tag Additional Consent Check: `analytics_storage` granted. Ne legyen reklám-, remarketing-, Custom HTML- vagy személyesadat-változó a konténerben. A program nem ad marketing-hozzájárulást.
5. GA4 Enhanced Measurement automatikus oldalváltás-, outbound link-, keresés-, form- és egyéb eseménygyűjtését kapcsold ki; ne legyen automatikusan gyűjtött URL/keresőkifejezés. A saját eseményszerződés az elsődleges.
6. Tag Assistant Preview + GA4 DebugView: elfogadás előtt/elutasítás után nulla Google-kérés; elfogadáskor egy page_view; telefonos linknél egy click_phone; visszavonáskor nincs új tagbetöltés. Ellenőrizd a valódi konténer eseményküldését, nem csak a dataLayert.

A repository tesztje mockolt Google bootstrap választ használ, nem valódi fiókot. A tényleges konténer/GA4 továbbítás és a Google-felületeken látható adat **NEM ELLENŐRZÖTT** fiókhozzáférés nélkül.

## Hozzájárulás működése és korlátai

Consent Mode v2 célok: `analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization`. Alapértelmezés mind denied, elfogadás csak az analytics_storage értékét változtatja. Basic mód: a konténer/gtag script nem töltődik be engedély nélkül; nincs GTM noscript iframe sem.

A párbeszédablakban az elfogadás és elutasítás azonos súlyú gomb. Testreszabásnál csak statisztikai kategória választható. A native dialog kezeli a modális fókuszt és az Escape-et; bezáráskor a fókusz visszakerül a nyitó elemre. Az Escape nem jelent elfogadást. A láblécből bármikor megnyitható.

A localStorage `ngmt-consent-v1` kulcsban verzió, analytics boolean és időpont szerepel, legfeljebb 180 napig. Ez mérnöki tárolási döntés, nem jogszabályi határidő. Verzióváltás, lejárat, hibás/future adat esetén nincs feltételezett hozzájárulás. Másik tab választása újratölti az oldalt. Ha storage nem elérhető, az elfogadás csak az aktuális dokumentumra érvényes.

Visszavonáskor a saját tracker letilt, közvetlen GA4 esetén ga-disable is aktiválódik, a gyökérútvonalon elérhető `_ga*`, `_gid`, `_gat*` sütik törlődnek, majd a dokumentum újratöltődik. A már betöltött tetszőleges GTM-kód nem távolítható el megbízhatóan utólag; ezért az azonnali újratöltés része a kialakításnak. Más nevű/path-on tárolt vagy HttpOnly sütik, külső szolgáltatók és korábban elküldött adatok nem törölhetők ezzel. A konténerben csak a dokumentált mérés legyen.

## Tulajdonosi/jogi véglegesítés

Aktiválás előtt teljesítsd és a látogatók számára tedd elérhetővé: adatkezelő teljes azonosítása; szolgáltatók/adatfeldolgozók és esetleges nemzetközi adattovábbítás; célok/jogalap; GA4 és consent megőrzési idő; érintetti jogok/kapcsolat/NAIH panasz; tárhely-hozzáférési naplók; e-mail/telefonos ajánlatkérés adatkezelése. A jelenlegi technikai adatvédelmi oldal ezek teljes jogi szövegét nem találja ki. A jóváhagyási kapcsoló addig maradjon false.

A megoldás nem helyettesít adatvédelmi szakértői felülvizsgálatot; nincs állítás teljes jogi megfelelőségről. Elsődleges források és hatósági dokumentumok az audit döntésnaplójában.
