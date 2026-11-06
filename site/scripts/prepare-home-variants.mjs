// Split the approved paired day/evening illustrations and retain their originals.
// Usage: node scripts/prepare-home-variants.mjs airport.png campus.png hospital.png
import sharp from 'sharp';
import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const scenes=['airport','campus','hospital'];
const sources=process.argv.slice(2);
if(sources.length!==3)throw new Error('Supply the three approved airport, campus and hospital diptychs.');
const output=fileURLToPath(new URL('../public/art/home-paired-views/',import.meta.url));
const originals=fileURLToPath(new URL('../../design/home-views-extended/',import.meta.url));
await mkdir(originals,{recursive:true});
const records=[];
for(let i=0;i<scenes.length;i++){
 const category=scenes[i], source=sources[i];
 const {width,height}=await sharp(source).metadata();
 const half=Math.floor(width/2);
 await copyFile(source,`${originals}/${category}-day-evening.png`);
 for(const [index,lighting] of ['day','night'].entries())for(const size of [640,1122]){
  const file=`${category}-2-${lighting}-${size}.webp`;
  await sharp(source).extract({left:index*half,top:0,width:half,height}).resize({width:size,height:Math.round(size*1.25),fit:'cover',position:'centre'}).webp({quality:87}).toFile(`${output}/${file}`);
 }
 records.push({id:`${category}-2`,type:'Generated architectural illustration',source:`design/home-views-extended/${category}-day-evening.png`,sourcePanel:{width:half,height},outputWidths:[640,1122],viewpoint:{airport:'First-floor terminal room across the apron',campus:'First-floor corridor across a courtyard',hospital:'Second-floor room across the healing courtyard'}[category],processing:'Equal day/evening panels extracted with identical centered 4:5 crops; resized to responsive WebP. Enlarged variants do not add original detail.',date:'2026-11-05'});
}
await writeFile(`${output}/CREDITS-extended.json`,JSON.stringify({note:'Imagined settings, not records of real institutions or prayer rooms.',scenes:records},null,2)+'\n');
console.log('Prepared twelve day/evening variants for three additional scenes.');
