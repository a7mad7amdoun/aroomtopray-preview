// Traveller check-ins: "I prayed here recently: still here / moved / closed".
// POST /api/checkin { code, space, status, website } → adds one to that airport's aggregate. "website" is a honeypot.
// GET  /api/checkin?code=xxx → the aggregate for every listed space at that airport.
// Stored: one KV key per airport, "checkin:<code>", holding counts only (no IP, no country, no time of day).
// Up to 3 check-ins per IP per airport per day (keyed one-way hash, kept for one day). See docs/CHECKINS.md.
import { CODES, sameOrigin, underLimit, tooBig } from './_util.js';

export const STATUSES = ['still', 'moved', 'closed'];
export const MAX_SPACES = 20; // airports list at most a handful of spaces; anything above this is junk
const WINDOW_DAYS = 90; // "recent" window for the "may have changed" note
const KEEP_SECONDS = 60 * 60 * 24 * 365; // an airport nobody checks in at for a year drops its aggregate
const DAY = 86400000;

const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...extra } });
const bad = (status) => new Response(null, { status });
const isoDay = (t) => new Date(t).toISOString().slice(0, 10);

// Stored shape: { s: { "<space>": { n: [still, moved, closed], last: "YYYY-MM-DD"|null, d: { "YYYY-MM-DD": [still, moved, closed] } } } }
// Day buckets older than 90 days are dropped on every write, so only all-time counts and the last "still here" date outlive them.
export function addCheckin(agg, space, status, now = Date.now()) {
  const a = agg && typeof agg === 'object' && agg.s ? agg : { s: {} };
  const k = String(space), i = STATUSES.indexOf(status), day = isoDay(now);
  const sp = a.s[k] || (a.s[k] = { n: [0, 0, 0], last: null, d: {} });
  sp.n[i]++;
  (sp.d[day] ||= [0, 0, 0])[i]++;
  if (status === 'still') sp.last = day;
  const cutoff = isoDay(now - WINDOW_DAYS * DAY);
  for (const d of Object.keys(sp.d)) if (d < cutoff) delete sp.d[d];
  return a;
}

// Public view: counts, the last "still here" date, and whether moved/closed outnumber still-here in the last 90 days.
export function summarise(agg, now = Date.now()) {
  const out = {};
  const cutoff = isoDay(now - WINDOW_DAYS * DAY), today = Date.parse(isoDay(now));
  for (const [k, sp] of Object.entries(agg?.s || {})) {
    const recent = [0, 0, 0];
    for (const [d, c] of Object.entries(sp.d || {})) if (d >= cutoff) c.forEach((v, i) => (recent[i] += v));
    out[k] = {
      still: sp.n[0], moved: sp.n[1], closed: sp.n[2],
      lastStill: sp.last,
      daysSinceStill: sp.last ? Math.max(0, Math.round((today - Date.parse(sp.last)) / DAY)) : null,
      recent: { still: recent[0], moved: recent[1], closed: recent[2] },
      mayHaveChanged: recent[1] + recent[2] > recent[0],
    };
  }
  return out;
}

export async function onRequestGet({ request, env }) {
  if (!env.KV) return bad(503);
  const code = String(new URL(request.url).searchParams.get('code') || '').toLowerCase();
  if (!CODES.has(code)) return bad(400);
  let agg = null;
  try { agg = JSON.parse((await env.KV.get(`checkin:${code}`)) || 'null'); } catch {}
  return json({ code, spaces: summarise(agg) }, 200, { 'cache-control': 'public, max-age=60' });
}

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return bad(403);
  if (!env.KV) return bad(503);
  if (tooBig(request, 512)) return bad(413);
  let b;
  try {
    const text = await request.text();
    if (text.length > 512) return bad(413); // content-length can be missing (chunked); check the body too
    b = JSON.parse(text);
  } catch { return bad(400); }
  if (!b || typeof b !== 'object') return bad(400);
  if (b.website) return json({ ok: true }); // bot: pretend it worked, store nothing
  const code = String(b.code || '').toLowerCase();
  const space = Number(b.space);
  const status = String(b.status || '');
  if (!CODES.has(code) || !Number.isInteger(space) || space < 0 || space >= MAX_SPACES || !STATUSES.includes(status)) return bad(400);
  try {
    if (!(await underLimit(env, request, `checkin:${code}`, 3))) return bad(429);
    // Read-modify-write: two check-ins in the same second can overwrite each other. That only loses a count, which is fine here.
    let agg = null;
    try { agg = JSON.parse((await env.KV.get(`checkin:${code}`)) || 'null'); } catch {}
    agg = addCheckin(agg, space, status);
    await env.KV.put(`checkin:${code}`, JSON.stringify(agg), { expirationTtl: KEEP_SECONDS });
    return json({ ok: true, space: summarise(agg)[String(space)] });
  } catch { return bad(500); }
}
