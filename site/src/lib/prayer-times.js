// Prayer-time estimates and the layover planner's timeline. Dependency-free; runs in the browser and in node --test.
// Sun position and the time-of-angle formulas follow the widely used PrayTimes.org method
// (declination and equation of time from the USNO low-precision solar formulas).

export const METHODS = {
  mwl: { name: 'Muslim World League', fajr: 18, isha: 17, note: 'Fajr 18°, ʿIshāʾ 17°' },
  isna: { name: 'ISNA (North America)', fajr: 15, isha: 15, note: 'Fajr 15°, ʿIshāʾ 15°' },
  umm: { name: 'Umm al-Qurā (Makkah)', fajr: 18.5, ishaMin: 90, note: 'Fajr 18.5°, ʿIshāʾ 90 minutes after Maghrib' },
  egypt: { name: 'Egyptian General Authority', fajr: 19.5, isha: 17.5, note: 'Fajr 19.5°, ʿIshāʾ 17.5°' },
};
export const ASR = {
  standard: { name: 'Standard (Shāfiʿī, Mālikī, Ḥanbalī)', factor: 1, note: 'shadow length 1' },
  hanafi: { name: 'Ḥanafī', factor: 2, note: 'shadow length 2' },
};
export const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
export const PRAYER_NAMES = { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'ʿAṣr', maghrib: 'Maghrib', isha: 'ʿIshāʾ' };

// IATA → IANA time zone for every airport in airports.json. Taken from the mwgg/Airports dataset
// (github.com/mwgg/Airports) and cross-checked against OpenFlights airports.dat: both agree on the
// UTC offset for every airport in January and July 2026, and each zone is within 2.6 hours of the
// airport's solar time. Format: "Zone CODE CODE ...".
const TZ_GROUPS = [
  "Africa/Accra ACC",
  "Africa/Addis_Ababa ADD",
  "Africa/Algiers ALG ORN",
  "Africa/Cairo CAI HBE HRG LXR SSH",
  "Africa/Casablanca AGA CMN FEZ RAK TNG",
  "Africa/Dakar DSS",
  "Africa/Dar_es_Salaam DAR ZNZ",
  "Africa/Johannesburg CPT DUR JNB",
  "Africa/Kampala EBB",
  "Africa/Khartoum KRT",
  "Africa/Kigali KGL",
  "Africa/Lagos ABV KAN LOS",
  "Africa/Nairobi MBA NBO",
  "Africa/Tripoli MJI",
  "Africa/Tunis DJE NBE TUN",
  "America/Anchorage ANC",
  "America/Argentina/Buenos_Aires EZE",
  "America/Bogota BOG",
  "America/Cancun CUN",
  "America/Chicago AUS BHM BNA DAL DFW HOU IAH MCI MDW MEM MKE MSP MSY OKC OMA ORD PNS SAT STL TUL",
  "America/Denver ABQ BOI COS DEN SLC",
  "America/Detroit DTW",
  "America/Edmonton YEG YYC",
  "America/Halifax YHZ",
  "America/Indiana/Indianapolis IND",
  "America/Lima LIM",
  "America/Los_Angeles BUR FAT GEG LAS LAX OAK ONT PDX PSP RNO SAN SBD SEA SFO SJC SMF SNA",
  "America/Mexico_City MEX",
  "America/New_York ALB ATL BDL BOS BUF BWI CHS CLE CLT CMH CVG DCA EWR FLL GRR IAD JAX JFK LGA MCO MIA MYR ORF PHL PIE PIT PVD PWM RDU RIC ROC RSW SAV SDF SFB SYR TPA TYS",
  "America/Panama PTY",
  "America/Phoenix PHX TUS",
  "America/Puerto_Rico SJU",
  "America/Regina YXE",
  "America/Santiago SCL",
  "America/Sao_Paulo GIG GRU",
  "America/St_Johns YYT",
  "America/Toronto YHM YOW YQG YUL YYZ",
  "America/Vancouver YLW YVR YYJ",
  "America/Winnipeg YWG",
  "Asia/Almaty ALA",
  "Asia/Amman AMM",
  "Asia/Baghdad BGW BSR EBL",
  "Asia/Bahrain BAH",
  "Asia/Baku GYD",
  "Asia/Bangkok BKK CNX HAN HKT",
  "Asia/Beirut BEY",
  "Asia/Brunei BWN",
  "Asia/Colombo CMB",
  "Asia/Dhaka CGP DAC",
  "Asia/Dubai AUH DWC DXB RKT SHJ",
  "Asia/Ho_Chi_Minh SGN",
  "Asia/Hong_Kong HKG",
  "Asia/Jakarta CGK KNO SUB YIA",
  "Asia/Karachi GWD ISB KHI LHE LYP MUX PEW SKT UET",
  "Asia/Kathmandu KTM",
  "Asia/Kolkata AMD BLR BOM CCJ CCU COK DEL HYD LKO MAA TRV",
  "Asia/Kuala_Lumpur KUL LGK PEN SZB",
  "Asia/Kuching BKI KCH",
  "Asia/Kuwait KWI",
  "Asia/Makassar BPN DPS UPG",
  "Asia/Manila CEB MNL",
  "Asia/Muscat MCT SLL",
  "Asia/Qatar DOH",
  "Asia/Riyadh AHB AJF AQI DMM ELQ HAS HOF JED MED NUM RSI RUH TIF TUU ULH YNB",
  "Asia/Samarkand SKD UGC",
  "Asia/Seoul GMP ICN PUS",
  "Asia/Shanghai CAN CKG CTU HGH KMG PEK PKX PVG SHA SZX TFU XIY",
  "Asia/Singapore SIN",
  "Asia/Taipei TPE",
  "Asia/Tashkent TAS",
  "Asia/Tehran IKA",
  "Asia/Tokyo CTS FUK HND KIX NGO NRT",
  "Atlantic/Canary ACE FUE LPA TFN TFS",
  "Atlantic/Reykjavik KEF",
  "Australia/Adelaide ADL",
  "Australia/Brisbane BNE CNS MCY OOL WTB",
  "Australia/Darwin DRW",
  "Australia/Hobart AVV",
  "Australia/Melbourne HBA MEL",
  "Australia/Perth BME PER PHE",
  "Australia/Sydney NTL SYD",
  "Europe/Amsterdam AMS EIN GRQ MST RTM",
  "Europe/Athens ATH SKG",
  "Europe/Belgrade BEG PRN",
  "Europe/Berlin BER BRE CGN DTM DUS ERF FDH FKB FMM FMO FRA HAJ HAM HHN MUC NRN NUE PAD STR",
  "Europe/Brussels BRU CRL OST",
  "Europe/Bucharest OTP",
  "Europe/Budapest BUD",
  "Europe/Copenhagen AAR BLL CPH",
  "Europe/Dublin DUB NOC ORK",
  "Europe/Helsinki HEL",
  "Europe/Istanbul ADB AYT BJV COV DLM ESB IST KYA SAW",
  "Europe/Lisbon FAO LIS OPO",
  "Europe/London ABZ BFS BHX BRS CWL EDI EMA GLA LBA LGW LHR LPL LTN MAN NCL PIK STN",
  "Europe/Luxembourg LUX",
  "Europe/Madrid AGP ALC BCN BIO GRO IBZ MAD MAH OVD PMI REU RMU SCQ SVQ VLC ZAZ",
  "Europe/Moscow SVO",
  "Europe/Oslo OSL",
  "Europe/Paris BES BOD BSL BVA CDG GVA LYS MPL MRS NCE ORY SXB TLS",
  "Europe/Prague PRG",
  "Europe/Rome BDS BGY BLQ BRI CAG CIA CTA FCO GOA LIN MXP NAP OLB PEG PSR SUF TRN VCE",
  "Europe/Sarajevo SJJ",
  "Europe/Skopje SKP",
  "Europe/Sofia SOF",
  "Europe/Stockholm ARN GOT",
  "Europe/Tirane TIA",
  "Europe/Vienna GRZ INN LNZ SZG VIE",
  "Europe/Warsaw KRK WAW",
  "Europe/Zurich ZRH",
  "Indian/Maldives GAN HAQ MLE",
  "Indian/Mauritius MRU",
  "Pacific/Auckland AKL CHC WLG ZQN",
  "Pacific/Honolulu HNL KOA LIH OGG"
];
const TZ = {};
for (const line of TZ_GROUPS) { const [zone, ...codes] = line.split(' '); for (const c of codes) TZ[c] = zone; }
export const tzOf = (iata) => TZ[String(iata).toUpperCase()] || null;
export const tzCodes = () => Object.keys(TZ);

// ---------- time-zone helpers (Intl, no library) ----------
const dtfCache = new Map();
function dtf(tz) {
  if (!dtfCache.has(tz)) dtfCache.set(tz, new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short' }));
  return dtfCache.get(tz);
}
export function localParts(ms, tz) {
  const p = Object.fromEntries(dtf(tz).formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  const hour = p.hour === '24' ? '00' : p.hour;
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${hour}:${p.minute}`, weekday: p.weekday, y: +p.year, m: +p.month, d: +p.day, h: +hour, min: +p.minute, s: +p.second };
}
// Offset of tz from UTC at instant ms, in minutes.
export function tzOffset(ms, tz) {
  const p = localParts(ms, tz);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s);
  return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60000);
}
// Local wall-clock date "YYYY-MM-DD" and time "HH:MM" in tz → UTC ms.
export function zonedToUtc(date, time, tz) {
  const [y, mo, d] = date.split('-').map(Number), [h, mi] = time.split(':').map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  let ms = guess - tzOffset(guess, tz) * 60000;
  const o2 = tzOffset(ms, tz);
  ms = guess - o2 * 60000;
  return ms;
}
export function addDays(date, n) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

// ---------- astronomy ----------
const rad = (d) => (d * Math.PI) / 180, deg = (r) => (r * 180) / Math.PI;
const fix = (a, b) => { a -= b * Math.floor(a / b); return a < 0 ? a + b : a; };
function julian(y, m, d) {
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}
function sunPosition(jd) {
  const D = jd - 2451545.0;
  const g = fix(357.529 + 0.98560028 * D, 360);
  const q = fix(280.459 + 0.98564736 * D, 360);
  const L = fix(q + 1.915 * Math.sin(rad(g)) + 0.020 * Math.sin(rad(2 * g)), 360);
  const e = 23.439 - 0.00000036 * D;
  const RA = fix(deg(Math.atan2(Math.cos(rad(e)) * Math.sin(rad(L)), Math.cos(rad(L)))) / 15, 24);
  return { decl: deg(Math.asin(Math.sin(rad(e)) * Math.sin(rad(L)))), eqt: q / 15 - RA };
}

// Prayer times for a place on a local calendar date. Returns UTC ms for each time, NaN when the
// sun never reaches the angle. `adjusted` lists times set by the high-latitude rule.
export function prayerTimes({ lat, lon, date, method = 'mwl', asr = 'standard' }) {
  const M = METHODS[method] || METHODS.mwl, factor = (ASR[asr] || ASR.standard).factor;
  const [y, mo, d] = date.split('-').map(Number);
  const jd0 = julian(y, mo, d) - lon / (15 * 24);
  const noon = (t) => fix(12 - sunPosition(jd0 + t).eqt, 24);
  const angleTime = (angle, t, ccw) => {
    const { decl } = sunPosition(jd0 + t);
    const cosT = (-Math.sin(rad(angle)) - Math.sin(rad(decl)) * Math.sin(rad(lat))) / (Math.cos(rad(decl)) * Math.cos(rad(lat)));
    if (cosT < -1 || cosT > 1) return NaN;
    const T = deg(Math.acos(cosT)) / 15;
    return noon(t) + (ccw ? -T : T);
  };
  const asrTime = (t) => {
    const { decl } = sunPosition(jd0 + t);
    const a = -deg(Math.atan(1 / (factor + Math.tan(rad(Math.abs(lat - decl))))));
    return angleTime(a, t, false);
  };
  // Local solar hours; refined twice using the sun's position at the estimated time.
  let h = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, sunset: 18, isha: 18 };
  for (let i = 0; i < 3; i++) {
    const t = Object.fromEntries(Object.entries(h).map(([k, v]) => [k, (Number.isFinite(v) ? v : 12) / 24]));
    h = {
      fajr: angleTime(M.fajr, t.fajr, true),
      sunrise: angleTime(0.833, t.sunrise, true),
      dhuhr: noon(t.dhuhr),
      asr: asrTime(t.asr),
      sunset: angleTime(0.833, t.sunset, false),
      isha: M.ishaMin ? NaN : angleTime(M.isha, t.isha, false),
    };
  }
  const adjusted = [];
  if (M.ishaMin) h.isha = h.sunset + M.ishaMin / 60;
  // High latitudes: angle-based rule (a share of the night equal to angle/60), as in PrayTimes.
  if (Number.isFinite(h.sunrise) && Number.isFinite(h.sunset)) {
    const night = 24 - (h.sunset - h.sunrise);
    const fp = (M.fajr / 60) * night;
    if (!Number.isFinite(h.fajr) || h.sunrise - h.fajr > fp) { h.fajr = h.sunrise - fp; adjusted.push('fajr'); }
    if (!M.ishaMin) {
      const ip = (M.isha / 60) * night;
      if (!Number.isFinite(h.isha) || h.isha - h.sunset > ip) { h.isha = h.sunset + ip; adjusted.push('isha'); }
    }
  }
  const base = Date.UTC(y, mo - 1, d);
  const ms = (hours) => (Number.isFinite(hours) ? Math.round(base + (hours - lon / 15) * 3600000) : NaN);
  return {
    fajr: ms(h.fajr), sunrise: ms(h.sunrise), dhuhr: ms(h.dhuhr), asr: ms(h.asr),
    maghrib: ms(h.sunset), isha: ms(h.isha), adjusted,
  };
}

// Prayer start times at a place between two instants (UTC ms), oldest first.
export function eventsBetween(place, fromMs, toMs, opts) {
  const tz = place.tz;
  const start = localParts(fromMs, tz).date, end = localParts(toMs, tz).date;
  const out = [];
  for (let day = addDays(start, -1); day <= addDays(end, 1); day = addDays(day, 1)) {
    const t = prayerTimes({ lat: place.lat, lon: place.lon, date: day, ...opts });
    for (const p of PRAYERS) if (Number.isFinite(t[p])) out.push({ prayer: p, ms: t[p], adjusted: t.adjusted.includes(p) });
  }
  out.sort((a, b) => a.ms - b.ms);
  return { inside: out.filter((e) => e.ms >= fromMs && e.ms < toMs), before: out.filter((e) => e.ms < fromMs).at(-1) || null, after: out.find((e) => e.ms >= toMs) || null };
}

// Build the trip timeline.
// legs: [{ from, to, depDate, depTime, arrDate, arrTime }] with IATA codes.
// lookup(code) → { code, lat, lon, tz, ... } or null. opts: { method, asr, beforeHours }.
export function planTrip(legs, lookup, { method = 'mwl', asr = 'standard', beforeHours = 3 } = {}) {
  const errors = [], o = { method, asr };
  const L = legs.map((l, i) => {
    const from = lookup(l.from), to = lookup(l.to);
    if (!from) errors.push(`Flight ${i + 1}: choose a departure airport from the list.`);
    if (!to) errors.push(`Flight ${i + 1}: choose an arrival airport from the list.`);
    if (!l.depDate || !l.depTime || !l.arrDate || !l.arrTime) errors.push(`Flight ${i + 1}: enter the departure and arrival dates and times.`);
    if (!from || !to || !l.depDate || !l.depTime || !l.arrDate || !l.arrTime) return null;
    const dep = zonedToUtc(l.depDate, l.depTime, from.tz), arr = zonedToUtc(l.arrDate, l.arrTime, to.tz);
    if (!(arr > dep)) errors.push(`Flight ${i + 1}: it lands before it takes off once time zones are counted. Check the arrival date.`);
    else if (arr - dep > 22 * 3600000) errors.push(`Flight ${i + 1}: longer than 22 hours. Check the dates.`);
    return { from, to, dep, arr };
  });
  L.forEach((l, i) => {
    const n = L[i + 1];
    if (l && n && n.dep < l.arr) errors.push(`Flight ${i + 2} leaves before flight ${i + 1} lands. Check the times.`);
    if (l && n && n.from.code !== l.to.code) errors.push(`Flight ${i + 2} leaves from ${n.from.code.toUpperCase()}, but flight ${i + 1} lands at ${l.to.code.toUpperCase()}.`);
  });
  if (errors.length) return { errors, phases: [] };

  const ground = (kind, place, from, to) => {
    const ev = eventsBetween(place, from, to, o);
    return { kind, place, from, to, events: ev.inside, before: ev.before, next: ev.after };
  };
  const phases = [];
  phases.push(ground('before', L[0].from, L[0].dep - beforeHours * 3600000, L[0].dep));
  L.forEach((l, i) => {
    phases.push(air(l, o, i));
    if (L[i + 1]) phases.push(ground('layover', l.to, l.arr, L[i + 1].dep));
  });
  const last = L.at(-1);
  const ar = eventsBetween(last.to, last.arr, last.arr + 1, o);
  phases.push({ kind: 'arrival', place: last.to, from: last.arr, to: last.arr, events: [], before: ar.before, next: ar.after });
  return { errors, phases };
}

// In the air: list each prayer whose time begins, at the departure or the arrival airport, while
// the plane is flying. The real time on board depends on the aircraft's position.
function air(l, o, i) {
  const a = eventsBetween(l.from, l.dep, l.arr, o).inside.map((e) => ({ ...e, at: 'from' }));
  const b = eventsBetween(l.to, l.dep, l.arr, o).inside.map((e) => ({ ...e, at: 'to' }));
  const merged = [];
  for (const e of [...a, ...b].sort((x, y) => x.ms - y.ms)) {
    // The same prayer at both ends is one row if the two start times are under 14 hours apart.
    const m = merged.find((r) => r.prayer === e.prayer && !r[e.at] && Math.abs(r.ms - e.ms) < 14 * 3600000);
    if (m) m[e.at] = e.ms;
    else merged.push({ prayer: e.prayer, ms: e.ms, [e.at]: e.ms });
  }
  // events: one row per prayer (merged across both ends); atFrom / atTo: each end on its own.
  return { kind: 'air', leg: i, place: l.from, dest: l.to, from: l.dep, to: l.arr, events: merged, atFrom: a, atTo: b };
}
