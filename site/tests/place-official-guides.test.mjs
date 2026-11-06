import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PLACE_OFFICIAL_GUIDES,OFFICIAL_GUIDE_RESEARCH} from '../src/data/place-official-guides.js';

test('checked official sources resolve only to exact existing featured guides and institution hosts',()=>{
 const places=JSON.parse(readFileSync(new URL('../../research/PHOTO-RESEARCH.json',import.meta.url))).places;
 const hosts={
  '/airports/lhr/':'www.heathrow.com',
  '/airports/ams/':'www.schiphol.nl',
  '/airports/sin/':'www.changiairport.com',
  '/universities/university-of-warwick/':'warwick.ac.uk',
  '/universities/university-of-toronto/':'www.studentlife.utoronto.ca',
  '/universities/university-of-melbourne/':'students.unimelb.edu.au',
  '/hospitals/st-thomas-hospital/':'www.guysandstthomas.nhs.uk',
  '/hospitals/toronto-general/':'www.uhn.ca',
  '/hospitals/houston-methodist-tmc/':'www.houstonmethodist.org',
 };
 assert.deepEqual(PLACE_OFFICIAL_GUIDES.map(record=>record.placeUrl).sort(),Object.keys(hosts).sort());
 for(const record of PLACE_OFFICIAL_GUIDES){
  assert.ok(places.some(place=>place.placeUrl===record.placeUrl),'no city-level or institution-name-only matching');
  const url=new URL(record.officialUrl);
  assert.equal(url.protocol,'https:');assert.equal(url.hostname,hosts[record.placeUrl]);
  assert.ok(url.pathname.length>10,'link to relevant information, not just an institutional homepage');
  assert.match(record.checkedOn,/^\d{4}-\d{2}-\d{2}$/);
  assert.ok(record.officialTitle&&record.summary&&record.evidence.length&&record.ambiguities.length);
  assert.ok(['room','access','chaplaincy'].includes(record.sourceScope));
  assert.doesNotMatch(record.summary,/certified|endorsed|onsite verified/i);
 }
});

test('retrieval attempts remain distinct from checked evidence and historical room dates',()=>{
 assert.equal(OFFICIAL_GUIDE_RESEARCH.length,1);
 const blocked=OFFICIAL_GUIDE_RESEARCH[0];
 assert.equal(blocked.placeUrl,'/universities/university-of-melbourne/');
 assert.equal(blocked.status,'resolved');assert.equal(blocked.checkedOn,undefined);
 assert.equal(blocked.summary,undefined);
 assert.equal(PLACE_OFFICIAL_GUIDES.some(record=>record.placeUrl===blocked.placeUrl),true);
 for(const entry of OFFICIAL_GUIDE_RESEARCH.filter(record=>record.status==='blocked'))assert.equal(PLACE_OFFICIAL_GUIDES.some(record=>record.placeUrl===entry.placeUrl),false);
 const airports=JSON.parse(readFileSync(new URL('../src/data/airports.json',import.meta.url)));
 const lhr=airports.find(place=>place.iata==='LHR');
 assert.notEqual(lhr.spaces[0].checked,PLACE_OFFICIAL_GUIDES.find(record=>record.placeUrl==='/airports/lhr/').checkedOn,'page review must not silently refresh historical room inspection dates');
});

test('source summaries preserve restricted access and distinguish planned facilities from available ones',()=>{
 const get=url=>PLACE_OFFICIAL_GUIDES.find(record=>record.placeUrl===url);
 assert.match(get('/universities/university-of-warwick/').summary,/staff and students with an ID\/access card/);
 assert.match(get('/hospitals/st-thomas-hospital/').summary,/limited to patients, relatives during their stay, and staff/);
 const toronto=get('/universities/university-of-toronto/');
 assert.match(toronto.ambiguities.join(' '),/planned; their installation was not confirmed/);
 assert.doesNotMatch(toronto.summary,/ablution facilities|wudu available/);
 const hospital=get('/hospitals/toronto-general/');
 assert.match(hospital.ambiguities.join(' '),/hours are not explicitly assigned to the Muslim Prayer Room/);
 assert.doesNotMatch(hospital.summary,/6am|10pm|24 hours/);
 assert.match(get('/airports/ams/').summary,/after security/);
 const melbourne=get('/universities/university-of-melbourne/');
 assert.match(melbourne.summary,/strictly for registered university staff and students using individual swipe cards/);
 assert.match(melbourne.summary,/unaffiliated visitors are not admitted/);
 assert.ok(melbourne.summary.split(/\s+/).length<=45);
});

test('Melbourne room records retain the official access restrictions and separate booking routes',()=>{
 const records=JSON.parse(readFileSync(new URL('../src/data/universities-2.json',import.meta.url)));
 const place=records.find(record=>record.slug==='university-of-melbourne');
 const [musallah,music]=place.spaces;
 assert.match(musallah.access,/staff and students only/);
 assert.match(musallah.access,/individual swipe cards/);
 assert.match(musallah.access,/visitors are not admitted/);
 assert.match(music.access,/DIBS/);
 assert.doesNotMatch(music.access,/chaplaincy coordinator/);
 for(const room of place.spaces){assert.equal(room.accessed,'2026-11-06');assert.equal(room.source_url,PLACE_OFFICIAL_GUIDES.find(record=>record.placeUrl==='/universities/university-of-melbourne/').officialUrl);}
});
