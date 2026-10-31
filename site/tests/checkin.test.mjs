// Unit tests for /api/checkin and /api/photo with a fake KV and fake requests. Run: node --test tests/checkin.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

// _util.js imports _codes.json without an import attribute (fine for the Pages bundler, not for Node). Load JSON as a module here.
register('data:text/javascript,' + encodeURIComponent(`
  import { readFile } from 'node:fs/promises';
  export async function load(url, ctx, next) {
    if (url.endsWith('.json')) return { format: 'module', shortCircuit: true, source: 'export default ' + await readFile(new URL(url), 'utf8') };
    return next(url, ctx);
  }`));
const checkin = await import('../functions/api/checkin.js');
const photo = await import('../functions/api/photo.js');

class FakeKV {
  constructor() { this.m = new Map(); this.puts = []; }
  async get(k, type) {
    const e = this.m.get(k);
    if (!e) return null;
    if (type === 'arrayBuffer') return e.v instanceof Uint8Array ? e.v.buffer.slice(e.v.byteOffset, e.v.byteOffset + e.v.byteLength) : new TextEncoder().encode(e.v).buffer;
    return typeof e.v === 'string' ? e.v : new TextDecoder().decode(e.v);
  }
  async put(k, v, opts = {}) { this.m.set(k, { v, opts }); this.puts.push(k); }
  keys(prefix = '') { return [...this.m.keys()].filter((k) => k.startsWith(prefix)); }
}
const env = () => ({ KV: new FakeKV(), HASH_KEY: 'test-key' });
const ORIGIN = 'https://aroomtopray.com';
const post = (path, body, { ip = '203.0.113.1', origin = ORIGIN, type = 'application/json', len } = {}) => {
  const headers = { origin, 'cf-connecting-ip': ip };
  if (type) headers['content-type'] = type;
  if (len !== undefined) headers['content-length'] = String(len);
  return new Request(ORIGIN + path, { method: 'POST', headers, body });
};
const ci = (e, body, opts) => checkin.onRequestPost({ request: post('/api/checkin', JSON.stringify(body), opts), env: e });
const getCi = (e, code) => checkin.onRequestGet({ request: new Request(`${ORIGIN}/api/checkin?code=${code}`), env: e });

test('check-in: stores counts only and returns 200', async () => {
  const e = env();
  const r = await ci(e, { code: 'ATL', space: 0, status: 'still' });
  assert.equal(r.status, 200);
  const stored = await e.KV.get('checkin:atl');
  assert.ok(stored);
  assert.ok(!stored.includes('203.0.113.1'), 'no IP stored');
  assert.deepEqual(Object.keys(JSON.parse(stored)), ['s']);
  assert.equal(e.KV.m.get('checkin:atl').opts.expirationTtl, 60 * 60 * 24 * 365);
  const lim = e.KV.keys('lim:');
  assert.equal(lim.length, 1);
  assert.equal(e.KV.m.get(lim[0]).opts.expirationTtl, 86400);
  const g = await (await getCi(e, 'atl')).json();
  assert.equal(g.spaces['0'].still, 1);
  assert.equal(g.spaces['0'].daysSinceStill, 0);
  assert.equal(g.spaces['0'].mayHaveChanged, false);
});

test('check-in: 3 per IP per airport per day, other airports and IPs unaffected', async () => {
  const e = env();
  for (let i = 0; i < 3; i++) assert.equal((await ci(e, { code: 'atl', space: 0, status: 'still' })).status, 200);
  assert.equal((await ci(e, { code: 'atl', space: 1, status: 'moved' })).status, 429);
  assert.equal((await ci(e, { code: 'lhr', space: 0, status: 'still' })).status, 200);
  assert.equal((await ci(e, { code: 'atl', space: 0, status: 'still' }, { ip: '198.51.100.7' })).status, 200);
  const g = await (await getCi(e, 'atl')).json();
  assert.equal(g.spaces['0'].still, 4);
  assert.equal(g.spaces['1'], undefined);
});

test('check-in: honeypot pretends success and stores nothing', async () => {
  const e = env();
  const r = await ci(e, { code: 'atl', space: 0, status: 'still', website: 'http://spam' });
  assert.equal(r.status, 200);
  assert.equal(e.KV.m.size, 0);
});

test('check-in: body limit, origin and validation', async () => {
  const e = env();
  assert.equal((await ci(e, { code: 'atl', space: 0, status: 'still' }, { len: 513 })).status, 413);
  assert.equal((await ci(e, { code: 'atl', space: 0, status: 'still', pad: 'x'.repeat(600) })).status, 413);
  assert.equal((await ci(e, { code: 'atl', space: 0, status: 'still' }, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await ci(e, { code: 'zzz', space: 0, status: 'still' })).status, 400);
  assert.equal((await ci(e, { code: 'atl', space: 0, status: 'gone' })).status, 400);
  assert.equal((await ci(e, { code: 'atl', space: -1, status: 'still' })).status, 400);
  assert.equal((await ci(e, { code: 'atl', space: 1.5, status: 'still' })).status, 400);
  assert.equal((await ci(e, { code: 'atl', space: 99, status: 'still' })).status, 400);
  assert.equal((await checkin.onRequestPost({ request: post('/api/checkin', '{not json'), env: e })).status, 400);
  assert.equal(e.KV.keys('checkin:').length, 0);
  assert.equal((await getCi(e, 'nope')).status, 400);
  assert.deepEqual((await (await getCi(e, 'atl')).json()).spaces, {});
});

test('aggregate: last "still here", 90-day window and the "may have changed" note', () => {
  const D = 86400000, t0 = Date.parse('2026-01-01T12:00:00Z');
  let a = null;
  a = checkin.addCheckin(a, 0, 'still', t0);
  a = checkin.addCheckin(a, 0, 'still', t0);
  a = checkin.addCheckin(a, 0, 'closed', t0 + 100 * D); // the old still-heres are now outside the window
  let s = checkin.summarise(a, t0 + 100 * D)['0'];
  assert.equal(s.still, 2); assert.equal(s.closed, 1);
  assert.equal(s.lastStill, '2026-01-01');
  assert.equal(s.daysSinceStill, 100);
  assert.deepEqual(s.recent, { still: 0, moved: 0, closed: 1 });
  assert.equal(s.mayHaveChanged, true);
  assert.equal(Object.keys(a.s['0'].d).length, 1, 'day buckets older than 90 days pruned');
  a = checkin.addCheckin(a, 0, 'still', t0 + 101 * D);
  s = checkin.summarise(a, t0 + 101 * D)['0'];
  assert.equal(s.mayHaveChanged, false, 'a tie is not "changed"');
  assert.equal(s.daysSinceStill, 0);
  a = checkin.addCheckin(a, 0, 'moved', t0 + 102 * D);
  assert.equal(checkin.summarise(a, t0 + 102 * D)['0'].mayHaveChanged, true);
});

// --- photos ---
// A minimal well-formed JPEG: SOI, APP0 JFIF, APP1 Exif (with fake GPS text), COM, SOF0 (w x h), SOS + data, EOI.
function jpeg(w, h, { exif = true, pad = 0 } = {}) {
  const seg = (m, payload) => [0xff, m, (payload.length + 2) >> 8, (payload.length + 2) & 255, ...payload];
  const txt = (s) => [...new TextEncoder().encode(s)];
  return new Uint8Array([
    0xff, 0xd8,
    ...seg(0xe0, txt('JFIF\0\x01\x01\0\0\x01\0\x01\0\0')),
    ...(exif ? seg(0xe1, txt('Exif\0\0GPS 34.0522N 118.2437W')) : []),
    ...seg(0xfe, txt('camera comment')),
    ...seg(0xc0, [8, h >> 8, h & 255, w >> 8, w & 255, 1, 1, 0x11, 0]),
    ...seg(0xda, [1, 1, 0, 0, 63, 0]), 1, 2, 3, ...new Array(pad).fill(7),
    0xff, 0xd9,
  ]);
}
const upload = (e, fields, bytes, opts) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  if (bytes) f.set('photo', new Blob([bytes], { type: 'image/jpeg' }), 'p.jpg');
  return photo.onRequestPost({ request: post('/api/photo', f, { type: null, ...opts }), env: e });
};
const getPhoto = (e, q) => photo.onRequestGet({ request: new Request(`${ORIGIN}/api/photo?${q}`), env: e });

test('cleanJpeg strips EXIF and comments and reads the size', () => {
  const out = photo.cleanJpeg(jpeg(1200, 900).buffer);
  assert.equal(out.w, 1200); assert.equal(out.h, 900);
  const s = new TextDecoder('latin1').decode(out.bytes);
  assert.ok(!s.includes('Exif') && !s.includes('GPS') && !s.includes('camera comment'));
  assert.ok(s.includes('JFIF'));
  assert.equal(photo.cleanJpeg(new TextEncoder().encode('<svg/>').buffer), null);
  assert.equal(photo.cleanJpeg(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 99]).buffer), null);
});

test('photo upload: pending only, never served until approved', async () => {
  const e = env();
  const r = await upload(e, { code: 'atl', space: '0', consent: 'yes' }, jpeg(1600, 1200));
  assert.equal(r.status, 200);
  const pending = e.KV.keys('pending:photo:');
  assert.equal(pending.length, 1);
  const { v, opts } = e.KV.m.get(pending[0]);
  assert.equal(opts.expirationTtl, 60 * 60 * 24 * 180);
  assert.equal(opts.metadata.code, 'atl'); assert.equal(opts.metadata.w, 1600);
  assert.ok(!new TextDecoder('latin1').decode(v).includes('GPS'), 'stored without EXIF');
  const id = pending[0].slice('pending:photo:'.length);
  // Not listed, not servable.
  assert.deepEqual((await (await getPhoto(e, 'code=atl')).json()).photos, []);
  assert.equal((await getPhoto(e, `code=atl&id=${id}`)).status, 404);
  assert.equal((await getPhoto(e, `code=atl&id=../pending:photo:${id}`)).status, 400);
  // Approve the way scripts/moderate.mjs does.
  await e.KV.put(`photo:atl:${id}`, v, { metadata: opts.metadata });
  await e.KV.put('photos:atl', JSON.stringify([{ id, w: 1600, h: 1200, date: opts.metadata.date, space: 0 }]));
  const list = (await (await getPhoto(e, 'code=atl')).json()).photos;
  assert.equal(list[0].id, id);
  const img = await getPhoto(e, `code=atl&id=${id}`);
  assert.equal(img.status, 200);
  assert.equal(img.headers.get('content-type'), 'image/jpeg');
  assert.match(img.headers.get('cache-control'), /max-age=31536000/);
  assert.equal((await getPhoto(e, `code=lhr&id=${id}`)).status, 404, 'id is scoped to its airport');
});

test('photo upload: consent, honeypot, size, dimensions, type, origin and daily limit', async () => {
  const e = env();
  assert.equal((await upload(e, { code: 'atl', space: '0' }, jpeg(800, 600))).status, 400, 'tick required');
  assert.equal((await upload(e, { code: 'atl', space: '0', consent: 'yes', website: 'x' }, jpeg(800, 600))).status, 200);
  assert.equal(e.KV.m.size, 0, 'honeypot stores nothing');
  assert.equal((await upload(e, { code: 'atl', space: '0', consent: 'yes' }, jpeg(2000, 600))).status, 422);
  assert.equal((await upload(e, { code: 'atl', space: '0', consent: 'yes' }, jpeg(800, 600, { pad: photo.MAX_BYTES }))).status, 413);
  assert.equal((await upload(e, { code: 'atl', space: '0', consent: 'yes' }, jpeg(800, 600), { len: 2_000_000 })).status, 413);
  assert.equal((await upload(e, { code: 'atl', space: '0', consent: 'yes' }, new TextEncoder().encode('<svg/>'))).status, 415);
  assert.equal((await upload(e, { code: 'zzz', space: '0', consent: 'yes' }, jpeg(800, 600))).status, 400);
  assert.equal((await upload(e, { code: 'atl', space: '0', consent: 'yes' }, jpeg(800, 600), { origin: 'https://evil.example' })).status, 403);
  assert.equal(e.KV.keys('pending:').length, 0);
  for (let i = 0; i < 3; i++) assert.equal((await upload(e, { code: 'atl', space: '0', consent: 'yes' }, jpeg(800, 600))).status, 200);
  assert.equal((await upload(e, { code: 'lhr', space: '0', consent: 'yes' }, jpeg(800, 600))).status, 429, '3 photos per IP per day');
  assert.equal(e.KV.keys('pending:photo:').length, 3);
});

test('cleanJpeg sanitises every scan of a progressive JPEG and drops bytes after EOI', () => {
  const seg = (m, payload) => [0xff, m, (payload.length + 2) >> 8, (payload.length + 2) & 255, ...payload];
  const txt = (s) => [...new TextEncoder().encode(s)];
  const prog = new Uint8Array([
    0xff, 0xd8,
    ...seg(0xe0, txt('JFIF\0\x01\x01\0\0\x01\0\x01\0\0')),
    ...seg(0xc2, [8, 0, 100, 0, 200, 1, 1, 0x11, 0]), // SOF2 (progressive), 200 x 100
    ...seg(0xda, [1, 1, 0, 0, 0, 0]), 9, 0xff, 0x00, 9, 0xff, 0xd0, 9, // scan 1 with a stuffed byte and a restart marker
    ...seg(0xe1, txt('Exif\0\0GPS 51.4700N 0.4543W')), // metadata between scans
    ...seg(0xfe, txt('hidden comment')),
    ...seg(0xda, [1, 1, 0, 1, 63, 0]), 8, 8, // scan 2
    0xff, 0xd9,
    ...txt('TRAILING GPS 40.6413N'), // junk after EOI
  ]);
  const out = photo.cleanJpeg(prog.buffer);
  assert.ok(out);
  assert.equal(out.w, 200); assert.equal(out.h, 100);
  const s = new TextDecoder('latin1').decode(out.bytes);
  assert.ok(!s.includes('Exif') && !s.includes('GPS') && !s.includes('hidden comment') && !s.includes('TRAILING'));
  assert.equal(s.split('\xff\xda').length - 1, 2, 'both scans kept');
  assert.ok(s.includes('\xff\x00') && s.includes('\xff\xd0'), 'stuffed bytes and restart markers kept');
  assert.deepEqual([...out.bytes.slice(-2)], [0xff, 0xd9]);
  assert.equal(photo.cleanJpeg(prog.slice(0, prog.indexOf(0xd9, 40) - 1).buffer), null, 'no EOI → rejected');
});

test('photo GET serves only ids on the approved list', async () => {
  const e = env();
  await e.KV.put('photo:atl:0123456789abcdef', new Uint8Array([0xff, 0xd8, 0xff, 0xd9]));
  assert.equal((await getPhoto(e, 'code=atl&id=0123456789abcdef')).status, 404, 'blob without a list entry is not served');
  await e.KV.put('photos:atl', JSON.stringify([{ id: '0123456789abcdef', w: 1, h: 1, date: '2026-10-13', space: 0 }]));
  assert.equal((await getPhoto(e, 'code=atl&id=0123456789abcdef')).status, 200);
  await e.KV.put('photos:atl', '{broken');
  assert.equal((await getPhoto(e, 'code=atl&id=0123456789abcdef')).status, 404);
});

test('moderate.mjs: missing key vs read errors, and deletes that fail', async () => {
  const mod = await import('../scripts/moderate.mjs');
  const fail = (stdout, stderr) => () => { const e = new Error('Command failed'); e.stdout = stdout; e.stderr = stderr; throw e; };
  assert.equal(mod.readText(() => Buffer.from('Value not found\n'), 'photos:atl'), null);
  assert.equal(mod.readText(fail('', 'Value not found'), 'photos:atl'), null);
  assert.throws(() => mod.readText(fail('', 'Authentication error [code: 10000]'), 'photos:atl'), /Couldn't read photos:atl/);
  assert.deepEqual(mod.readList(() => Buffer.from('Value not found'), 'atl'), []);
  assert.deepEqual(mod.readList(() => Buffer.from('[{"id":"a"}]'), 'atl'), [{ id: 'a' }]);
  assert.throws(() => mod.readList(fail('', 'fetch failed'), 'atl'), /Couldn't read/, 'a failed read never becomes an empty list');
  assert.throws(() => mod.readList(() => Buffer.from('<html>'), 'atl'), /isn't valid JSON/);
  assert.throws(() => mod.readList(() => Buffer.from('{}'), 'atl'), /isn't a list/);
  let calls = 0;
  mod.deleteKey(() => { if (++calls < 3) throw new Error('flaky'); }, 'k');
  assert.equal(calls, 3, 'retried until it worked');
  assert.throws(() => mod.deleteKey(fail('', 'network down'), 'photo:atl:x'), /Couldn't delete photo:atl:x after 3 tries/);
});
