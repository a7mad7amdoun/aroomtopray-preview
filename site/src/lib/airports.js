// Airport data plus the derived fields and labels every page uses.
import raw from '../data/airports.json';
import halal1 from '../data/halal.json';
import halal2 from '../data/halal-2.json';
// Round 2 replaces round-1 records by IATA; airports round 2 couldn't check get no halal block at all.
const halalRaw = [...new Map([...halal1, ...halal2].map((h) => [h.iata, h])).values()].filter((h) => !/^Not checked/i.test(h.airport_note || ''));
import { existsSync } from 'node:fs';

export const SITE = 'https://aroomtopray.com';
export const REGIONS = ['Americas', 'Europe', 'Middle East & Africa', 'Asia & Oceania'];

const DIR16 = ['north', 'north-north-east', 'north-east', 'east-north-east', 'east', 'east-south-east', 'south-east', 'south-south-east', 'south', 'south-south-west', 'south-west', 'west-south-west', 'west', 'west-north-west', 'north-west', 'north-north-west'];
export const dirName = (d) => DIR16[Math.round(d / 22.5) % 16];
export const fmtDate = (d) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null);
export const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };

export const L = {
  status: { room: ['Prayer room listed', 'p-yes'], seating: ['Quiet seating only', 'p-part'], planned: ['Room planned', 'p-part'], none: ['Not listed', 'p-no'], pending: ['Not checked yet', 'p-unk'] },
  wudu: { yes: ['Wuḍūʾ area', 'p-yes'], partial: ['In some rooms', 'p-part'], no: ['No wuḍūʾ area', 'p-no'], unknown: ['Not stated', 'p-unk'] },
  women: { yes: ['Separate space', 'p-yes'], partition: ['Partition', 'p-part'], no: ['Shared only', 'p-no'], unknown: ['Not stated', 'p-unk'] },
  side: { airside: 'After security', landside: 'Before security', both: 'Before and after security', unknown: 'Not stated' },
  verified: { true: ['Official airport page', 'b-ok'], archive: ['Official page, archived copy', 'b-ok'], snippet: ['Official page, search excerpt', 'b-ok'], false: ['Not from the airport', 'b-unv'] },
};

const short = (n) => n.replace(/ International Airport$| Intercontinental Airport$| Airport$/i, '').replace(/ International$/i, '');

export const airports = raw.map((a) => {
  const sp = a.spaces;
  // "No" only when every listing says no; otherwise an unknown listing could hide a facility.
  const all = (k, v) => sp.length > 0 && sp.every((s) => s[k] === v);
  const wudu = sp.some((s) => s.wudu === 'yes') ? 'yes' : sp.some((s) => s.wudu === 'partial') ? 'partial' : all('wudu', 'no') ? 'no' : 'unknown';
  const women = sp.some((s) => s.women === 'yes') ? 'yes' : sp.some((s) => s.women === 'partition') ? 'partition' : all('women', 'no') ? 'no' : 'unknown';
  const code = a.iata.toLowerCase();
  return {
    ...a, code, wudu, women, short: short(a.name),
    url: `/airports/${code}/`,
    art: existsSync(new URL(`../../public/art/${code}.webp`, import.meta.url)) ? `/art/${code}.webp` : null,
    checkedFmt: fmtDate(a.checked),
    // Room-level flags, so filters match within one room (an airside room AND wuḍūʾ in that same room).
    rooms: sp.map((s) => ({
      airside: s.side === 'airside' || s.side === 'both',
      wudu: s.wudu === 'yes' || s.wudu === 'partial',
      women: s.women === 'yes' || s.women === 'partition',
      h24: /24 hours|24\/7|always open|day and night|any time/i.test(s.hours),
    })),
  };
});
export const byCode = Object.fromEntries(airports.map((a) => [a.code, a]));
export const checked = airports.filter((a) => a.status !== 'pending');

// Questions for the airport. Unknown is asked about, never asserted as missing.
export function asks(a) {
  if (a.status === 'pending') return [];
  const q = [];
  if (a.status !== 'room') q.push({ label: 'A prayer or quiet room', ask: 'a quiet multi-faith room, ideally after security' });
  const wash = a.status === 'room' ? 'washing facilities near the prayer room that anyone can use' : 'washing facilities that anyone can use';
  if (a.wudu === 'unknown') q.push({ label: 'Washing facilities (not stated)', ask: wash, confirm: true });
  else if (a.wudu === 'no') q.push({ label: 'Washing facilities', ask: wash });
  if (a.women === 'unknown') q.push({ label: 'A private area for women (not stated)', ask: 'a partition or second room so women can pray privately', confirm: true });
  else if (a.women === 'no') q.push({ label: 'A private area for women', ask: 'a partition or second room so women can pray privately' });
  return q;
}
export function message(a, q) {
  const list = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}` : xs[0]);
  const confirm = q.filter((x) => x.confirm).map((x) => x.ask);
  const request = q.filter((x) => !x.confirm).map((x) => x.ask);
  const parts = [`Hello,`, ``, `I travel through ${a.name}.`];
  if (confirm.length) parts.push(`Could you confirm whether there are ${list(confirm)}? If so, please publish where they are. If not, please consider providing them.`);
  if (request.length) parts.push(`I would like to suggest ${list(request)}.`);
  parts.push(``, `Travellers and staff of many faiths pray during their journey. A space like this helps them do so quietly and privately, and it is open to anyone.`, ``, `Thank you for considering it.`);
  return parts.join('\n');
}

// Halal food. We report what each source says; never a bare "halal" badge.
const SRC = { "official airport dining page": 'the airport', "outlet's own site": 'the outlet', 'certifier list': 'the certifier', news: 'a news report', 'review site': 'a review site' };
export const halal = Object.fromEntries(halalRaw.map((h) => [h.iata.toLowerCase(), h]));
export function halalClaim(o) {
  if (o.claim) return o.claim;
  const by = SRC[o.source_type] || 'a source';
  const By = by[0].toUpperCase() + by.slice(1);
  if (o.certifier && !/^not /i.test(o.certifier)) return o.source_type === 'certifier list' ? `${o.certifier} lists this outlet as certified.` : `${By} says it is certified by ${o.certifier}.`;
  if (o.verified === 'unverified') return `Reported by ${by}. We haven’t independently verified this claim.`;
  // Quote the source's own words rather than paraphrase them.
  // Use the longest quoted phrase that mentions halal, so fragments between quotes are never picked.
  const quotes = [...(o.notes || '').matchAll(/'([^']{8,200})'/g)].map((m) => m[1]).filter((t) => /halal/i.test(t) && !/says:|^\s*and\b/i.test(t));
  const q = quotes.sort((a, b) => b.length - a.length)[0];
  if (q) return `${By} says: “${q}”. This source doesn’t name a certifier.`;
  return `${By} lists this outlet with halal options. The items covered aren’t specified, and no certifier is named.`;
}
export const halalPolicy = (h) => /^Muslim-majority/i.test(h.airport_note || '');
export const halalNone = (h) => (halalPolicy(h)
  ? 'We haven’t verified outlet-specific halal claims here. Ask the outlet about your order.'
  : 'We haven’t found an outlet with a halal claim on the airport’s website or a certifier’s list.');
