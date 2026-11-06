// Pure map helpers. Coordinates describe a facility, never an indoor room or entrance.
import { boundedMapTransform } from './airport-map-state.js';

export function validMapLocation(place) {
  return Number.isFinite(place.lat) && Number.isFinite(place.lon) && Math.abs(place.lat) <= 85.05 && Math.abs(place.lon) <= 180;
}
export function mapStatus(place, kind) {
  if (kind === 'airports') return place.status;
  return place.hold ? 'pending' : place.spaces?.length ? 'room' : 'none';
}
export function sourceKind(value) {
  return value === true ? 'official' : ['archive', 'snippet', 'indirect'].includes(value) ? 'indirect' : 'external';
}
export function safeSourceUrl(value) {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : ''; } catch { return ''; }
}
export function mapLinks(place) {
  if (!validMapLocation(place)) return null;
  const { lat, lon } = place;
  const search = new URL('https://www.google.com/maps/search/');
  search.search = new URLSearchParams({ api: '1', query: [place.name || place.fullName, place.city, place.country].filter(Boolean).join(', ') });
  const osm = new URL('https://www.openstreetmap.org/');
  osm.search = new URLSearchParams({ mlat: String(lat), mlon: String(lon) });
  osm.hash = `map=15/${lat}/${lon}`;
  // A small area around the existing facility coordinate; no route or entrance is inferred.
  const dy = .012, dx = Math.min(.1, dy * 1.7 / Math.max(.1, Math.cos(lat * Math.PI / 180)));
  const bbox = [Math.max(-180,lon-dx),Math.max(-85.05,lat-dy),Math.min(180,lon+dx),Math.min(85.05,lat+dy)].map(n=>+n.toFixed(6));
  const embed = new URL('https://www.openstreetmap.org/export/embed.html');
  embed.search = new URLSearchParams({ bbox: bbox.join(','), layer: 'mapnik', marker: `${lat},${lon}` });
  return { google: search.href, osm: osm.href, embed: embed.href };
}
export function mapCoverage(points) {
  return { places: points.length, countries: new Set(points.map(p=>p.countryCode)).size, rooms: points.reduce((n,p)=>n+(p.roomDetails?.length || 0),0) };
}
export function fitMapPoints(points, width, height, padding = 70) {
  const valid = points.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
  if (!valid.length) return boundedMapTransform({}, width, height);
  const xs=valid.map(p=>p.x),ys=valid.map(p=>p.y);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const k=Math.min((width-2*padding)/Math.max(60,maxX-minX),(height-2*padding)/Math.max(40,maxY-minY));
  return boundedMapTransform({ k, x:width/2-(minX+maxX)/2*k, y:height/2-(minY+maxY)/2*k },width,height);
}
// Screen-space buckets keep dense locations selectable without pretending that
// nearby institutions are one place. Membership always refers to actual records.
export function clusterMapPoints(points, scale, selectedCode = '', cellPixels = 44) {
  const cell=cellPixels/Math.max(.01,scale),buckets=new Map();
  for(const point of points) {
    const key=point.code===selectedCode?`selected:${point.code}`:`${Math.floor(point.x/cell)}:${Math.floor(point.y/cell)}`;
    if(!buckets.has(key))buckets.set(key,[]);
    buckets.get(key).push(point);
  }
  return [...buckets.entries()].map(([key,members])=>({key,members,x:members.reduce((n,p)=>n+p.x,0)/members.length,y:members.reduce((n,p)=>n+p.y,0)/members.length}));
}
