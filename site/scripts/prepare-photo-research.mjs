// Creates a local editorial queue; never downloads or approves search results.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { countryCode } from '../src/lib/countries.js';
import { photosForPlace, photoSearchUrl, linkedPhotoSources } from '../src/lib/place-photos.js';

const root = new URL('../../', import.meta.url);
const inputs = [ ['airports','airports'], ['universities','universities'], ['universities-2','universities'], ['hospitals-uk','hospitals'], ['hospitals-na','hospitals'] ];
const places = [];
for (const [file,kind] of inputs) {
 const records=JSON.parse(await readFile(new URL(`site/src/data/${file}.json`,root),'utf8'));
 for (const place of records) {
  const slug=kind==='airports'?place.iata.toLowerCase():place.slug;
  const placeUrl=`/${kind}/${slug}/`, photos=photosForPlace(placeUrl);
  const exactName=[place.name,place.city,place.country].filter(Boolean).join(' ');
  const queries={interior:`${exactName} prayer room multifaith`,entrance:`${exactName} prayer room entrance sign`,access:`${exactName} chaplaincy prayer facilities access`};
  places.push({
   id:`${kind}/${slug}`, placeUrl, category:kind, name:place.name, city:place.city,
   country:place.country, countryCode:countryCode(place.country), latitude:place.lat, longitude:place.lon,
   status:photos.some(p=>p.kind==='room')?'sourced-room-photo':photos.some(p=>p.kind==='sign')?'sourced-sign-photo':photos.length?'context-photo-only':'needs-research',
   existingSourceLinks:linkedPhotoSources(place), photoSearchUrl:photoSearchUrl(place), queries,
   searchLinks:Object.fromEntries(Object.entries(queries).map(([key,search])=>[key,`https://commons.wikimedia.org/w/index.php?${new URLSearchParams({search,title:'Special:MediaSearch',type:'image'})}`])),
   acceptedPhotoIds:photos.map(p=>p.id),
  });
 }
}
places.sort((a,b)=>a.id.localeCompare(b.id));
if(new Set(places.map(p=>p.id)).size!==places.length)throw new Error('Duplicate place identity');
const queue={
 schemaVersion:1,
 scope:'Existing directory records only; countries without listings do not get fabricated places.',
 approvalChecklist:[
  'Match the exact institution, city and country, then confirm the building and terminal when known.',
  'Open the original image and identify its purpose: room interior, entrance/sign or exterior context.',
  'Record source URL, creator, capture date (or explicitly unknown), licence and permission evidence.',
  'Do not copy search thumbnails or assume an official website permits reuse. Link only when rights are unclear.',
  'Keep historical photos dated. A photo never verifies current access, facilities or opening hours.',
  'Do not infer a room from a building exterior or use one institution’s photo on another listing.',
  'Prefer empty rooms; avoid identifiable patients, documents, access codes and intrusive worship portraits.',
  'Retain attribution, licence and changes. No generative alterations to documentary photographs.',
 ],
 places,
};
await mkdir(new URL('research/',root),{recursive:true});
await writeFile(new URL('research/PHOTO-RESEARCH.json',root),JSON.stringify(queue,null,2)+'\n');
const columns=['id','category','name','city','country','countryCode','status','placeUrl','photoSearchUrl','existingSourceLinks','acceptedPhotoIds'];
const cell=value=>'"'+String(Array.isArray(value)?value.join(' | '):value??'').replaceAll('"','""')+'"';
const csv=[columns.join(','),...places.map(place=>columns.map(key=>cell(place[key])).join(','))].join('\r\n')+'\r\n';
await writeFile(new URL('research/PHOTO-RESEARCH.csv',root),csv);
console.log(JSON.stringify({places:places.length,withPhotos:places.filter(p=>p.acceptedPhotoIds.length).length,byCategory:Object.fromEntries(inputs.map(([,kind])=>[kind,places.filter(p=>p.category===kind).length]))}));
