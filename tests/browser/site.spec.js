import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { pages } from '../../seo/site.js';
test('all routes work directly, keyboard navigation and WCAG automated checks',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const route of pages) {
  const response=await page.goto(route.path);expect(response.status()).toBe(200);
  await expect(page.locator('h1')).toHaveCount(1);
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
  expect(audit.violations,JSON.stringify(audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})))).toEqual([]);
 }
 expect(errors).toEqual([]);
 expect((await page.goto('/does-not-exist/')).status()).toBe(404);
});
for(const width of [360,390,768,1280,1920])test(`layout ${width}px and no tracking without configuration`,async({page},testInfo)=>{
 await page.setViewportSize({width,height:900});const requests=[];
 page.on('request',r=>{if(/google-analytics|googletagmanager|doubleclick/.test(r.url()))requests.push(r.url());});
 await page.goto('/');await page.waitForTimeout(500);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Adatvédelmi beállítások',exact:true}).click();
 await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Bezárás',exact:true}).click();
 if(width<768) {await page.getByRole('button',{name:'Menü megnyitása',exact:true}).click();await expect(page.locator('#mobile-menu')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('#mobile-menu')).toBeHidden();}
 expect(requests).toEqual([]);
 const gallery=page.locator('[data-work-gallery]').first();await gallery.scrollIntoViewIfNeeded();
 const title=await gallery.locator('[data-work-title]').textContent();
 await gallery.locator('[data-work-next]').click();
 await expect(gallery.locator('[data-work-title]')).not.toHaveText(title);
 for(const route of pages.filter(p=>p.path!=='/')) {
  await page.goto(route.path);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route.path).toBe(true);
 }
 await page.goto('/');
 for(let y=0;y<await page.evaluate(()=>document.body.scrollHeight);y+=700) {await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(50);}
 await page.evaluate(()=>scrollTo(0,0));
 await page.locator('img').evaluateAll(images=>images.forEach(img=>img.loading='eager'));
 await page.waitForFunction(()=>[...document.images].every(img=>img.complete && img.naturalWidth>0));
 await page.screenshot({path:testInfo.outputPath(`home-${width}.png`),fullPage:true});
});
test('reduced motion stops autoplay while manual controls still work',async({page})=>{
 await page.goto('/');const hero=page.locator('#hero-carousel');const before=await hero.evaluate(e=>e.scrollLeft);
 await page.waitForTimeout(6200);expect(await hero.evaluate(e=>e.scrollLeft)).toBe(before);
 await page.getByRole('button',{name:'Automatikus mozgás szüneteltetése',exact:true}).click();
 await expect(page.locator('body')).toHaveClass(/motion-paused/);
 const gallery=page.locator('[data-work-gallery]').first();await gallery.scrollIntoViewIfNeeded();
 const title=await gallery.locator('[data-work-title]').textContent();await gallery.locator('[data-work-next]').click();
 await expect(gallery.locator('[data-work-title]')).not.toHaveText(title);
});
