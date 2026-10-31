// Builds src/data/airports.json from the two research sources:
//   src/data/us.mjs     curated US top 31 (from airport-prayer-rooms.md, 13 Oct 2026)
//   src/data/world.json worldwide research (airport-prayer-rooms-world.json, 13 Oct 2026)
// US rows come from us.mjs; every other airport comes from world.json. Coordinates for all come from world.json.
import { readFileSync, writeFileSync } from 'node:fs';
import { airports as usRows } from '../src/data/us.mjs';

import { existsSync } from 'node:fs';
const read = (f) => JSON.parse(readFileSync(new URL(`../src/data/${f}`, import.meta.url), 'utf8'));
// world-patch.json holds later research rounds: full replacement records, matched by IATA code.
// world-patch*.json files hold later research rounds: replacement records (matched by IATA) and brand-new airports.
import { readdirSync } from 'node:fs';
const patchFiles = readdirSync(new URL('../src/data/', import.meta.url)).filter((f) => /^world-patch.*\.json$/.test(f)).sort();
const patch = patchFiles.flatMap((f) => read(f));
const patched = new Map(patch.map((r) => [r.iata, r]));
const base = read('world.json');
const baseCodes = new Set(base.map((r) => r.iata));
const world = [...base.map((r) => patched.get(r.iata) || r), ...[...patched.values()].filter((r) => !baseCodes.has(r.iata))];
const KAABA = [21.422487, 39.826206];
const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const bearing = ([la1, lo1], [la2, lo2]) => {
  const p1 = rad(la1), p2 = rad(la2), dl = rad(lo2 - lo1);
  return (deg(Math.atan2(Math.sin(dl) * Math.cos(p2), Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl))) + 360) % 360;
};
const distance = ([la1, lo1], [la2, lo2]) => {
  const p1 = rad(la1), p2 = rad(la2), a = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(rad(lo2 - lo1) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const cn = new Intl.DisplayNames(['en'], { type: 'region' });
const REGION = { 'North America': 'Americas', 'South America': 'Americas', Europe: 'Europe', 'Middle East': 'Middle East & Africa', Africa: 'Middle East & Africa', Asia: 'Asia & Oceania', Oceania: 'Asia & Oceania' };
// Research annotations in parentheses ("(snippet)", "(INFERENCE)") are for editors, not travellers.
const RESEARCHY = /snippet|unverified|secondary|herald|inference|page|older|per blog|aena|search|blog/i;
const clean = (v) => String(v || '').replace(/\s*\(([^)]*)\)/g, (m, inner) => (RESEARCHY.test(inner) ? '' : m)).replace(/^'|'$/g, '').trim();
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const paren = (v) => (String(v).match(/\(([^)]*)\)/) || [])[1];
const known = (v) => v && !/^(unknown|no)\b/i.test(v);

function worldSpace(s, checked) {
  const side = /^(mixed|both)/.test(s.side) ? 'both' : /^airside/.test(s.side) ? 'airside' : /^landside/.test(s.side) ? 'landside' : 'unknown';
  const wudu = /^yes/.test(s.wudu) ? 'yes' : /^partial/.test(s.wudu) ? 'partial' : /^no/.test(s.wudu) ? 'no' : 'unknown';
  // Separate washrooms alone don't mean a private prayer space for women.
  const women = /washroom/i.test(s.women) ? 'unknown' : /^yes/.test(s.women) ? (/partition/i.test(s.women) ? 'partition' : 'yes') : /^two semi|^no/.test(s.women) ? 'no' : 'unknown';
  const extras = [paren(s.wudu), paren(s.women)].filter((x) => x && x.length > 12 && !RESEARCHY.test(x)).map(cap);
  const hours = clean(s.hours);
  return {
    name: s.name, loc: clean(s.location) || 'Location not stated', side, wudu, women,
    hours: !hours || hours === 'unknown' ? 'Not stated' : cap(hours.replace(/^24\/7$|^24h$/, '24 hours')),
    type: cap(clean(s.type)) || 'Prayer room', src: s.source_url,
    verified: s.verified === 'verified' ? true : s.verified === 'unverified' ? false : s.verified.replace('verified-', ''),
    checked,
    ...(known(s.qibla_marker) ? { qibla_marker: cap(clean(s.qibla_marker)) } : {}),
    ...(known(s.jumuah) ? { jumuah: clean(s.jumuah) } : {}),
    ...(extras.length ? { extra: extras.join('. ') } : {}),
  };
}

// If we couldn't read the airport's site at all (blocked, JavaScript-only), we can't say "not listed".
// Wave 3c "not listed" airports checked without a site search (search budget ran out): don't assert absence yet.
const NO_SEARCH = new Set(['GIG', 'EZE', 'LIM', 'PTY']);
// In Muslim-majority places prayer rooms are usually taken for granted and absent from official sites, so silence
// there isn't evidence of no room: keep those "not checked" instead of "not listed".
const MM = new Set(['BD', 'ID', 'PK', 'SN', 'TN', 'MA', 'DZ', 'EG', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'JO', 'IQ', 'IR', 'TR', 'AZ', 'KZ', 'UZ', 'MV', 'SD', 'LY', 'MY', 'BN', 'BA', 'AL', 'XK']);
const MM_CITY = new Set(['KAN', 'ABV', 'ZNZ', 'CCJ']);
const unreadable = (w) => MM.has(w.country) || MM_CITY.has(w.iata) || NO_SEARCH.has(w.iata) || /\b40[35]\b|JavaScript|unreachable|returned no content|returned an error|error via r\.jina|GACA Taif/i.test(w.notes || '');
const byCode = Object.fromEntries(world.map((w) => [w.iata, w]));
const us = usRows.filter((a) => a.country === 'United States').map((a) => {
  const status = a.status === 'partial' ? (a.spaces.length ? 'seating' : 'planned') : a.status;
  return { ...a, status, region: 'Americas', checked: '2026-10-13', spaces: a.spaces.map(({ checked, ...s }) => ({ ...s, checked: checked || '2026-10-13' })) };
});
// Public cautions for listings that may have moved (from research notes, written for travellers).
const NOTE = {
  CLE: 'The Interfaith Center may have moved during the 2025 central checkpoint expansion. Ask at an information desk.',
  RDU: 'The airport removed its page for this room in a 2026 site redesign, so details may have changed.',
  BNE: 'The international terminal room is in a temporary location.',
};
const usCodes = new Set(us.map((a) => a.iata));
const intl = world.filter((w) => !usCodes.has(w.iata)).map((w) => {
  const spaces = w.spaces.map((s) => worldSpace(s, w.accessed));
  const seatingOnly = spaces.length && spaces.every((s) => /quiet seating/i.test(s.type));
  return {
    iata: w.iata, city: w.city, country: cn.of(w.country) || w.country, region: REGION[w.region] || w.region,
    status: w.research_status === 'not_researched' || (!spaces.length && unreadable(w)) ? 'pending' : !spaces.length ? 'none' : seatingOnly ? 'seating' : 'room',
    ...(w.feedback_url && w.feedback_url !== 'unknown' ? { feedback: w.feedback_url } : {}),
    checked: w.research_status === 'not_researched' || (!spaces.length && unreadable(w)) ? null : w.accessed,
    ...(NOTE[w.iata] ? { note: NOTE[w.iata] } : {}),
    spaces,
  };
});

const out = [...us, ...intl].map((a) => {
  const w = byCode[a.iata];
  if (!w) throw new Error(`No coordinates for ${a.iata}`);
  const name = w.name.replace(/^İstanbul Airport$/, 'Istanbul Airport');
  return { ...a, name, lat: +w.lat.toFixed(4), lon: +w.lon.toFixed(4), qibla: +bearing([w.lat, w.lon], KAABA).toFixed(1), km: Math.round(distance([w.lat, w.lon], KAABA)) };
}).sort((a, b) => a.iata.localeCompare(b.iata));

const dupes = out.map((a) => a.iata).filter((c, i, l) => l.indexOf(c) !== i);
if (dupes.length) throw new Error(`Duplicate airports: ${dupes}`);
writeFileSync(new URL('../src/data/airports.json', import.meta.url), JSON.stringify(out, null, 1));
const count = (k) => out.filter((a) => a.status === k).length;
console.log(`airports.json: ${out.length} airports (room ${count('room')}, seating ${count('seating')}, planned ${count('planned')}, none ${count('none')}, pending ${count('pending')})`);
const unis = [...read('universities.json'), ...read('universities-2.json')].map((u) => `uni-${u.slug}`);
const hosps = [...read('hospitals-uk.json'), ...read('hospitals-na.json')].map((h) => `hos-${h.slug}`);
writeFileSync(new URL('../functions/api/_codes.json', import.meta.url), JSON.stringify([...out.map((a) => a.iata.toLowerCase()), ...unis, ...hosps]));
