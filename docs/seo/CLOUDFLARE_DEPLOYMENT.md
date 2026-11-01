# Cloudflare publikálás

2026. november 1.: tulajdonosi kérésre az ellenőrzött változat main ágba merge-ölhető és a meglévő Cloudflare-oldalon publikálható. A GitHub Pagesre költözés helyett a felhasználó a meglévő Cloudflare-oldal frissítését választotta.

## Ellenőrzött kiinduló infrastruktúra

Worker: `ngmtkft`, meglévő custom domainek: `ngmtkft.hu`, `www.ngmtkft.hu`. A régi éles verzió: `07d713a2-4ec1-44ac-ac8f-31de98518b1a`. Binding nem volt. Compatibility date: `2026-09-25`, ez megmarad. A domain-hozzárendeléseket a Cloudflare API-val ellenőriztük, DNS-költöztetés nem szükséges.

A korábbi Cloudflare preview buildek sikertelenek voltak. A buildnapló API a Wrangler OAuth munkamenetnek 403-at adott; konkrét korábbi hibaokot ebből nem állítunk. A repo korábban nem tartalmazott explicit Wrangler-konfigurációt. Az új `wrangler.jsonc` azonosítja a meglévő Workert, a két meglévő domaint és a buildelt assetkönyvtárat. A `.node-version` a tesztelt Node 22.23.4-et választja.

A GitHub Pages workflow csak kézi fallback marad, main push többé nem indít Pages-deployt. A Cloudflare kézi publikálása nem igényli a számlázási zárolás miatt nem induló GitHub Actions futtatását. A független QA workflow megmarad, de a helyi tesztet és a távoli CI-t továbbra is külön kell jelenteni.

## Publikálás

```sh
npm ci
npm run check
npm exec --yes --package=node@22 --package=wrangler@4.156.0 -- wrangler login
npm exec --yes --package=node@22 --package=wrangler@4.156.0 -- wrangler deploy --dry-run
npm exec --yes --package=node@22 --package=wrangler@4.156.0 -- wrangler deploy
```

Az npm parancsokhoz Node 22.19+ szükséges. A Wrangler saját build hookja `npm run build`, így mindig a friss `dist` kerül feltöltésre. API-tokent/jelszót ne írj a konfigurációba vagy commitba. A hivatalos login kezeli a hitelesítést a repositoryn kívül.

Az apró Worker csak a HTTP/www kéréseket irányítja a HTTPS non-www címre, a path és query megőrzésével. Minden más kérést a statikus ASSETS kiszolgálónak ad át. A beépített HTML-kezelés végző `/` URL-t használ, a hiányzó útvonal 404 oldalt kap SPA fallback helyett. A fotók/stílusok/JavaScript kiszolgálása statikus marad.

Utóellenőrzés: kezdőlap és mind a hat belső oldal 200; CSS/JS/képek betöltődnek; canonical és sitemap helyes; HTTP és www átirányít; véletlen hiányzó URL 404; mobil/desktop képernyőkép. Az élesítés eredményét külön a deploy kimenete és a valódi domain ellenőrzése igazolja.

Visszaállítás szükség esetén: `wrangler rollback 07d713a2-4ec1-44ac-ac8f-31de98518b1a --name ngmtkft`. Ez éles állapotváltoztatás; csak indokolt hiba esetén, megfelelő jogosultsággal futtasd. A verzióazonosító a kiadás előtti állapotra mutat, nem egy generált alkalmazássablonra.

Forrás: [Cloudflare HTML URL-kezelés](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/), [Cloudflare build Node-verzió](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/).
