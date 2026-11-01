# Teljesítményjelentés

2026. november 1. Helyi statikus HTTP-kiszolgáló, Windows, Chrome 156, Lighthouse 13.6.0, standard mobile/desktop preset és szimulált throttling. A before/after mérések sorosan futottak, azonos gépen. Ezek egyszeri laborfutások, nem több futás mediánjai, nem éles hálózati mérések és nem terepi percentilisek. A pontszámok önmagukban nem üzleti vagy rangsorolási célok.

| Mérték | Mobil előtte | Mobil utána | Desktop előtte | Desktop utána |
|---|---:|---:|---:|---:|
| Lighthouse performance | 74 | 77 | 93 | 97 |
| LCP | 9,171 s | 6,197 s | 1,736 s | 1,233 s |
| TBT | 77 ms | 86 ms | 0 ms | 0 ms |
| CLS | 0 | 0 | 0 | 0 |

**A mobil LCP-cél nem teljesült.** A TBT nem INP; INP-t és valós felhasználói 75. percentilist nem mértünk. Nincs Search Console/CrUX/GA4 hozzáférésből származó terepadat. A valós CWV célok elérését nem állítjuk.

Az első implementációs mobilmérés 64 pontot, 7,514 s LCP-t és 409 ms TBT-t mutatott. Ezt regresszióként kezeltük: az eager galériamásolatok betöltését megszüntettük, 800 px-es köztes képváltozatot adtunk hozzá, és a WebP/JPEG kódolást fájlméret alapján választjuk. A végső mobil TBT 86 ms lett, ami az egyszeri eredeti méréshez képest 9 ms eltérés; ebből önmagában nem állapítható meg statisztikai regresszió vagy javulás. A kezdeti sikertelen/gyengébb eredményeket az `artifacts/after/*-initial.json` is megőrzi.

## Végrehajtott optimalizálás

- 46 eredeti asset teljes hash-/méretleltára, 36 raszterkép tényleges dimenzióival. A hasazonos képek közös generált variantot használnak; az eredetiek és a portfólió tartalma megmaradnak.
- 480, 800, 1200, 1440 px és szükség esetén az eredeti kisebb szélesség, felnagyítás nélkül; `srcset`/`sizes`, valódi width/height. A WebP 82 és JPEG 82 kódolás közül a kisebb kerül a variantba. Nincs olyan elv, hogy a WebP minden képnél automatikusan jobb.
- A hero első képe továbbra is high fetchpriority, nincs lazy beállítása. A többi kép lazy; a hurokhoz létrehozott referenciaképmásolatok is lazy. A fotók, képkivágás CSS-e és a lapozó geometria megmaradt.
- Google-kód alaphelyzetben nem töltődik be. A külső analitika nem terheli a nem hozzájáruló látogatót.
- Új stílusok elkülönítve, a Tailwind gyűjtés a tényleges forrásokra korlátozva. Az eredeti megjelenési szabályok változatlanok.
- CSS+JS összes gzip méretének CI-korlátja 45 000 bájt, a mért új állapot körülbelül 21,2 kB. Ez karbantartható statikus budget; nem helyettesíti a CWV-mérést. A CSS és JS nyers mérete a baseline kb. 61,2+13,6 kB-ról kb. 79,8+19,8 kB-ra nőtt az új nézetek és a consent működés miatt.

A mobilmérés legnagyobb kérésében a hero 800 px WebP változata 258 464 bájt körüli payloadot használt az eredeti 401 633 bájtos kép helyett. Az eltérő viewportok és DPR más variantot választanak. A megőrzött eredetiek növelik az artifact méretét, de nem töltődnek le automatikusan a látogatónál.

## Reprodukció

`npm ci`, `npm run build`, `node scripts/serve.mjs`; állítsd a CHROME_PATH értékét a helyi Chrome-ra, ha a Lighthouse nem találja. Másik terminál:

```sh
npm exec --yes --package=node@22 --package=lighthouse@13.6.0 -- lighthouse http://127.0.0.1:4173/ --output=json --output-path=artifacts/lighthouse-mobile.json --chrome-flags="--headless=new"
npm exec --yes --package=node@22 --package=lighthouse@13.6.0 -- lighthouse http://127.0.0.1:4173/ --preset=desktop --output=json --output-path=artifacts/lighthouse-desktop.json --chrome-flags="--headless=new"
```

A Lighthouse elkülönített mérőeszköz, nincs az alkalmazás package-lockjában. A baseline az elmentett `.baseline-dist` artifact `SERVE_DIR=.baseline-dist PORT=4174` kiszolgálásával reprodukálható a jelen munkamenetben. A végleges kód többi ellenőrzése `npm run check`.

További prioritás: éles gzip/Brotli és cache igazolása, három-öt ismételt mobilfutás mediánja, hero hálózati és renderlánc vizsgálata valódi mobilon, majd terepi adatok. A vizuális animációk és hero-kivágás további megváltoztatása csak külön, mérhetően indokolt változtatásként történjen; a jelen feladatban az eredeti megjelenés megőrzése elsődleges. Havi CWV-ellenőrzés az élesítés és elegendő valós forgalom után.
