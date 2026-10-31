// Hospital prayer rooms: adapter from hospitals-uk.json and hospitals-na.json (research, 13 Oct 2026).
import uk from '../data/hospitals-uk.json';
import na from '../data/hospitals-na.json';
import { visitInsights } from '../data/visit-insights.js';

const KAABA = [21.422487, 39.826206];
const rad = (d) => (d * Math.PI) / 180;
const bearing = ([la1, lo1], [la2, lo2]) => {
  const p1 = rad(la1), p2 = rad(la2), dl = rad(lo2 - lo1);
  return ((Math.atan2(Math.sin(dl) * Math.cos(p2), Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl)) * 180) / Math.PI + 360) % 360;
};
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const known = (v) => v && !/^unknown/i.test(v);

export const H_COUNTRIES = ['United Kingdom', 'United States', 'Canada'];
// Held back until a fuller official source is read (researchers' recommendation): built but noindex, marked "Checking".
export const HOLD = new Set(['heartlands-hospital', 'st-jamess-university-hospital-leeds', 'university-hospital-coventry', 'university-hospital-of-wales', 'queen-elizabeth-university-hospital-glasgow',
  'corewell-health-dearborn', 'montreal-general', 'humber-river', 'parkland-memorial', 'ui-health', 'inova-fairfax', 'hennepin-healthcare', 'nyu-langone-tisch']);

// Editorial overrides after review (13 Oct 2026). Cautions sit beside the affected details; no raw research notes.
const FIX = {
  'royal-oldham-hospital': { 0: { caution: 'The trust’s May 2025 notice gives the new prayer room on Sheepfoot Lane; older directions to D Block differ. Ask staff if unsure.' } },
  'royal-london-hospital': { 0: { caution: 'The women’s prayer space was moved to the Yarrow Room (2nd floor) for Ramadan 2026. Its current location is unconfirmed.' } },
  'university-hospital-coventry': { 0: { jumuah: null, caution: 'Published Jumuʿah times conflict. Confirm with the chaplaincy.' } },
  'bradford-royal-infirmary': { 1: { women: 'unknown', caution: 'Details for the main and staff rooms come from two sources and may describe different rooms. Ask the SPaRC team.' } },
  'queen-elizabeth-hospital-birmingham': { 0: { women: 'unknown', caution: 'The hospital lists separate male and female washing facilities; it does not say whether there are separate prayer spaces.' } },
  'northern-general-hospital-sheffield': { all: { caution: 'Source: an archived hospital page from 11 October 2024; the live page was unavailable when we checked. Current locations are unconfirmed.' } },
  'whipps-cross-hospital': { 0: { caution: 'The published directions involve stairs. A step-free route is not confirmed; ask staff.' } },
};
// Published lines only: drop pager numbers and prayer-request text shortcodes.
const CHAP = {
  'toronto-general': 'Ask a staff member or volunteer to contact a spiritual care practitioner. Non-urgent: administrative line 416 597 3014.',
  'houston-methodist-tmc': 'Call 713.441.2381 (Mon–Fri 8am–4:30pm); after hours call 713.441.2201 and ask for the chaplain on call. A chaplain is in house 24 hours.',
};

export const hospitals = [...uk, ...na].map((h) => {
  const spaces = h.spaces.map((s, i) => ({
    name: s.name,
    loc: known(s.location) ? s.location : 'Location not stated',
    access: known(s.access) ? cap(s.access) : 'Not stated',
    hours: known(s.hours) ? cap(s.hours) : 'Not stated',
    wudu: s.wudu === 'yes' ? 'yes' : s.wudu === 'no' ? 'no' : 'unknown',
    women: s.women === 'separate' ? 'yes' : ['partition', 'no'].includes(s.women) ? s.women : 'unknown',
    type: cap(s.type),
    chapel: /chapel/i.test(s.type),
    jumuah: known(s.jumuah) ? s.jumuah : null,
    extra: /tayammum/i.test(s.wudu) ? 'Tayammum kits are available, according to the hospital.' : null,
    src: s.source_url,
    verified: s.verified === 'official-read' ? true : s.verified === 'official-indirect' ? 'indirect' : false,
    checked: s.accessed,
    ...(FIX[h.slug]?.all || {}),
    ...(FIX[h.slug]?.[i] || {}),
  }));
  const all = (k, v) => spaces.length > 0 && spaces.every((s) => s[k] === v);
  const wudu = spaces.some((s) => s.wudu === 'yes') ? 'yes' : all('wudu', 'no') ? 'no' : 'unknown';
  const women = spaces.some((s) => s.women === 'yes') ? 'yes' : spaces.some((s) => s.women === 'partition') ? 'partition' : 'unknown';
  const newerChaplaincy = h.slug === 'kings-college-hospital' && visitInsights.find(i => i.id === 'kings-muslim-support');
  const chaplaincy = h.chaplaincy && { ...h.chaplaincy, how_to_request: CHAP[h.slug] || h.chaplaincy.how_to_request, ...(newerChaplaincy ? { muslim_chaplain: 'yes', source_url: newerChaplaincy.source.url, how_to_request: newerChaplaincy.copy.en.facts.join(' ') + ' ' + newerChaplaincy.copy.en.caveat } : {}) };
  return {
    ...h, chaplaincy, spaces, wudu, women,
    short: h.name.replace(/\s*\([^)]*\)\s*$/, ''),
    group: h.trust || h.system || '',
    url: `/hospitals/${h.slug}/`,
    hold: HOLD.has(h.slug),
    chaplain: chaplaincy?.muslim_chaplain === 'yes',
    live: !HOLD.has(h.slug),
    rooms: spaces.map((s) => ({ wudu: s.wudu === 'yes', women: s.women === 'yes' || s.women === 'partition', jumuah: !!s.jumuah, musalla: /musalla/i.test(s.type) })),
    qibla: +bearing([h.lat, h.lon], KAABA).toFixed(1),
    checked: spaces.map((s) => s.checked).sort().at(-1),
  };
}).sort((a, b) => H_COUNTRIES.indexOf(a.country) - H_COUNTRIES.indexOf(b.country) || a.hold - b.hold || a.name.localeCompare(b.name));
export const holdPaths = hospitals.filter((h) => h.hold).map((h) => h.url);

export function hospAsks(h) {
  const q = [];
  if (h.wudu !== 'yes') q.push({ label: 'Washing facilities (not stated)', ask: 'washing facilities near the prayer room that patients, visitors and staff can use', confirm: true });
  if (h.women === 'unknown') q.push({ label: 'A private area for women (not stated)', ask: 'a partition or second room so women can pray privately', confirm: true });
  if (!h.chaplain) q.push({ label: 'Muslim chaplaincy (not stated)', ask: 'a Muslim chaplain or volunteer who patients and families can ask for', confirm: true });
  return q;
}
export function hospMessage(h, q) {
  const list = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}` : xs[0]);
  return ['Hello,', '', `I’m asking about prayer and spiritual care at ${h.name}.`,
    `Could you confirm whether there are ${list(q.map((x) => x.ask))}? If so, please list them on your website so patients and families can find them. If not, please consider providing them.`,
    '', 'Patients, families and staff of many faiths pray while they are in hospital. Thank you for the care you provide.'].join('\n');
}
