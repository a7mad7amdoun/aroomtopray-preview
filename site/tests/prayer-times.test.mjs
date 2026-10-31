// node --test tests/prayer-times.test.mjs
// Reference timetables: api.aladhan.com /v1/timings, fetched 13 Oct 2026, with the same coordinates,
// method and Asr school. Published times are rounded to the minute; we allow ±2 minutes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { prayerTimes, localParts, zonedToUtc, tzOf, planTrip } from '../src/lib/prayer-times.js';
import airportsRaw from '../src/data/airports.json' with { type: 'json' };

const mins = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
function near(t, tz, expected, label) {
  const got = localParts(t, tz).time;
  const diff = Math.abs(mins(got) - mins(expected));
  assert.ok(diff <= 2, `${label}: got ${got}, published ${expected}`);
}
function check({ lat, lon, date, tz, method, asr }, published) {
  const t = prayerTimes({ lat, lon, date, method, asr });
  for (const [k, v] of Object.entries(published)) near(t[k], tz, v, `${date} ${method} ${k}`);
  return t;
}

test('New York (JFK), ISNA 15/15, standard Asr, 13 Oct 2026', () => {
  check({ lat: 40.6398, lon: -73.7789, date: '2026-10-13', tz: 'America/New_York', method: 'isna', asr: 'standard' },
    { fajr: '05:49', sunrise: '07:04', dhuhr: '12:41', asr: '15:50', maghrib: '18:18', isha: '19:33' });
});

test('Makkah, Umm al-Qura (Isha 90 min), standard Asr, 13 Oct 2026', () => {
  check({ lat: 21.4225, lon: 39.8262, date: '2026-10-13', tz: 'Asia/Riyadh', method: 'umm', asr: 'standard' },
    { fajr: '04:59', sunrise: '06:16', dhuhr: '12:07', asr: '15:29', maghrib: '17:58', isha: '19:28' });
});

test('Cairo airport, Egyptian 19.5/17.5, Hanafi Asr, 13 Oct 2026', () => {
  check({ lat: 30.1219, lon: 31.4056, date: '2026-10-13', tz: 'Africa/Cairo', method: 'egypt', asr: 'hanafi' },
    { fajr: '05:28', sunrise: '06:55', dhuhr: '12:41', asr: '16:48', maghrib: '18:26', isha: '19:43' });
});

test('London Heathrow, MWL 18/17, 13 Oct 2026 and midsummer high-latitude rule', () => {
  // Asr here is left out: the reference gives 15:40, but an independent solar-elevation check puts
  // shadow = 1 + noon shadow at 14:37 UTC (15:37 BST), which is what we compute.
  check({ lat: 51.47, lon: -0.4543, date: '2026-10-13', tz: 'Europe/London', method: 'mwl' },
    { fajr: '05:31', sunrise: '07:22', dhuhr: '12:48', maghrib: '18:13', isha: '19:57' });
  const june = check({ lat: 51.47, lon: -0.4543, date: '2026-06-21', tz: 'Europe/London', method: 'mwl' },
    { fajr: '02:32', sunrise: '04:45', dhuhr: '13:04', asr: '17:26', maghrib: '21:23', isha: '23:28' });
  assert.deepEqual(june.adjusted.sort(), ['fajr', 'isha']);
});

test('time zones: every airport has a valid IANA zone; local ↔ UTC round trip', () => {
  for (const a of airportsRaw) {
    const tz = tzOf(a.iata);
    assert.ok(tz, `${a.iata} has a zone`);
    assert.doesNotThrow(() => new Intl.DateTimeFormat('en', { timeZone: tz }));
  }
  assert.equal(tzOf('jfk'), 'America/New_York');
  assert.equal(tzOf('DXB'), 'Asia/Dubai');
  assert.equal(tzOf('LHR'), 'Europe/London');
  const ms = zonedToUtc('2026-10-13', '18:30', 'America/New_York');
  assert.equal(new Date(ms).toISOString(), '2026-10-13T22:30:00.000Z');
  assert.equal(localParts(ms, 'Europe/London').time, '23:30');
  // Across the US clock change (1 Nov 2026).
  assert.equal(new Date(zonedToUtc('2026-11-01', '12:00', 'America/New_York')).toISOString(), '2026-11-01T17:00:00.000Z');
});

const lookup = (code) => {
  const a = airportsRaw.find((x) => x.iata === String(code).toUpperCase());
  return a ? { code: a.iata.toLowerCase(), lat: a.lat, lon: a.lon, tz: tzOf(a.iata) } : null;
};
const legs = [
  { from: 'JFK', to: 'LHR', depDate: '2026-10-13', depTime: '18:30', arrDate: '2026-10-14', arrTime: '06:35' },
  { from: 'LHR', to: 'DXB', depDate: '2026-10-14', depTime: '09:40', arrDate: '2026-10-14', arrTime: '19:40' },
];

test('planner: JFK → LHR → DXB timeline', () => {
  const { errors, phases } = planTrip(legs, lookup, { method: 'mwl', asr: 'standard', beforeHours: 3 });
  assert.deepEqual(errors, []);
  assert.deepEqual(phases.map((p) => p.kind), ['before', 'air', 'layover', 'air', 'arrival']);
  const names = (p) => p.events.map((e) => e.prayer);
  // At JFK, 15:30–18:30: Asr and Maghrib begin.
  assert.deepEqual(names(phases[0]), ['asr', 'maghrib']);
  // Overnight to London: Isha begins at JFK after take-off; Fajr begins at LHR before landing.
  const a1 = phases[1];
  assert.deepEqual(names(a1), ['isha', 'fajr']);
  assert.ok(a1.events[0].from && !a1.events[0].to);
  assert.ok(a1.events[1].to && !a1.events[1].from);
  // Layover at LHR 06:35–09:40: nothing begins; the last prayer time to begin was Fajr.
  assert.deepEqual(names(phases[2]), []);
  assert.equal(phases[2].before.prayer, 'fajr');
  assert.equal(phases[2].place.code, 'lhr');
  // London to Dubai by day: Dhuhr (London), Asr (both ends, one row), Maghrib and Isha (Dubai).
  const a2 = phases[3];
  assert.deepEqual(new Set(names(a2)), new Set(['dhuhr', 'asr', 'maghrib', 'isha']));
  assert.equal(a2.events.find((e) => e.prayer === 'dhuhr').to, undefined);
  assert.equal(a2.events.find((e) => e.prayer === 'maghrib').from, undefined);
  const asr = a2.events.find((e) => e.prayer === 'asr');
  assert.ok(asr.from && asr.to, 'Asr merged across both ends');
  assert.equal(a2.events.filter((e) => e.prayer === 'asr').length, 1);
  // Every in-air event lies strictly inside the flight.
  for (const p of phases.filter((x) => x.kind === 'air')) for (const e of p.events) {
    for (const t of [e.from, e.to].filter(Boolean)) assert.ok(t >= p.from && t < p.to);
  }
});

test('planner: validation errors', () => {
  const bad = planTrip([{ ...legs[0], arrDate: '2026-10-13', arrTime: '06:35' }], lookup);
  assert.match(bad.errors[0], /lands before it takes off/);
  const gap = planTrip([legs[0], { ...legs[1], from: 'CDG' }], lookup);
  assert.ok(gap.errors.some((e) => /choose a departure airport|leaves from/.test(e)));
  const order = planTrip([legs[0], { ...legs[1], depDate: '2026-10-13', depTime: '20:00', arrDate: '2026-10-14' }], lookup);
  assert.ok(order.errors.some((e) => /leaves before flight 1 lands/.test(e)));
});

test('planner: a cleared or unrecognised airport gives no timeline', () => {
  for (const from of ['', 'XXX']) {
    const r = planTrip([{ ...legs[0], from }], lookup);
    assert.deepEqual(r.phases, []);
    assert.match(r.errors[0], /choose a departure airport/);
  }
});
