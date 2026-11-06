import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { PLACE_PHOTOS } from '../src/data/place-photos.js';
import { photosForPlace, contextPhotosForPlace, photoSearchUrl, linkedPhotoSources } from '../src/lib/place-photos.js';

test('curated images have exact existing place identities, credits, dates and reuse licences',()=>{
 const queue=JSON.parse(readFileSync(new URL('../../research/PHOTO-RESEARCH.json',import.meta.url)));
 assert.equal(queue.places.length,536);
 assert.equal(new Set(queue.places.map(p=>p.id)).size,536);
 assert.equal(new Set(PLACE_PHOTOS.map(photo=>photo.id)).size,PLACE_PHOTOS.length,'each photograph has its own stable identity');
 for(const photo of PLACE_PHOTOS){
  assert.ok(queue.places.some(place=>place.placeUrl===photo.placeUrl));
  assert.ok(photo.author && !/[<>]/.test(photo.author));
  assert.match(photo.sourceUrl,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  assert.match(photo.dateTaken,/^\d{4}-\d{2}-\d{2}$/);
  assert.ok(new Date(photo.dateTaken).valueOf()<=new Date(photo.review.sourceReviewedOn).valueOf());
  assert.match(photo.license.url,/^https:\/\/creativecommons\.org\/licenses\/by-sa\/(?:3|4)\.0\/$/);
  assert.ok(['room','sign','exterior'].includes(photo.kind));
  for(const locale of ['en','fr','ar','es']){assert.ok(photo.alt[locale].length>20);assert.ok(photo.caption[locale].length>20);}
  const expected=PLACE_PHOTOS.filter(candidate=>candidate.placeUrl===photo.placeUrl&&candidate.review.status==='accepted').map(candidate=>candidate.id);
  assert.deepEqual(photosForPlace(photo.placeUrl).map(p=>p.id),expected,'return every accepted photograph for the exact place');
 }
 assert.deepEqual(photosForPlace('/airports/jfk/'),[],'never borrow a different airport image');
 assert.deepEqual(photosForPlace('/hospitals/not-listed/'),[]);
});

test('all responsive images exist, preserve composition and do not upscale originals',async()=>{
 for(const photo of PLACE_PHOTOS){
  for(const image of photo.images){
   const path=new URL('../public'+image.src,import.meta.url);assert.ok(existsSync(path));
   const meta=await sharp(fileURLToPath(path)).metadata();
   assert.equal(meta.width,image.width);assert.ok(meta.width<=photo.width);
   assert.ok(Math.abs(meta.height-meta.width*photo.height/photo.width)<=1);
   assert.equal(meta.format,'webp');assert.equal(meta.exif,undefined);
  }
 }
});

test('photo searches retain exact institution and location without interpreting punctuation as URL parameters',()=>{
 const place={name:'St Thomas’ & Guy’s',city:'London',country:'United Kingdom'};
 const url=new URL(photoSearchUrl(place));
 assert.equal(url.origin,'https://commons.wikimedia.org');
 assert.equal(url.searchParams.get('search'),'St Thomas’ & Guy’s London United Kingdom');
 assert.equal(url.searchParams.get('type'),'image');
 assert.equal(url.searchParams.size,3);
});

test('photo references preserve existing sources without unsafe links or duplicates',()=>{
 const place={spaces:[{src:'https://example.org/rooms'},{source_url:'https://example.org/rooms'},{src:'javascript:alert(1)'},{src:'https://user:secret@example.org/'}],feedback_url:'https://example.org/contact',feedback:{url:'https://example.org/not-a-link'},chaplaincy:{source_url:'http://example.org/unsafe'}};
 assert.deepEqual(linkedPhotoSources(place),['https://example.org/rooms','https://example.org/contact']);
});

test('research queue keeps missing room photographs visible even when an exterior is available',()=>{
 const {places}=JSON.parse(readFileSync(new URL('../../research/PHOTO-RESEARCH.json',import.meta.url)));
 assert.equal(places.find(p=>p.placeUrl==='/universities/university-of-warwick/').status,'context-photo-only');
 assert.equal(places.find(p=>p.placeUrl==='/airports/lhr/').status,'sourced-sign-photo');
 for(const place of places){
  const photos=photosForPlace(place.placeUrl);
  const expectedStatus=photos.some(photo=>photo.kind==='room')?'sourced-room-photo':photos.some(photo=>photo.kind==='sign')?'sourced-sign-photo':photos.length?'context-photo-only':'needs-research';
  assert.equal(place.status,expectedStatus,`queue accurately describes available evidence for ${place.placeUrl}`);
  assert.deepEqual(place.acceptedPhotoIds,photos.map(photo=>photo.id));
  assert.match(place.countryCode,/^[A-Z]{2}$/);
  for(const value of Object.values(place.searchLinks))assert.equal(new URL(value).searchParams.get('type'),'image');
 }
});

test('Doha photographs remain historical entrance signage, not evidence of a room interior',()=>{
 const photos=photosForPlace('/airports/doh/');
 assert.deepEqual(photos.map(photo=>photo.id),['doha-mens-prayer-sign','doha-womens-prayer-sign']);
 for(const photo of photos){
  assert.equal(photo.kind,'sign');
  assert.equal(photo.dateTaken,'2023-08-22');
  assert.equal(photo.author,'José Ignacio Gallardo');
  assert.equal(photo.license.name,'CC BY-SA 4.0');
  assert.match(photo.caption.en,/interior is not shown/);
 }
 const {places}=JSON.parse(readFileSync(new URL('../../research/PHOTO-RESEARCH.json',import.meta.url)));
 assert.equal(places.find(place=>place.placeUrl==='/airports/doh/').status,'sourced-sign-photo');
 const credits=JSON.parse(readFileSync(new URL('../public/photos/places/CREDITS.json',import.meta.url)));
 assert.deepEqual(credits.filter(photo=>photo.placeUrl==='/airports/doh/'),photos,'published derivatives retain full credits and reuse terms');
});

test('architectural photographs attach only to the exact matching institution and preserve source identity',()=>{
 const expected={
  '/airports/bkk/':'bangkok-terminal','/airports/yyz/':'toronto-terminal',
  '/airports/rak/':'marrakech-terminal','/airports/mad/':'madrid-terminal',
  '/universities/university-of-toronto/':'toronto-campus',
 };
 const {places}=JSON.parse(readFileSync(new URL('../../research/PHOTO-RESEARCH.json',import.meta.url)));
 for(const [url,id]of Object.entries(expected)){
  assert.ok(places.some(place=>place.placeUrl===url),'context may only attach to an existing guide');
  const photos=contextPhotosForPlace(url);assert.equal(photos.length,1);
  const photo=photos[0];assert.equal(photo.id,id);assert.equal(photo.placeUrl,url);
  assert.equal(photo.kind,'context');assert.equal(photo.context,'architecture');
  assert.equal(photo.dateTaken,photo.date);assert.ok(photo.sourceUrl&&photo.author&&photo.license.url);
  assert.equal(photo.review,undefined,'architecture does not become accepted room evidence');
  assert.deepEqual(photosForPlace(url),[],'documentary queue remains unchanged');
  for(const image of photo.images)assert.ok(existsSync(new URL('../public'+image.src,import.meta.url)));
 }
});
test('context lookup never borrows a photo through city names, partial routes or unrelated category fallbacks',()=>{
 for(const url of [undefined,null,'','__proto__','/airports/dmk/','/airports/yyt/','/airports/yzt/','/airports/yyz','/airports/yyz/?q=Toronto','/fr/airports/yyz/','/universities/toronto-metropolitan-university/','/hospitals/toronto-general-hospital/','/universities/lincoln/','/airports/unknown/']){
  assert.deepEqual(contextPhotosForPlace(url),[],String(url));
 }
 assert.equal(photosForPlace('/airports/lhr/')[0].kind,'sign');
 assert.equal(contextPhotosForPlace('/airports/lhr/').length,0);
 assert.equal(photosForPlace('/airports/kul/')[0].kind,'room');
});
