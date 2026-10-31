// University prayer rooms: adapter from src/data/universities.json (research, 13 Oct 2026) to the site's shapes.
import raw1 from '../data/universities.json';
import raw2 from '../data/universities-2.json';
const raw = [...raw1, ...raw2];

const KAABA = [21.422487, 39.826206];
const rad = (d) => (d * Math.PI) / 180;
const bearing = ([la1, lo1], [la2, lo2]) => {
  const p1 = rad(la1), p2 = rad(la2), dl = rad(lo2 - lo1);
  return ((Math.atan2(Math.sin(dl) * Math.cos(p2), Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl)) * 180) / Math.PI + 360) % 360;
};
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const known = (v) => v && !/^unknown$/i.test(v);

export const COUNTRIES = ['United Kingdom', 'United States', 'Canada', 'Australia'];
export const UL = {
  verified: { true: ['Official university page', 'b-ok'], indirect: ['Official source, indirect copy', 'b-ok'], false: ['Not from the university', 'b-unv'] },
};

// Editorial overrides after review (13 Oct 2026): conflicting or stale details are withheld, with a caution beside them.
const UNCONFIRMED = 'Current details unconfirmed: check with the university before visiting.';
const FIX = {
  'new-york-university': { 1: { jumuah: null, caution: 'Jumuʿah times are not confirmed: published sources disagree. Check the Islamic Center’s latest notice.' } },
  ucla: { 0: { loc: 'Bruin Reflection Space (published sources disagree on where it is)', caution: UNCONFIRMED } },
  'university-of-waterloo': { 0: { hours: 'Not confirmed (sources disagree)' } },
  'coventry-university': { 1: { hours: 'Not confirmed (sources disagree)' } },
  'george-mason-university': { 0: { jumuah: null, caution: 'The last published Jumuʿah times were for spring 2025. Current times are not confirmed; check with the MSA.' } },
  'university-of-manchester': { 1: { jumuah: 'Weekly in term time; current times not confirmed' } },
  'wayne-state-university': { 0: { hours: 'Not confirmed (last published in 2022)' } },
  'concordia-university': { 1: { loc: 'MSA prayer space reported; current location unconfirmed. Contact the MSA.', caution: UNCONFIRMED } },
};
const visitorsAllowed = (a) => /visitors|anyone|members of the public|open to all/i.test(a) && !/not open|not available|only/i.test(a);

export const universities = raw.map((u) => {
  const spaces = u.spaces.map((s, i) => ({
    name: s.name,
    loc: s.location || 'Location not stated',
    access: known(s.access) ? cap(s.access) : 'Not stated',
    hours: known(s.hours) ? cap(s.hours) : 'Not stated',
    wudu: ['yes', 'no'].includes(s.wudu) ? s.wudu : 'unknown',
    women: s.women === 'separate' ? 'yes' : ['partition', 'no'].includes(s.women) ? s.women : 'unknown',
    type: cap(s.type),
    jumuah: known(s.jumuah) ? s.jumuah : null,
    src: s.source_url,
    verified: s.verified === 'official-read' ? true : s.verified === 'official-indirect' ? 'indirect' : false,
    checked: s.accessed,
    visitors: visitorsAllowed(s.access || ''),
    ...(FIX[u.slug]?.[i] || {}),
  }));
  const all = (k, v) => spaces.length > 0 && spaces.every((s) => s[k] === v);
  const wudu = spaces.some((s) => s.wudu === 'yes') ? 'yes' : all('wudu', 'no') ? 'no' : 'unknown';
  const women = spaces.some((s) => s.women === 'yes') ? 'yes' : spaces.some((s) => s.women === 'partition') ? 'partition' : all('women', 'no') ? 'no' : 'unknown';
  const short = u.name.replace(/\s*\([^)]*\)\s*$/, '').replace(/^University of /, '').replace(/ University$| University of London$/, '');
  return {
    ...u, spaces, wudu, women, short,
    url: `/universities/${u.slug}/`,
    jumuah: spaces.some((s) => s.jumuah),
    thin: spaces.length === 1,
    // Research flagged conflicting or stale details somewhere on this university's pages.
    conflict: /conflict|differ|clash|stale|404|moved|no year|out of date|disagree/i.test(u.notes || ''),
    // Room-level flags, so combined filters match within one space.
    rooms: spaces.map((s) => ({ wudu: s.wudu === 'yes', women: s.women === 'yes' || s.women === 'partition', jumuah: !!s.jumuah, open: s.visitors })),
    qibla: +bearing([u.lat, u.lon], KAABA).toFixed(1),
    checked: spaces.map((s) => s.checked).sort().at(-1),
  };
}).sort((a, b) => COUNTRIES.indexOf(a.country) - COUNTRIES.indexOf(b.country) || a.name.localeCompare(b.name));
export const bySlug = Object.fromEntries(universities.map((u) => [u.slug, u]));

export function uniAsks(u) {
  const q = [];
  if (u.wudu === 'unknown') q.push({ label: 'Washing facilities (not stated)', ask: 'washing facilities near the prayer room that anyone can use', confirm: true });
  else if (u.wudu === 'no') q.push({ label: 'Washing facilities', ask: 'washing facilities near the prayer room that anyone can use' });
  if (u.women === 'unknown') q.push({ label: 'A private area for women (not stated)', ask: 'a partition or second room so women can pray privately', confirm: true });
  else if (u.women === 'no') q.push({ label: 'A private area for women', ask: 'a partition or second room so women can pray privately' });
  return q;
}
export function uniMessage(u, q) {
  const list = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}` : xs[0]);
  const confirm = q.filter((x) => x.confirm).map((x) => x.ask);
  const request = q.filter((x) => !x.confirm).map((x) => x.ask);
  const parts = ['Hello,', '', `I’m asking about prayer facilities at ${u.name}.`];
  if (confirm.length) parts.push(`Could you confirm whether there are ${list(confirm)}? If so, please list them on the university’s website. If not, please consider providing them.`);
  if (request.length) parts.push(`I would like to suggest ${list(request)}.`);
  parts.push('', 'Students and staff of many faiths pray during the day. Spaces like these help them do so quietly and privately.', '', 'Thank you for considering it.');
  return parts.join('\n');
}
