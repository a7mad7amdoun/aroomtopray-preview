// Step 1 of 2: list OSM mosques within 25 km of each airport in scope, nearest first.
// Run from site/: node scripts/masajid/candidates.mjs [IATA ...]
// Writes scripts/masajid/candidates.json. Nothing here is published: every masjid must then be
// confirmed by hand on its own website (or another public page) and recorded in confirmed.json.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { airports as us } from '../../src/data/us.mjs';
import { km } from './geo.mjs';

export const HUBS = ['LHR', 'LGW', 'CDG', 'AMS', 'FRA', 'MUC', 'YYZ', 'YVR', 'SYD', 'MEL'];
const US = us.filter((a) => a.country === 'United States').map((a) => a.iata);
const scope = process.argv.slice(2).length ? process.argv.slice(2) : [...US, ...HUBS];

const all = JSON.parse(readFileSync(new URL('../../src/data/airports.json', import.meta.url)));
// CANDIDATES_OUT lets two runs go in parallel (merge afterwards with merge-candidates.mjs).
const out = new URL(process.env.CANDIDATES_OUT || './candidates.json', import.meta.url);
const prev = existsSync(out) ? JSON.parse(readFileSync(out)) : {};
const ENDPOINT = 'https://overpass-api.de/api/interpreter';
const UA = 'aroomtopray-research/1.0 (+https://aroomtopray.com/about/)';

async function query(lat, lon) {
  const q = `[out:json][timeout:60];nwr(around:25000,${lat},${lon})["amenity"="place_of_worship"]["religion"="muslim"];out center tags;`;
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(q), signal: AbortSignal.timeout(90000) });
      if (r.ok) return (await r.json()).elements;
    } catch { /* timeout or network error: retry */ }
    await new Promise((s) => setTimeout(s, 20000 * (i + 1)));
  }
  return null; // rate-limited or down: skip this airport and re-run it later
}

for (const code of scope) {
  const a = all.find((x) => x.iata === code);
  if (!a) { console.warn(`${code}: not in airports.json`); continue; }
  const els = await query(a.lat, a.lon);
  if (!els) { console.warn(`${code}: Overpass failed, re-run later`); continue; }
  prev[code] = {
    airport: { lat: a.lat, lon: a.lon }, fetched: new Date().toISOString().slice(0, 10),
    places: els.map((e) => {
      const lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon, t = e.tags || {};
      const addr = [t['addr:housenumber'] && `${t['addr:housenumber']} ${t['addr:street'] || ''}`.trim() || t['addr:street'], t['addr:city'], t['addr:postcode']].filter(Boolean).join(', ');
      return { osm: `${e.type}/${e.id}`, name: t.name || t['name:en'] || null, lat, lon, km: km(a.lat, a.lon, lat, lon),
        website: t.website || t['contact:website'] || null, addr: addr || null, denomination: t.denomination || null };
    }).filter((p) => p.lat != null).sort((x, y) => x.km - y.km).slice(0, 15),
  };
  console.log(`${code}: ${els.length} OSM mosques within 25 km`);
  writeFileSync(out, JSON.stringify(prev, null, 1));
  await new Promise((s) => setTimeout(s, 3000));
}
