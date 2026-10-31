// POST /api/contact { topic, message, email?, website, cf-turnstile-response }: a message to the editor, stored in KV for 180 days.
// "website" is a honeypot. Every message needs a valid Cloudflare Turnstile token (TURNSTILE_SECRET; without it: 503).
// Up to 5 messages per IP per day. Bodies over 16 KB are refused. Read messages:
//   npx wrangler kv key list --namespace-id 035d89b9d1944b1487a623e989571546 --prefix contact: --remote
import { sameOrigin, underLimit, tooBig, readBody, turnstileFails } from './_util.js';
const TOPICS = new Set(['A correction', 'I work at an airport or chaplaincy', 'Press', 'Something else']);
const page = (text, status) => new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Contact | A Room to Pray</title><body style="font:18px/1.5 system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem"><p>${text}</p><p><a href="/contact/">Back to the contact page</a></p></body></html>`, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  if (tooBig(request)) return new Response(null, { status: 413 });
  const { body: b, isForm, status } = await readBody(request);
  const reply = (ok, text, code) => (isForm ? page(text, code) : new Response(null, { status: ok ? 204 : code }));
  if (status === 413) return new Response(null, { status: 413 });
  if (status) return reply(false, 'Something went wrong. Please try again.', 400);
  if (b.website) return reply(true, 'Thanks. Your message has reached the editor.', 200);
  const failed = await turnstileFails(env, request, b['cf-turnstile-response']);
  if (failed === 503) return reply(false, 'The contact form is paused for a short while. Please try again later.', 503);
  if (failed) return reply(false, 'This form checks that you are a person, and that check needs JavaScript. Please turn JavaScript on and send your message again.', 403);
  if (!env.KV) return reply(false, 'The contact form is paused for a short while. Please try again later.', 503);
  const message = String(b.message || '').trim().slice(0, 3000);
  if (message.length < 10) return reply(false, 'Please write a little more (at least 10 characters).', 400);
  const email = /^[^\s@]{1,100}@[^\s@]{1,100}\.[^\s@]{2,}$/.test(String(b.email || '').trim()) ? String(b.email).trim().slice(0, 200) : null;
  const msg = { created: new Date().toISOString(), topic: TOPICS.has(b.topic) ? b.topic : 'Something else', message, email };
  try {
    if (!(await underLimit(env, request, 'contact', 5))) return reply(false, 'You have sent several messages today. Please try again tomorrow.', 429);
    await env.KV.put(`contact:${msg.created}:${crypto.randomUUID().slice(0, 8)}`, JSON.stringify(msg), { metadata: { topic: msg.topic, status: 'new' }, expirationTtl: 60 * 60 * 24 * 180 });
    return reply(true, 'Thanks. Your message has reached the editor.', 200);
  } catch { return reply(false, 'Your message didn’t send. Please go back and try again.', 500); }
}
