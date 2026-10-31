import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { PLACE_PHOTOS } from '../src/data/place-photos.js';
import { photosForPlace, photoSearchUrl, linkedPhotoSources } from '../src/lib/place-photos.js';

test('curated images have exact existing place identities, credits, dates and reuse licences',()=>{
 const queue=JSON.parse(readFileSync(new URL('../../docs/PHOTO-RESEARCH.json',import.meta.url)));
 assert.equal(queue.places.length,536);
 assert.equal(new Set(queue.places.map(p=>p.id)).size,536);
 for(const photo of PLACE_PHOTOS){
  assert.ok(queue.places.some(place=>place.placeUrl===photo.placeUrl));
  assert.ok(photo.author && !/[<>]/.test(photo.author));
  assert.match(photo.sourceUrl,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  assert.match(photo.dateTaken,/^\d{4}-\d{2}-\d{2}$/);
  assert.ok(new Date(photo.dateTaken).valueOf()<=new Date(photo.review.sourceReviewedOn).valueOf());
  assert.match(photo.license.url,/^https:\/\/creativecommons\.org\/licenses\/by-sa\/(?:3|4)\.0\/$/);
  assert.ok(['room','sign','exterior'].includes(photo.kind));
  for(const locale of ['en','fr','ar','es']){assert.ok(photo.alt[locale].length>20);assert.ok(photo.caption[locale].length>20);}
  assert.deepEqual(photosForPlace(photo.placeUrl).map(p=>p.id),[photo.id]);
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
 const {places}=JSON.parse(readFileSync(new URL('../../docs/PHOTO-RESEARCH.json',import.meta.url)));
 assert.equal(places.filter(p=>p.status==='sourced-room-photo').length,2);
 assert.equal(places.find(p=>p.placeUrl==='/universities/university-of-warwick/').status,'context-photo-only');
 assert.equal(places.find(p=>p.placeUrl==='/airports/lhr/').status,'sourced-sign-photo');
 assert.equal(places.filter(p=>p.status==='needs-research').length,531);
 for(const place of places){
  assert.match(place.countryCode,/^[A-Z]{2}$/);
  for(const value of Object.values(place.searchLinks))assert.equal(new URL(value).searchParams.get('type'),'image');
 }
});
