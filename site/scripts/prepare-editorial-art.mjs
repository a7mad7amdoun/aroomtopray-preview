// Offline preparation only; not part of the site's build or deployment.
// Usage: node scripts/prepare-editorial-art.mjs ../.local/editorial-inputs.json
import sharp from 'sharp';
import {readFile,mkdir,copyFile,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const site=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const manifest=process.argv[2];
if(!manifest)throw new Error('Provide the local JSON map of image names to generated PNG paths.');
const inputs=JSON.parse(await readFile(resolve(manifest),'utf8'));
const assets=resolve(site,'public/art/editorial');
const masters=resolve(site,'../.local/editorial-originals');
await mkdir(assets,{recursive:true});await mkdir(masters,{recursive:true});
const report=[];
for(const [name,input]of Object.entries(inputs)){
 if(!/^[a-z-]+-(light|dark)$/.test(name))throw new Error('Invalid asset name');
 const metadata=await sharp(input).metadata();
 await copyFile(input,resolve(masters,name+'.png'));
 for(const width of [480,960,1664]){
  if(metadata.width<width)throw new Error('Source too small: '+name);
  const file=name+'-'+width+'.webp';
  const info=await sharp(input).resize({width,height:width*9/16,fit:'cover',withoutEnlargement:true}).webp({quality:90,effort:6}).toFile(resolve(assets,file));
  report.push({file,width:info.width,height:info.height,bytes:info.size});
 }
}
await writeFile(resolve(site,'../.local/editorial-assets.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({images:Object.keys(inputs).length,files:report.length,bytes:report.reduce((n,x)=>n+x.bytes,0)}));
