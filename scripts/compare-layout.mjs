import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome'});const results=[];
try {
 for(const width of [360,390,768,1280,1920]) {
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});const samples=[];
  for(const origin of [process.env.BASELINE_URL || 'http://127.0.0.1:4174',process.env.TEST_URL || 'http://127.0.0.1:4173']) {
   await page.goto(origin+'/',{waitUntil:'networkidle'});
   samples.push(await page.evaluate(()=>[...document.querySelectorAll('header, #kezdolap, .hero-title, .hero-carousel, #szolgaltatasok, .service-card, .reference-section, #rolunk, #kapcsolat')].map(el=>{
    const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {element:el.id||el.className,x:r.x,y:r.y,width:r.width,height:r.height,font:s.fontFamily,size:s.fontSize,color:s.color,background:s.backgroundColor};
   })));
  }
  const differences=samples[0].flatMap((before,i)=>{
   const after=samples[1][i];return Object.keys(before).filter(key=>before[key]!==after[key]).map(key=>({element:before.element,key,before:before[key],after:after[key]}));
  });results.push({width,differences});await page.close();
 }
}finally {await browser.close();}
await writeFile('artifacts/layout-comparison.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
