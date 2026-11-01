import { configuration, consentState, CONSENT_KEY, readConsent, createTracker } from './analytics-core.js';
const config = configuration(import.meta.env);
let stored;
try { stored = readConsent(localStorage.getItem(CONSENT_KEY)); } catch { /* Storage denied: session-only consent. */ }
let allowed = stored?.analytics === true;
let loaded = false;
window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }
gtag('consent', 'default', consentState());
const canonical = document.querySelector('link[rel="canonical"]')?.href;
const pageType = location.pathname === '/kapcsolat/' ? 'contact' : location.pathname === '/' ? 'home' : location.pathname === '/adatvedelem/' ? 'privacy' : 'service';
const tracker = createTracker({ config, page: { url: canonical, title: document.title, type: pageType },
  send(name, params) {
    if (config.gtm) window.dataLayer.push({event:name,...params});
    else gtag('event',name,params);
  },
  load() {
    loaded = true;
    gtag('consent','update',consentState(true));
    const script=document.createElement('script'); script.async=true; script.dataset.analytics='true';
    if (config.gtm) {
      window.dataLayer.push({'gtm.start':Date.now(), event:'gtm.js'});
      script.src=`https://www.googletagmanager.com/gtm.js?id=${config.gtm}`;
    } else {
      gtag('js',new Date());
      gtag('config',config.ga,{send_page_view:false, allow_google_signals:false, allow_ad_personalization_signals:false, page_location:canonical, page_referrer:''});
      script.src=`https://www.googletagmanager.com/gtag/js?id=${config.ga}`;
    }
    document.head.append(script);
  },
});
tracker.setConsent(allowed);
// A choice expires even when this tab stays open for days.
let expiry;
function expireAt(time) {
  clearTimeout(expiry);
  const remaining = time + 180*86400000 - Date.now();
  expiry=setTimeout(()=>{ if (remaining > 2147483647) expireAt(time); else save(false); }, Math.min(Math.max(remaining,0),2147483647));
}
if (stored) expireAt(stored.time);
const dialog=document.createElement('dialog');
dialog.className='consent-dialog'; dialog.setAttribute('aria-labelledby','consent-title');
dialog.innerHTML=`<h2 id="consent-title">Adatvédelmi beállítások</h2><p>${config.enabled ? 'Engedélyezi a Google Analytics látogatottságmérését? A weboldal elutasítás esetén is használható. Reklámcélú adatkezelést nem kapcsolunk be.' : 'Az opcionális látogatottságmérés jelenleg ki van kapcsolva. Google mérőkódot nem töltünk be.'}</p><p>A választást ezen a böngészőn legfeljebb 180 napig tároljuk; bármikor módosítható.</p><p><a href="/adatvedelem/">Mérési és adatvédelmi tudnivalók</a></p><div class="consent-actions">${config.enabled ? '<button type="button" data-choice="accept">Opcionális mérés elfogadása</button><button type="button" data-choice="reject">Opcionális mérés elutasítása</button><button type="button" data-customize>Testreszabás</button>' : '<button type="button" data-close>Bezárás</button>'}</div><form hidden data-preferences><label><input type="checkbox" name="analytics"> Statisztikai mérés (Google Analytics)</label><p>Hirdetési célok: kikapcsolva.</p><button type="submit">Beállítások mentése</button></form>`;
document.body.append(dialog);
let returnFocus;
function open() { returnFocus=document.activeElement; dialog.querySelector('input').checked=allowed; dialog.showModal(); }
dialog.addEventListener('close',()=>returnFocus?.focus());
const button=document.createElement('button');button.type='button';button.textContent='Adatvédelmi beállítások';button.className='privacy-settings';
document.querySelector('footer')?.append(button);button.addEventListener('click',open);
if (document.querySelector('#hero-gallery')) {
  const motionButton=document.createElement('button');motionButton.type='button';motionButton.className='privacy-settings';
  motionButton.textContent='Automatikus mozgás szüneteltetése';motionButton.setAttribute('aria-pressed','false');
  motionButton.addEventListener('click',()=>{
    const paused=document.body.classList.toggle('motion-paused');motionButton.setAttribute('aria-pressed',String(paused));
    motionButton.textContent=paused ? 'Automatikus mozgás folytatása' : 'Automatikus mozgás szüneteltetése';
    document.dispatchEvent(new Event('motion-preference'));
  });document.querySelector('footer')?.append(motionButton);
}
function clearAnalyticsCookies() {
  for(const item of document.cookie.split(';')) {
    const name=item.trim().split('=')[0]; if (!/^_ga(?:_|$)|^_gid$|^_gat/.test(name)) continue;
    const domains = ['',location.hostname, ...location.hostname.split('.').map((_,i,a)=>'.'+a.slice(i).join('.'))];
    for(const domain of domains) document.cookie=`${name}=; Max-Age=0; path=/;${domain ? ` domain=${domain};` : ''} SameSite=Lax`;
  }
}
function save(value) {
  allowed=value;const time=Date.now();
  try {localStorage.setItem(CONSENT_KEY,JSON.stringify({version:1,analytics:value,time}));} catch { /* Choice works for this page even without persistence. */ }
  expireAt(time);tracker.setConsent(value);dialog.close();
  if (!value) {
    if(config.ga) window[`ga-disable-${config.ga}`]=true;
    clearAnalyticsCookies(); if (loaded) location.reload();
  }
  else if (pageType==='contact') tracker.event('view_contact',true);
}
dialog.querySelector('[data-choice="accept"]')?.addEventListener('click',()=>save(true));
dialog.querySelector('[data-choice="reject"]')?.addEventListener('click',()=>save(false));
dialog.querySelector('[data-customize]')?.addEventListener('click',()=>{dialog.querySelector('form').hidden=false;dialog.querySelector('input').focus();});
dialog.querySelector('[data-close]')?.addEventListener('click',()=>dialog.close());
dialog.querySelector('form').addEventListener('submit',event=>{event.preventDefault();save(dialog.querySelector('input').checked);});
window.addEventListener('storage',event=>{if(event.key===CONSENT_KEY) location.reload();});
if (config.enabled && !stored) open();
document.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');if(!link)return;
  const href=link.getAttribute('href');
  if(href.startsWith('tel:')) tracker.event('click_phone');
  else if(href.startsWith('mailto:')) tracker.event('click_email');
  else if(link.hostname==='www.google.com' && link.pathname.startsWith('/maps')) tracker.event('click_directions');
});
const contact=document.querySelector('#kapcsolat');
if(contact && 'IntersectionObserver' in window) new IntersectionObserver((entries,observer)=>{
  if(entries.some(e=>e.isIntersecting) && allowed) {tracker.event('view_contact',true);observer.disconnect();}
},{threshold:0.3}).observe(contact);
