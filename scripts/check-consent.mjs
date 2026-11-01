import { execFileSync, spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { CONSENT_KEY } from '../src/analytics-core.js';
for (const mode of ['ga','gtm']) {
 execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build','--outDir','.consent-dist'],{stdio:'pipe',env:{...process.env,VITE_ANALYTICS_APPROVED:'true',VITE_GA4_ID:mode==='ga'?'G-TESTONLY':'',VITE_GTM_ID:mode==='gtm'?'GTM-TESTONLY':''}});
 const server=spawn(process.execPath,['scripts/serve.mjs'],{stdio:'pipe',env:{...process.env,SERVE_DIR:'.consent-dist',PORT:'4175'}});
 let browser;
 try {
  for(let i=0;i<40;i++) {try {await fetch('http://127.0.0.1:4175/');break;}catch {await new Promise(r=>setTimeout(r,100));}}
  browser=await chromium.launch({channel:process.env.CI?undefined:'chrome'});
  const context=await browser.newContext();const requests=[];
  await context.route(/https:\/\/(www\.googletagmanager\.com|.*google-analytics\.com)\//,route=>{
   requests.push(route.request().url());return route.fulfill({contentType:'text/javascript',body:'window.__mockGoogleTagLoaded=true;'});
  });
  const page=await context.newPage();await page.goto('http://127.0.0.1:4175/klimatelepites-tatabanya/?email=private@example.com#private');
  await page.getByRole('dialog').waitFor();assert.equal(requests.length,0,'pre-consent Google request');
  await page.getByRole('button',{name:'Opcionális mérés elutasítása',exact:true}).click();assert.equal(requests.length,0);
  await page.reload();assert.equal(requests.length,0,'reject persistence');assert.equal(await page.getByRole('dialog').isVisible(),false);
  await page.getByRole('button',{name:'Adatvédelmi beállítások',exact:true}).click();
  await page.getByRole('button',{name:'Testreszabás',exact:true}).click();await page.getByRole('checkbox').check();
  await page.getByRole('button',{name:'Beállítások mentése',exact:true}).click();
  await page.waitForFunction(()=>window.__mockGoogleTagLoaded===true);assert.equal(requests.length,1,'exactly one tag bootstrap');
  await page.evaluate(()=>document.addEventListener('click',event=>{if(event.target.closest('a'))event.preventDefault();}));
  for(const selector of ['a[href^="tel:"]','a[href^="mailto:"]','a[href^="https://www.google.com/maps/"]']) await page.locator(selector).first().click();
  const queue=await page.evaluate(()=>window.dataLayer.map(x=>x.event?x:Array.from(x)));
  const events=mode==='ga'?queue.filter(x=>x[0]==='event').map(x=>x[1]):queue.filter(x=>x.event).map(x=>x.event);
  assert.equal(events.filter(x=>x==='page_view').length,1);assert.equal(events.filter(x=>x==='view_service').length,1);
  for(const name of ['click_phone','click_email','click_directions']) assert.equal(events.filter(x=>x===name).length,1,name);
  assert(!JSON.stringify(queue).includes('private@example.com'),'query data must not enter analytics');
  const defaults=queue.find(x=>x[0]==='consent'&&x[1]==='default')[2];assert(Object.values(defaults).every(v=>v==='denied'));
  await page.evaluate(()=>{document.cookie='_ga=test; path=/';});
  await page.getByRole('button',{name:'Adatvédelmi beállítások',exact:true}).click();
  await Promise.all([page.waitForEvent('load'),page.getByRole('button',{name:'Opcionális mérés elutasítása',exact:true}).click()]);
  assert.equal(requests.length,1,'revocation must not load another tag');
  assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).analytics,CONSENT_KEY),false);
  assert(!(await context.cookies()).some(c=>c.name==='_ga'),'owned analytics cookie removed');
  await context.close();console.log(`Consent PASS (${mode}): default denied; zero preconsent/rejected requests; persisted rejection; customize; single page/service event; query stripped; revoke + cookie cleanup.`);
 } finally {await browser?.close();server.kill();}
}
