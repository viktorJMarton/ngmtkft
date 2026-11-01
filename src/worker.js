// A meglévő Cloudflare Worker: hostname/HTTPS normalizálás, majd statikus asset.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === 'www.ngmtkft.hu' || url.protocol === 'http:') {
      url.protocol = 'https:';
      url.hostname = 'ngmtkft.hu';
      url.port = '';
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
