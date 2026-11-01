import sharp from 'sharp';
import { readdir, readFile, mkdir, writeFile, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, resolve, sep } from 'node:path';
const inventory=[]; const manifest={}; const variants=new Map();
const heroImages=new Set(['klimatelepites-emelokosarral.jpg','klimaszereles-szerszam.jpg','klima-erkely.jpg']);
await mkdir('public/images/generated',{recursive:true});
const generated=resolve('public/images/generated');
if (!generated.startsWith(resolve('public/images')+sep)) throw new Error('Invalid generated image directory');
for(const entry of await readdir(generated,{withFileTypes:true})) {
 if(entry.isFile() && /^[a-f0-9]{16}-\d+\.(webp|jpg|avif)$/.test(entry.name)) await unlink(join(generated,entry.name));
}
await mkdir('artifacts',{recursive:true});
async function walk(dir) {
 for(const entry of await readdir(dir,{withFileTypes:true})) {
  if(entry.name==='generated' || entry.name==='og-cover.jpg')continue;
  const path=join(dir,entry.name);
  if(entry.isDirectory()) {await walk(path);continue;}
  const bytes=await readFile(path); const hash=createHash('sha256').update(bytes).digest('hex');
  if(!/\.(jpg|webp|png)$/i.test(entry.name)){inventory.push({path,bytes:bytes.length,hash});continue;}
  const meta=await sharp(bytes).metadata();
  let outputs=variants.get(hash);
  if(!outputs) {
   outputs=[];
   for(const width of [...new Set([480,800,1200,1440,Math.min(meta.width,1440)].filter(w=>w<=meta.width))].sort((a,b)=>a-b)) {
    const pipeline=sharp(bytes).rotate().resize({width,withoutEnlargement:true});
    const webp=await pipeline.clone().webp({quality:82}).toBuffer();
    const jpeg=await pipeline.clone().jpeg({quality:82}).toBuffer();
    const useWebp=webp.length<=jpeg.length;const result=useWebp?webp:jpeg;
    const file=`/images/generated/${hash.slice(0,16)}-${width}.${useWebp?'webp':'jpg'}`;
    await writeFile('public'+file,result);outputs.push({file,width,bytes:result.length});
   }
   variants.set(hash,outputs);
  }
  const key='/'+path.replaceAll('\\','/').replace(/^public\//,'');
  manifest[key]={width:meta.width,height:meta.height,outputs};
  if(heroImages.has(entry.name)) {
   const avifOutputs=[];
   for(const output of outputs) {
    const result=await sharp(bytes).rotate().resize({width:output.width,withoutEnlargement:true}).avif({quality:60,effort:4}).toBuffer();
    const file=`/images/generated/${hash.slice(0,16)}-${output.width}.avif`;
    await writeFile('public'+file,result);avifOutputs.push({file,width:output.width,bytes:result.length});
   }
   manifest[key].avifOutputs=avifOutputs;
  }
  inventory.push({path,bytes:bytes.length,width:meta.width,height:meta.height,hash,outputs});
 }
}
await walk('public/images');
await sharp('public/images/klimatelepites-emelokosarral.jpg').rotate().resize(1200,630,{fit:'cover',position:'centre'}).jpeg({quality:85}).toFile('public/images/og-cover.jpg');
await writeFile('seo/images.generated.json',JSON.stringify(manifest,null,2)+'\n');
await writeFile('artifacts/media-inventory.json',JSON.stringify(inventory,null,2)+'\n');
console.log(`Media inventory: ${inventory.length} assets; ${Object.keys(manifest).length} responsive images.`);
