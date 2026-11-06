/** Same-country reading suggestions, never proximity or access recommendations. */
export function relatedPlaceGuides(place, places, kind, limit=2) {
 if(!['airports','universities','hospitals'].includes(kind)||!place?.country||!Number.isInteger(limit)||limit<1) return [];
 const seen=new Set([place.url]);
 return (places||[]).filter(candidate=>{
  if(!candidate||candidate.country!==place.country||candidate.hold||!candidate.spaces?.length||candidate.status&&candidate.status!=='room') return false;
  if(typeof candidate.url!=='string'||!new RegExp(`^/${kind}/[^/?#]+/$`).test(candidate.url)||seen.has(candidate.url)) return false;
  seen.add(candidate.url);return true;
 }).sort((a,b)=>Number(b.city===place.city&&Boolean(place.city))-Number(a.city===place.city&&Boolean(place.city))||a.name.localeCompare(b.name,'en')).slice(0,limit);
}
