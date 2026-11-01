import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readConsent, configuration, createTracker, consentState, MAX_AGE } from '../src/analytics-core.js';
test('configuration fails closed, rejects double installation and development',()=>{
 assert.equal(configuration({PROD:true}).enabled,false);
 assert.equal(configuration({PROD:true,VITE_GA4_ID:'G-TEST',VITE_GTM_ID:'GTM-TEST',VITE_ANALYTICS_APPROVED:'true'}).enabled,false);
 assert.equal(configuration({PROD:false,VITE_GA4_ID:'G-TEST',VITE_ANALYTICS_APPROVED:'true'}).enabled,false);
 assert.equal(configuration({PROD:true,VITE_GA4_ID:'G-TEST',VITE_ANALYTICS_APPROVED:'true'}).enabled,true);
});
test('invalid, expired and future consent is rejected',()=>{
 for(const raw of [null,'bad','{}',JSON.stringify({version:1,analytics:true,time:1}),JSON.stringify({version:1,analytics:'true',time:MAX_AGE}),JSON.stringify({version:1,analytics:true,time:MAX_AGE*3})])assert.equal(readConsent(raw,MAX_AGE*2),null);
 assert.equal(readConsent(JSON.stringify({version:1,analytics:false,time:MAX_AGE*2-1}),MAX_AGE*2).analytics,false);
});
test('no preconsent events, one page view, one service view, no PII parameters',()=>{
 const events=[];let loads=0;
 const tracker=createTracker({config:{enabled:true},send:(...args)=>events.push(args),load:()=>loads++,page:{url:'https://ngmtkft.hu/',title:'Home',type:'service'}});
 tracker.event('click_phone');tracker.setConsent(false);assert.equal(events.length,0);assert.equal(loads,0);
 tracker.setConsent(true);tracker.setConsent(true);tracker.event('view_service',true);tracker.event('generate_lead');
 assert.deepEqual(events.map(e=>e[0]),['page_view','view_service']);assert.equal(loads,1);
 tracker.event('click_phone');assert.deepEqual(Object.keys(events.at(-1)[1]),['page_location','page_title','page_type']);
 tracker.setConsent(false);tracker.event('click_email');assert.equal(events.length,3);
 assert.deepEqual(consentState(),{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
});
