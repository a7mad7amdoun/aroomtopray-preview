// Step 2 of 2: join the hand-confirmed masajid (confirmed.json) with their OSM coordinates
// (candidates.json) and write src/data/masajid-near.json for the airport pages.
// Run from site/: node scripts/masajid/build.mjs
// Rules: only entries confirmed on a public page are published (verified: true). Distance is the
// straight-line distance from the airport's coordinates, never a drive time. Jumuʿah times only
// when the masjid's own page publishes them, with the date read; otherwise null.
import { readFileSync, writeFileSync } from 'node:fs';
import { km } from './geo.mjs';

const cand = JSON.parse(readFileSync(new URL('./candidates.json', import.meta.url)));
const conf = JSON.parse(readFileSync(new URL('./confirmed.json', import.meta.url)));
const out = {};
let n = 0;
for (const [code, list] of Object.entries(conf)) {
  if (code.startsWith('_')) continue;
  const c = cand[code];
  if (!c) throw new Error(`${code}: no candidates; run candidates.mjs ${code}`);
  const rows = list.filter((m) => m.verified === true).map((m) => {
    const p = c.places.find((x) => x.osm === m.osm);
    const lat = m.lat ?? p?.lat, lon = m.lon ?? p?.lon;
    if (lat == null) throw new Error(`${code} ${m.name}: no coordinates (${m.osm})`);
    if (!m.src || !m.checked || !m.address) throw new Error(`${code} ${m.name}: src, address and checked are required`);
    if (m.jumuah && !m.jumuah_read) throw new Error(`${code} ${m.name}: jumuah needs jumuah_read`);
    return { name: m.name, address: m.address, lat, lon, km: km(c.airport.lat, c.airport.lon, lat, lon), distance_basis: 'straight-line',
      src: m.src, osm: m.osm || null, jumuah: m.jumuah || null, jumuah_src: m.jumuah ? (m.jumuah_src || m.src) : null, jumuah_read: m.jumuah ? m.jumuah_read : null,
      ...(m.caution ? { caution: m.caution } : {}), verified: true, checked: m.checked };
  }).sort((a, b) => a.km - b.km).slice(0, 3);
  if (rows.length) { out[code] = rows; n += rows.length; }
}
writeFileSync(new URL('../../src/data/masajid-near.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log(`masajid-near.json: ${Object.keys(out).length} airports, ${n} masajid`);
