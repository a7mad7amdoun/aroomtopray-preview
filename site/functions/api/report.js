// POST /api/report { code, field, seen, details, website, cf-turnstile-response }: a traveller report, stored for an editor to review.
// "website" is a honeypot. Every report needs a valid Cloudflare Turnstile token (TURNSTILE_SECRET; without it: 503).
// Up to 5 reports per IP per day. Bodies over 16 KB are refused. Read reports:
//   npx wrangler kv key list --namespace-id 035d89b9d1944b1487a623e989571546 --prefix report: --remote
import { CODES, sameOrigin, underLimit, tooBig, readBody, turnstileFails } from './_util.js';
const FIELDS = new Set(['New room I found', 'Room moved or closed', 'Hours', 'Wuḍūʾ area', 'Space for women', 'Something else']);
const bad = (status) => new Response(null, { status });
// Without JavaScript, answer with a small readable page rather than relying on the airport page's script.
const MSG = {
  sent: 'Thanks. Your report is waiting for an editor to check it.',
  short: 'Please add a little more detail (at least 10 characters) and send it again.',
  limit: 'You have sent several reports today. Please try again tomorrow.',
  verify: 'This form checks that you are a person, and that check needs JavaScript. Please turn JavaScript on and send the report again.',
  closed: 'Reports are paused for a short while. Please try again later.',
  error: 'Your report didn’t send. Please go back and try again.',
};
export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return bad(403);
  if (tooBig(request)) return bad(413);
  // JSON from the page script, or a plain form post when JavaScript is off (then answer with a short page).
  const { body: b, isForm, status } = await readBody(request);
  const back = (state, code = 400) => {
    if (!isForm) return null;
    const c = CODES.has(String(b?.code || '').toLowerCase()) ? String(b.code).toLowerCase() : '';
    const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Report | A Room to Pray</title><body style="font:18px/1.5 system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem"><p>${MSG[state]}</p><p><a href="${c.startsWith('uni-') ? `/universities/${c.slice(4)}/` : c.startsWith('hos-') ? `/hospitals/${c.slice(4)}/` : `/airports/${c}${c ? '/' : ''}`}">Back to the page</a></p></body></html>`;
    return new Response(html, { status: state === 'sent' ? 200 : code, headers: { 'content-type': 'text/html; charset=utf-8' } });
  };
  if (status) return status === 413 ? bad(413) : back('error') || bad(400);
  if (b.website) return back('sent') || new Response(null, { status: 204 }); // bot: pretend it worked
  const failed = await turnstileFails(env, request, b['cf-turnstile-response']);
  if (failed) return back(failed === 503 ? 'closed' : 'verify', failed) || bad(failed);
  if (!env.KV) return back('closed', 503) || bad(503);
  const code = String(b.code || '').toLowerCase();
  const details = String(b.details || '').trim().slice(0, 1500);
  if (!CODES.has(code)) return bad(400);
  if (details.length < 10) return back('short') || bad(400);
  const report = {
    created: new Date().toISOString(), code, details,
    field: FIELDS.has(b.field) ? b.field : 'Something else',
    seen: /^\d{4}-\d{2}$/.test(b.seen) ? b.seen : null,
  };
  try {
    if (!(await underLimit(env, request, 'report', 5))) return back('limit', 429) || bad(429);
    await env.KV.put(`report:${report.created}:${code}:${crypto.randomUUID().slice(0, 8)}`, JSON.stringify(report), { metadata: { code, status: 'new' }, expirationTtl: 60 * 60 * 24 * 180 });
    return back('sent') || new Response(null, { status: 204 });
  } catch { return back('error', 500) || bad(500); }
}
