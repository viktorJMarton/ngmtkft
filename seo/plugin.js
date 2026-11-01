import { readFile } from 'node:fs/promises';
import { pages, site } from './site.js';
import { renderPage, escape } from './render.js';
export function seoPlugin() {
  return {
    name: 'static-seo-pages',
    transformIndexHtml: { order: 'pre', handler: html => renderPage(html, pages[0]) },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const page = pages.find(p=>p.path !== '/' && p.path === req.url?.split('?')[0]);
        if (!page) return next();
        try {
          const raw = await readFile('index.html', 'utf8');
          const transformed = await server.transformIndexHtml('/', raw);
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(renderPage(transformed, page));
        } catch (error) { next(error); }
      });
    },
    generateBundle: { order: 'post', handler(_, bundle) {
      const home = bundle['index.html'].source;
      for (const page of pages.slice(1)) this.emitFile({ type: 'asset', fileName: `${page.path.slice(1)}index.html`, source: renderPage(home, page) });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(page=>`<url><loc>${escape(site.origin + page.path)}</loc></url>`).join('')}</urlset>\n` });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\nSitemap: ${site.origin}/sitemap.xml\n` });
      this.emitFile({ type: 'asset', fileName: '404.html', source: '<!doctype html><html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Az oldal nem található | NGM-t Kft.</title></head><body><main><h1>Az oldal nem található</h1><p>Ellenőrizze a címet, vagy lépjen a <a href="/">kezdőlapra</a>.</p></main></body></html>' });
    } },
  };
}
