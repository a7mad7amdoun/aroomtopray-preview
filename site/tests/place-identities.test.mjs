import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
import {PLACE_IDENTITIES,IDENTITY_COVERAGE,IDENTITY_RESEARCH_ONLY} from '../src/data/place-identities.js';
import {placeIdentity,neutralPlaceCode} from '../src/lib/place-identities.js';

test('official identity records preserve exact source provenance and usable local original assets',async()=>{
 const officialHosts={
  'heathrow-media':'mediacentre.heathrow.com',
  'changi-group':'www.changiairport.com',
  'university-toronto':'www.utoronto.ca',
  'guys-stthomas':'www.guysandstthomas.nhs.uk',
  'airports-thailand':'suvarnabhumi.airportthai.co.th',
 };
 assert.equal(PLACE_IDENTITIES.length,4);
 assert.equal(new Set(PLACE_IDENTITIES.flatMap(identity=>identity.placeUrls)).size,4);
 for(const identity of PLACE_IDENTITIES){
  for(const source of [identity.officialSourceUrl,identity.assetSourceUrl]){
   const url=new URL(source);assert.equal(url.protocol,'https:');assert.equal(url.hostname,officialHosts[identity.id]);
   assert.equal(url.username,'');assert.equal(url.password,'');
  }
  assert.equal(identity.retrievedOn,'2026-11-06');assert.ok(identity.sourceContext.length>40);
  assert.match(identity.changes,/^None\./);assert.ok(['institution','operator','trust','media'].includes(identity.scope));
  const bytes=await readFile(new URL(`../public${identity.src}`,import.meta.url));
  assert.ok(bytes.length>100);
  if(identity.src.endsWith('.svg')){
   const svg=bytes.toString();assert.match(svg,/<svg[\s>]/);
   assert.doesNotMatch(svg,/<script[\s>]|<foreignObject[\s>]|\bon\w+\s*=/i);
   assert.doesNotMatch(svg,/(?:href|src)\s*=\s*["'](?:https?:|\/\/)/i,'marks do not load remote assets');
  }
  const meta=await sharp(bytes).metadata();assert.ok(['svg','png'].includes(meta.format));
  assert.ok(Math.abs(meta.width/meta.height-identity.width/identity.height)<0.02,'retain original mark proportions');
 }
});

test('identity matching is canonical and never borrows a same-city or similarly named institution mark',()=>{
 assert.equal(placeIdentity({iata:'SIN'},'airports')?.id,'changi-group');
 assert.equal(placeIdentity({iata:'bkk'},'airports')?.scope,'operator');
 assert.equal(placeIdentity({slug:'university-of-toronto'},'universities')?.id,'university-toronto');
 assert.equal(placeIdentity({slug:'st-thomas-hospital'},'hospitals')?.scope,'trust');
 for(const place of [{url:'/airports/dmk/',iata:'BKK'},{url:'/airports/sin'},{url:'/fr/airports/sin/'},{url:'/airports/sin/?q=x'},{name:'Singapore Changi Airport'},{url:'/universities/toronto-metropolitan-university/'},{url:'/hospitals/toronto-general/'}])assert.equal(placeIdentity(place,'airports'),null);
 assert.equal(placeIdentity({slug:'../university-of-toronto'},'universities'),null);
});

test('unavailable and explicitly restricted marks keep neutral text rather than fabricated institutional artwork',()=>{
 assert.equal(IDENTITY_COVERAGE.length,8);
 assert.equal(IDENTITY_RESEARCH_ONLY[0].id,'heathrow-media');
 assert.equal(placeIdentity({iata:'LHR'},'airports'),null,'media-centre branding is not an airport identity');
 for(const entry of IDENTITY_COVERAGE){
  assert.equal(placeIdentity({url:entry.placeUrl}),null);assert.ok(entry.reason.length>30);
  if(entry.status==='restricted')assert.ok(entry.sourceUrl.startsWith('https:'));
 }
 assert.equal(neutralPlaceCode({iata:'lhr',name:'London Heathrow Airport'},'airports'),'LHR');
 assert.equal(neutralPlaceCode({name:'University of Warwick'},'universities'),'UO');
 assert.equal(neutralPlaceCode({name:'جامعة القاهرة'},'universities'),'جا');
 assert.equal(neutralPlaceCode({},'hospitals'),'—');
});
