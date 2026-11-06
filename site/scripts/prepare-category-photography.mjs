import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { CATEGORY_PHOTOGRAPHY } from '../src/data/category-photography.js';

const root = new URL('../', import.meta.url);
const outputs = new URL('public/photos/category-editorial/', root);
await mkdir(outputs, { recursive:true });
const provenance = [];
for (const record of Object.values(CATEGORY_PHOTOGRAPHY).flat()) {
 const source = new URL(`.local/category-editorial-originals/${record.id}.jpg`, root);
 const original = await readFile(source);
 const metadata = await sharp(original).metadata();
 if (metadata.width !== record.width || metadata.height !== record.height) throw new Error(`Source dimensions changed: ${record.id}`);
 for (const variant of record.images) {
  if (variant.width > metadata.width && !record.allowEnlargement) throw new Error(`Unexpected enlargement: ${record.id}`);
  await sharp(original).rotate().resize({width:variant.width,height:variant.height,fit:'fill',kernel:'lanczos3',withoutEnlargement:!record.allowEnlargement}).sharpen({sigma:0.4}).webp({quality:86,effort:6}).toFile(fileURLToPath(new URL(`public${variant.src}`,root)));
 }
 await sharp(original).rotate().resize({width:900,withoutEnlargement:true}).jpeg({quality:80}).toFile(fileURLToPath(new URL(`.local/category-editorial-originals/${record.id}-preview.jpg`,root)));
 provenance.push({ id:record.id, originalUrl:record.originalUrl, sourceUrl:record.sourceUrl, author:record.author, license:record.license, capturedOn:record.date, reviewedOn:record.reviewedOn, originalWidth:metadata.width, originalHeight:metadata.height, originalSha256:createHash('sha256').update(original).digest('hex'), changes:record.changes, outputs:record.images });
}
await writeFile(new URL('provenance.json',outputs), JSON.stringify(provenance,null,2)+'\n');
console.log(`Prepared ${provenance.length} real photographs and ${provenance.reduce((n,p)=>n+p.outputs.length,0)} responsive assets.`);
