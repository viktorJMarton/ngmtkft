export const CONSENT_KEY = 'ngmt-consent-v1';
export const MAX_AGE = 180 * 24 * 60 * 60 * 1000;
export function readConsent(raw, now = Date.now()) {
  try {
    const data = JSON.parse(raw);
    return data.version === 1 && typeof data.analytics === 'boolean' && Number.isFinite(data.time) && data.time <= now && now - data.time < MAX_AGE ? data : null;
  } catch { return null; }
}
export function configuration(env) {
  const ga = env.VITE_GA4_ID || '';
  const gtm = env.VITE_GTM_ID || '';
  const valid = !(ga && gtm) && (/^G-[A-Z0-9]+$/.test(ga) || /^GTM-[A-Z0-9]+$/.test(gtm));
  return { ga, gtm, enabled: Boolean(env.PROD && valid && env.VITE_ANALYTICS_APPROVED === 'true') };
}
export function consentState(analytics = false) {
  return { analytics_storage: analytics ? 'granted' : 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
}
export function createTracker({ config, send, load, page }) {
  let allowed = false, started = false;
  const seen = new Set();
  function event(name, once = false) {
    if (!allowed || !config.enabled || (once && seen.has(name))) return;
    if (!['page_view','click_phone','click_email','click_directions','view_contact','view_service'].includes(name)) return;
    seen.add(name);
    send(name, { page_location: page.url, page_title: page.title, page_type: page.type });
  }
  return {
    setConsent(value) {
      allowed = value === true;
      if (allowed && config.enabled && !started) { started = true; load(); event('page_view', true); if (page.type === 'service') event('view_service', true); }
    }, event,
  };
}
