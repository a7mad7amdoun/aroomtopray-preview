import { PLACE_IDENTITIES } from '../data/place-identities.js';

export function placeIdentity(place,kind){
 const url=typeof place?.url==='string'?place.url:
  kind==='airports'&&/^[A-Za-z]{3}$/.test(place?.iata||'')?`/airports/${place.iata.toLowerCase()}/`:
  ['universities','hospitals'].includes(kind)&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(place?.slug||'')?`/${kind}/${place.slug}/`:null;
 return PLACE_IDENTITIES.find(identity=>identity.placeUrls.includes(url))||null;
}
export function neutralPlaceCode(place,kind){
 if(kind==='airports'&&/^[A-Za-z]{3}$/.test(place?.iata||''))return place.iata.toUpperCase();
 const words=String(place?.name||'').match(/[\p{L}\p{N}]+/gu)||[];
 return words.slice(0,2).map(word=>Array.from(word)[0]).join('').toLocaleUpperCase()||'—';
}
