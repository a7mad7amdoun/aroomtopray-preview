import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {SETTING_GALLERIES} from '../src/data/setting-gallery.js';
const publicRoot=new URL('../public/',import.meta.url),output=new URL('photos/room-gallery/',publicRoot);
const settingCredits=JSON.parse(await readFile(new URL('photos/settings/CREDITS.json',publicRoot),'utf8')).credits;
await mkdir(output,{recursive:true});
const credits=[];
for(const [category,photos] of Object.entries(SETTING_GALLERIES))for(const [index,photo] of photos.entries()){
 let source=new URL(`${photo.base.slice(1)}-${photo.widths.at(-1)}.webp`,publicRoot);
 // Use preserved originals only when their hash matches the recorded photograph.
 if(index===0){
  const original=new URL(`../../.local/room-threshold-release-qa/originals/${category}.jpg`,import.meta.url);
  if(existsSync(original)){
   const digest=createHash('sha256').update(await readFile(original)).digest('hex');
   if(digest===settingCredits.find(credit=>credit.scene===category)?.sha256Original)source=original;
  }
 }
 const metadata=await sharp(fileURLToPath(source)).metadata();
 const widths=[1440,2880],files=[];
 for(const width of widths){
  const file=`${category}-${index+1}-${width}.webp`;
  await sharp(fileURLToPath(source)).rotate().resize({width,kernel:'lanczos3',withoutEnlargement:false}).sharpen({sigma:.35}).webp({quality:86,effort:6}).toFile(fileURLToPath(new URL(file,output)));
  files.push(file);
 }
 credits.push({...photo,files,inputWidth:metadata.width,inputHeight:metadata.height,upscaled:metadata.width<2880,modifications:'Orientation normalized; resized with Lanczos3, lightly sharpened, converted to WebP. Enlargement does not add photographic detail. No change to colours or recorded time of day.'});
}
await writeFile(new URL('CREDITS.json',output),JSON.stringify({credits},null,2)+'\n');
console.log('Prepared 18 locally sourced gallery variants with attribution.');
