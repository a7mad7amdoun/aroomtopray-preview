// Traveller photos of prayer rooms, published only after an editor approves them.
// POST /api/photo (multipart: code, space, consent, website, photo) → stored as "pending:photo:<id>" for 180 days.
//   The page resizes the photo to at most 1600px and re-encodes it as JPEG (which drops EXIF/GPS); the server
//   checks the size and dimensions and strips any metadata segments again in case a client skipped that step.
// GET /api/photo?code=xxx → approved photos for that airport: [{ id, w, h, date, space }].
// GET /api/photo?code=xxx&id=<id> → one approved image. Pending photos are never read by this file's GET handlers.
// Approve or reject with scripts/moderate.mjs. See docs/CHECKINS.md.
import { CODES, sameOrigin, underLimit, tooBig } from './_util.js';

export const MAX_BYTES = 900 * 1024;
export const MAX_SIDE = 1600;
const PENDING_SECONDS = 60 * 60 * 24 * 180;
const ID = /^[0-9a-f]{16}$/;
const bad = (status) => new Response(null, { status });
const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...extra } });

// Walk every JPEG segment and every scan (progressive JPEGs have several), up to EOI. Drops APP1–APP15 (EXIF, XMP,
// ICC, maker notes) and comments wherever they appear, keeps everything else, reads the frame size and discards any
// bytes after EOI. Returns null if it isn't a well-formed JPEG with a frame header, at least one scan and an EOI.
export function cleanJpeg(input) {
  const b = new Uint8Array(input), n = b.length;
  if (n < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  const parts = [b.subarray(0, 2)];
  let i = 2, w = 0, h = 0, scans = 0;
  while (i + 2 <= n) {
    if (b[i] !== 0xff) return null;
    const m = b[i + 1];
    if (m === 0xff) { i++; continue; } // fill byte
    if (m === 0xd9) { // EOI: done, anything after it is dropped
      if (!w || !h || !scans) return null;
      parts.push(b.subarray(i, i + 2));
      const out = new Uint8Array(parts.reduce((t, p) => t + p.length, 0));
      let o = 0;
      for (const p of parts) { out.set(p, o); o += p.length; }
      return { bytes: out, w, h };
    }
    if (m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { parts.push(b.subarray(i, i + 2)); i += 2; continue; } // markers without a length
    if (i + 4 > n) return null;
    const len = (b[i + 2] << 8) | b[i + 3];
    if (len < 2 || i + 2 + len > n) return null;
    let next = i + 2 + len;
    if (m === 0xda) {
      // Entropy-coded data runs until the next real marker (not a stuffed 0xFF00 or a restart marker).
      while (next < n) {
        if (b[next] !== 0xff) { next++; continue; }
        const c = b[next + 1];
        if (c === 0x00 || (c >= 0xd0 && c <= 0xd7)) { next += 2; continue; }
        if (c === 0xff) { next++; continue; }
        break;
      }
      if (next >= n) return null; // ran off the end without EOI
      scans++;
      parts.push(b.subarray(i, next));
      i = next;
      continue;
    }
    const isSof = m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc;
    if (isSof && len >= 7) { h = (b[i + 5] << 8) | b[i + 6]; w = (b[i + 7] << 8) | b[i + 8]; }
    const strip = (m >= 0xe1 && m <= 0xef) || m === 0xfe;
    if (!strip) parts.push(b.subarray(i, next));
    i = next;
  }
  return null; // no EOI
}

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return bad(403);
  if (!env.KV) return bad(503);
  if (tooBig(request, MAX_BYTES + 8192)) return bad(413);
  let f;
  try { f = await request.formData(); } catch { return bad(400); }
  if (f.get('website')) return json({ ok: true }); // honeypot
  const code = String(f.get('code') || '').toLowerCase();
  const space = Number(f.get('space') || 0);
  const photo = f.get('photo');
  if (!CODES.has(code) || !Number.isInteger(space) || space < 0 || space >= 20) return bad(400);
  if (f.get('consent') !== 'yes') return bad(400); // "No people's faces or documents are visible"
  if (!photo || typeof photo.arrayBuffer !== 'function') return bad(400);
  if (photo.size > MAX_BYTES) return bad(413);
  const img = cleanJpeg(await photo.arrayBuffer());
  if (!img) return bad(415);
  if (img.w > MAX_SIDE || img.h > MAX_SIDE) return bad(422);
  try {
    if (!(await underLimit(env, request, 'photo', 3))) return bad(429);
    const id = [...crypto.getRandomValues(new Uint8Array(8))].map((x) => x.toString(16).padStart(2, '0')).join('');
    const date = new Date().toISOString().slice(0, 10);
    await env.KV.put(`pending:photo:${id}`, img.bytes, { metadata: { code, space, w: img.w, h: img.h, date }, expirationTtl: PENDING_SECONDS });
    return json({ ok: true });
  } catch { return bad(500); }
}

export async function onRequestGet({ request, env }) {
  if (!env.KV) return bad(503);
  const p = new URL(request.url).searchParams;
  const code = String(p.get('code') || '').toLowerCase();
  if (!CODES.has(code)) return bad(400);
  const id = p.get('id');
  if (id === null) {
    let list = [];
    try { list = JSON.parse((await env.KV.get(`photos:${code}`)) || '[]'); } catch {}
    return json({ code, photos: Array.isArray(list) ? list : [] }, 200, { 'cache-control': 'public, max-age=300' });
  }
  if (!ID.test(id)) return bad(400);
  // Only the approved key space is ever read here, and only for ids on the airport's approved list (defence in depth:
  // a blob left behind by a failed unpublish is not served).
  let approved = [];
  try { approved = JSON.parse((await env.KV.get(`photos:${code}`)) || '[]'); } catch {}
  if (!Array.isArray(approved) || !approved.some((p) => p && p.id === id)) return bad(404);
  const bytes = await env.KV.get(`photo:${code}:${id}`, 'arrayBuffer');
  if (!bytes) return bad(404);
  return new Response(bytes, { headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' } });
}
