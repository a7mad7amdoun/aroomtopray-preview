import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { CATEGORY_PHOTOGRAPHY } from '../src/data/category-photography.js';

test('category photography stays balanced, licensed, localized and honestly contextual', () => {
 const ids = new Set();
 assert.deepEqual(Object.keys(CATEGORY_PHOTOGRAPHY).sort(), ['airports','hospitals','universities']);
 for (const [category, photos] of Object.entries(CATEGORY_PHOTOGRAPHY)) {
  assert.equal(photos.length, 4);
  for (const photo of photos) {
   assert.ok(!ids.has(photo.id)); ids.add(photo.id);
   assert.equal(photo.category, category);
   assert.equal(photo.context, 'architecture');
   assert.ok(photo.author && photo.location && photo.date);
   assert.ok(photo.sourceUrl.startsWith('https://commons.wikimedia.org/wiki/File'));
   assert.ok(photo.originalUrl.startsWith('https://upload.wikimedia.org/'));
   assert.match(photo.license.name, /^CC BY(?:-SA)? /);
   assert.ok(photo.license.url.startsWith('https://creativecommons.org/'));
   for (const locale of ['en','fr','ar','es']) {
    assert.ok(photo.alt[locale]?.length > 15);
    assert.ok(photo.caption[locale]?.length > 30);
   }
   assert.deepEqual(photo.images.map(image => image.width), [720,1600,2880]);
   if (photo.allowEnlargement) {
    assert.ok(photo.images.at(-1).width / photo.width < 1.02, 'Only disclosed minimal enlargement');
    assert.match(photo.changes, /enlarged.*1.12%/);
   } else assert.ok(photo.images.at(-1).width <= photo.width, 'Never invent source resolution');
  }
 }
});

test('worldwide additions preserve homepage selections and use six distinct named locations', () => {
 const stable = {airports:['bangkok-terminal','toronto-terminal'],universities:['toronto-campus','lincoln-campus'],hospitals:['suburban-hospital','ktph-bridge']};
 const additions = [];
 for (const [category, photos] of Object.entries(CATEGORY_PHOTOGRAPHY)) {
  assert.deepEqual(photos.slice(0,2).map(photo=>photo.id),stable[category]);
  additions.push(...photos.slice(2));
 }
 assert.deepEqual(additions.map(photo=>photo.countryCode).sort(),['AU','DE','ES','MA','SG','ZA']);
 assert.equal(new Set(additions.map(photo=>photo.sourceUrl)).size,6);
 for (const photo of additions) assert.ok(photo.width>=2880&&!photo.allowEnlargement);
});

test('official links belong to the exact institution and blocked sources are not presented as verified', () => {
 const expected = {
  'bangkok-terminal':'suvarnabhumi.airportthai.co.th',
  'toronto-campus':'www.utoronto.ca',
  'madrid-terminal':'www.aena.es',
  'capetown-campus':'uct.ac.za',
  'ntu-campus':'www.ntu.edu.sg',
  'berlin-hospital':'www.charite.de',
 };
 const photos=Object.values(CATEGORY_PHOTOGRAPHY).flat();
 assert.deepEqual(photos.filter(photo=>photo.officialUrl).map(photo=>photo.id).sort(),Object.keys(expected).sort());
 for(const photo of photos){
  if(!expected[photo.id]){assert.equal(photo.officialUrl,undefined);continue;}
  const url=new URL(photo.officialUrl);
  assert.equal(url.protocol,'https:');assert.equal(url.hostname,expected[photo.id]);
  assert.equal(url.username,'');assert.equal(url.password,'');
  assert.equal(photo.officialCheckedOn,'2026-11-06');
 }
});

test('every responsive asset has its advertised dimensions and retained source provenance', async () => {
 const provenance = JSON.parse(await readFile(new URL('../public/photos/category-editorial/provenance.json', import.meta.url), 'utf8'));
 const sources = JSON.parse(await readFile(new URL('../public/photos/category-editorial/commons-source-metadata.json', import.meta.url), 'utf8'));
 for (const photo of Object.values(CATEGORY_PHOTOGRAPHY).flat()) {
  const source = sources.find(source => source.title === photo.file)?.imageinfo[0];
  assert.ok(source, `Missing original Commons evidence for ${photo.id}`);
  assert.equal(source.width, photo.width); assert.equal(source.height, photo.height);
  assert.equal(source.extmetadata.LicenseShortName.value, photo.license.name);
  assert.equal(source.url.split('?')[0], photo.originalUrl);
  const record = provenance.find(record => record.id === photo.id);
  assert.equal(record?.author, photo.author);
  assert.equal(record?.license.name, photo.license.name);
  assert.match(record?.originalSha256 ?? '', /^[0-9a-f]{64}$/);
  for (const image of photo.images) {
   const metadata = await sharp(await readFile(new URL(`../public${image.src}`, import.meta.url))).metadata();
   assert.equal(metadata.width, image.width);
   assert.equal(metadata.height, image.height);
   assert.equal(metadata.format, 'webp');
  }
 }
});
