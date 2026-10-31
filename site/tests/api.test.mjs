// Pages Functions: Turnstile, body limits, origin check, honeypot and daily limits. Synthetic data only;
// KV and Cloudflare's siteverify are mocked.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
register('./json-hook.mjs', import.meta.url);
const report = await import('../functions/api/report.js');
const contact = await import('../functions/api/contact.js');

const ORIGIN = 'https://aroomtopray.com';
const kv = () => { const m = new Map(); return { m, get: async (k) => m.get(k) ?? null, put: async (k, v) => { m.set(k, v); } }; };
const envOf = (extra = {}) => ({ KV: kv(), HASH_KEY: 'test-hash', TURNSTILE_SECRET: 'test-secret', ...extra });
const req = (path, body, { type = 'application/json', origin = ORIGIN, headers = {} } = {}) => new Request(ORIGIN + path, {
  method: 'POST', body, headers: { origin, 'cf-connecting-ip': '192.0.2.7', ...(type ? { 'content-type': type } : {}), ...headers },
});
const json = (path, obj, opts) => req(path, JSON.stringify(obj), opts);
const form = (path, fields, opts) => req(path, new URLSearchParams(fields).toString(), { type: 'application/x-www-form-urlencoded', ...opts });
// Replace fetch with a fake siteverify; records each call's form fields.
async function withVerify(result, fn) {
  const calls = [], real = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    assert.equal(String(url), 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    calls.push(Object.fromEntries(init.body));
    return new Response(JSON.stringify(result));
  };
  try { return { res: await fn(), calls }; } finally { globalThis.fetch = real; }
}
const PASS = { success: true, hostname: 'aroomtopray.com' };
const goodReport = { code: 'jfk', field: 'Hours', seen: '2026-09', details: 'Terminal 4, open all hours.', 'cf-turnstile-response': 'tok' };
const goodContact = { topic: 'Press', message: 'A synthetic test message.', 'cf-turnstile-response': 'tok' };

test('a good report is verified with secret, token and IP, then stored', async () => {
  const env = envOf();
  const { res, calls } = await withVerify(PASS, () => report.onRequestPost({ request: json('/api/report', goodReport), env }));
  assert.equal(res.status, 204);
  assert.deepEqual(calls, [{ secret: 'test-secret', response: 'tok', remoteip: '192.0.2.7' }]);
  assert.equal([...env.KV.m.keys()].filter((k) => k.startsWith('report:')).length, 1);
});

test('a good contact message is stored; www and preview hosts are accepted', async () => {
  for (const hostname of ['www.aroomtopray.com', 'security-preview.aroomtopray.pages.dev', 'aroomtopray.pages.dev']) {
    const env = envOf();
    const { res } = await withVerify({ success: true, hostname }, () => contact.onRequestPost({ request: json('/api/contact', goodContact), env }));
    assert.equal(res.status, 204, hostname);
    assert.equal([...env.KV.m.keys()].filter((k) => k.startsWith('contact:')).length, 1);
  }
});

test('no token, a failed token or a token for another site gets 403 and stores nothing', async () => {
  for (const [mod, path, body] of [[report, '/api/report', goodReport], [contact, '/api/contact', goodContact]]) {
    const env = envOf();
    const none = await withVerify(PASS, () => mod.onRequestPost({ request: json(path, { ...body, 'cf-turnstile-response': undefined }), env }));
    assert.equal(none.res.status, 403);
    assert.equal(none.calls.length, 0);
    for (const result of [{ success: false }, { success: true, hostname: 'evil.example' }, { success: true, hostname: 'aroomtopray.com.evil.example' }, { success: true }]) {
      const { res } = await withVerify(result, () => mod.onRequestPost({ request: json(path, body), env }));
      assert.equal(res.status, 403, JSON.stringify(result));
    }
    assert.equal(env.KV.m.size, 0);
  }
});

test('without TURNSTILE_SECRET the forms are closed (503)', async () => {
  const env = envOf({ TURNSTILE_SECRET: undefined });
  const { res, calls } = await withVerify(PASS, () => report.onRequestPost({ request: json('/api/report', goodReport), env }));
  assert.equal(res.status, 503);
  assert.equal(calls.length, 0);
  assert.equal((await contact.onRequestPost({ request: json('/api/contact', goodContact), env })).status, 503);
});

test('a body that is not an object or form data gets 400, not 500', async () => {
  for (const [mod, path] of [[report, '/api/report'], [contact, '/api/contact']]) {
    for (const raw of ['null', '[]', '"text"', '7', '{oops', '']) {
      const { res, calls } = await withVerify(PASS, () => mod.onRequestPost({ request: req(path, raw), env: envOf() }));
      assert.equal(res.status, 400, `${path} ${JSON.stringify(raw)}`);
      assert.equal(calls.length, 0);
    }
  }
});

test('bodies over 16 KB are refused by counting bytes, even without a Content-Length', async () => {
  const big = JSON.stringify({ ...goodReport, details: 'x'.repeat(17000) });
  for (const [mod, path] of [[report, '/api/report'], [contact, '/api/contact']]) {
    // A stream body has no Content-Length, so only the real byte count can catch it.
    const stream = new ReadableStream({ start(c) { for (let i = 0; i < 20; i++) c.enqueue(new TextEncoder().encode('x'.repeat(1000))); c.close(); } });
    const r = new Request(ORIGIN + path, { method: 'POST', body: stream, duplex: 'half', headers: { origin: ORIGIN, 'content-type': 'application/json' } });
    assert.equal(r.headers.get('content-length'), null);
    assert.equal((await mod.onRequestPost({ request: r, env: envOf() })).status, 413);
    assert.equal((await mod.onRequestPost({ request: req(path, big), env: envOf() })).status, 413);
  }
  // Multi-byte text is counted in bytes, not characters: 6000 × 3-byte characters is 18 KB.
  const wide = JSON.stringify({ ...goodContact, message: 'ḍ'.repeat(6000) });
  assert.ok(wide.length < 16384);
  assert.equal((await contact.onRequestPost({ request: req('/api/contact', wide, { headers: { 'content-length': '' } }), env: envOf() })).status, 413);
});

test('the Origin check, honeypot and daily limits still hold', async () => {
  const cross = await withVerify(PASS, () => report.onRequestPost({ request: json('/api/report', goodReport, { origin: 'https://evil.example' }), env: envOf() }));
  assert.equal(cross.res.status, 403);
  assert.equal(cross.calls.length, 0);
  const env = envOf();
  const hp = await withVerify(PASS, () => report.onRequestPost({ request: json('/api/report', { ...goodReport, website: 'spam' }), env }));
  assert.equal(hp.res.status, 204);
  assert.equal(hp.calls.length + env.KV.m.size, 0);
  const statuses = [];
  for (let i = 0; i < 6; i++) statuses.push((await withVerify(PASS, () => contact.onRequestPost({ request: json('/api/contact', goodContact), env }))).res.status);
  assert.deepEqual(statuses, [204, 204, 204, 204, 204, 429]);
});

test('without JavaScript, a form post gets a readable page (no token: says JavaScript is needed)', async () => {
  const { res } = await withVerify(PASS, () => report.onRequestPost({ request: form('/api/report', { ...goodReport, 'cf-turnstile-response': '' }), env: envOf() }));
  assert.equal(res.status, 403);
  assert.match(res.headers.get('content-type'), /text\/html/);
  const html = await res.text();
  assert.match(html, /needs JavaScript/);
  assert.match(html, /href="\/airports\/jfk\/"/);
  const ok = await withVerify(PASS, () => report.onRequestPost({ request: form('/api/report', goodReport), env: envOf() }));
  assert.equal(ok.res.status, 200);
  assert.match(await ok.res.text(), /waiting for an editor/);
  const c = await withVerify(PASS, () => contact.onRequestPost({ request: form('/api/contact', { topic: 'Press', message: 'short' }), env: envOf() }));
  assert.equal(c.res.status, 403);
  assert.match(await c.res.text(), /needs JavaScript/);
});
