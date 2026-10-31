// Shared helpers for the API functions (KV binding "KV"). Codes are checked against the published airport list.
import codes from './_codes.json';
export const CODES = new Set(codes);
const host = (h) => h.toLowerCase().replace(/^www\./, '');
export const sameOrigin = (request) => {
  try { return host(new URL(request.headers.get('origin')).hostname) === host(new URL(request.url).hostname); } catch { return false; }
};
const today = () => new Date().toISOString().slice(0, 10);
// Keyed one-way hash (HMAC with the HASH_KEY secret) of scope + day + IP, used only for daily limits.
// Without the secret it can't be matched to an address, and the KV entry expires after a day.
async function dayKey(request, env, scope) {
  const ip = request.headers.get('cf-connecting-ip') || '';
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.HASH_KEY || 'unset'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const buf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${scope}|${today()}|${ip}`));
  return 'lim:' + [...new Uint8Array(buf)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
}
export async function underLimit(env, request, scope, max) {
  const key = await dayKey(request, env, scope);
  const n = Number(await env.KV.get(key)) || 0;
  if (n >= max) return false;
  await env.KV.put(key, String(n + 1), { expirationTtl: 86400 });
  return true;
}
// Reject large bodies before parsing them (a quick check on the declared length; readBody counts the real bytes).
export const MAX_BODY = 16384;
export const tooBig = (request, max = MAX_BODY) => Number(request.headers.get('content-length') || 0) > max;

// Read at most `max` bytes of the body, counting what actually arrives (Content-Length can be absent or wrong).
// Returns { body, isForm } with body a plain object, or { status } (413 too large, 400 not an object or form data).
export async function readBody(request, max = MAX_BODY) {
  const type = (request.headers.get('content-type') || '').toLowerCase();
  const isForm = /^(application\/x-www-form-urlencoded|multipart\/form-data)/.test(type);
  const chunks = [];
  let size = 0;
  if (request.body) {
    const reader = request.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) { try { await reader.cancel(); } catch {} return { status: 413, isForm }; }
      chunks.push(value);
    }
  }
  const bytes = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) { bytes.set(c, at); at += c.byteLength; }
  try {
    const body = isForm
      ? Object.fromEntries(await new Response(bytes, { headers: { 'content-type': type } }).formData())
      : JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!body || typeof body !== 'object' || Array.isArray(body)) return { status: 400, isForm };
    return { body, isForm };
  } catch { return { status: 400, isForm }; }
}

// Cloudflare Turnstile. The widget's site key is built into the pages (PUBLIC_TURNSTILE_SITEKEY); the secret
// is the TURNSTILE_SECRET variable. Without the secret the forms are closed (503) rather than unprotected.
// Returns 0 when the token is good, else the status to answer with (503 not configured, 403 failed).
const HOSTS = /^(?:(?:www\.)?aroomtopray\.com|(?:[a-z0-9-]+\.)?aroomtopray\.pages\.dev)$/;
export async function turnstileFails(env, request, token) {
  if (!env.TURNSTILE_SECRET) return 503;
  token = String(token || '');
  if (!token || token.length > 2048) return 403;
  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET);
  form.append('response', token);
  const ip = request.headers.get('cf-connecting-ip');
  if (ip) form.append('remoteip', ip);
  try {
    const r = await (await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })).json();
    return r.success === true && HOSTS.test(String(r.hostname || '').toLowerCase()) ? 0 : 403;
  } catch { return 403; }
}
