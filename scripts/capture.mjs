import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const label = process.argv[2] || 'after';
await mkdir(`artifacts/${label}`, {recursive:true});
const browser=await chromium.launch({channel:process.env.CI ? undefined : 'chrome'});
try {
 for(const width of [360,390,768,1280,1920]) {
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:4173/',{waitUntil:'networkidle'});
  for(let y=0;y<await page.evaluate(()=>document.body.scrollHeight);y+=700) {await page.evaluate(y=>window.scrollTo(0,y),y);await page.waitForTimeout(75);}
  await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(250);
  await page.screenshot({path:`artifacts/${label}/${width}.png`,fullPage:true});
  await page.close();
 }
} finally {await browser.close();}
