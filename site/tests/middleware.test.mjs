// Unit tests for functions/_middleware.js (www redirect + lowercase detail-page redirect). Run: node --test tests/middleware.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/_middleware.js';

const PASS = new Response('next', { status: 200 });
async function run(path, method = 'GET', host = 'https://aroomtopray.com') {
  let called = false;
  const res = await onRequest({ request: new Request(host + path, { method }), next: async () => { called = true; return PASS; } });
  return { res, called };
}
async function redirects(path, to, method = 'GET') {
  const { res, called } = await run(path, method);
  assert.equal(called, false, `${method} ${path} should not reach next()`);
  assert.equal(res.status, 301, `${method} ${path} status`);
  assert.equal(res.headers.get('location'), 'https://aroomtopray.com' + to);
}
async function untouched(path, method = 'GET') {
  const { res, called } = await run(path, method);
  assert.equal(called, true, `${method} ${path} should pass through`);
  assert.equal(res, PASS);
}

test('uppercase airport codes redirect to lowercase with trailing slash', async () => {
  await redirects('/airports/JFK', '/airports/jfk/');
  await redirects('/airports/JFK/', '/airports/jfk/');
  await redirects('/airports/Lhr', '/airports/lhr/');
});

test('mixed-case university and hospital slugs redirect', async () => {
  await redirects('/hospitals/NYP-Weill-Cornell', '/hospitals/nyp-weill-cornell/');
  await redirects('/universities/MIT/', '/universities/mit/');
});

test('query string is preserved as-is', async () => {
  await redirects('/airports/JFK?ref=Mail&x=1', '/airports/jfk/?ref=Mail&x=1');
  await redirects('/hospitals/NYP-Weill-Cornell/?Q=A', '/hospitals/nyp-weill-cornell/?Q=A');
});

test('HEAD redirects too', async () => {
  await redirects('/airports/JFK', '/airports/jfk/', 'HEAD');
});

test('lowercase detail pages pass through (no loop)', async () => {
  await untouched('/airports/jfk/');
  await untouched('/airports/jfk');
  await untouched('/hospitals/nyp-weill-cornell/');
});

test('API, assets, nested, index and other paths pass through', async () => {
  await untouched('/api/checkin');
  await untouched('/api/Checkin');
  await untouched('/_astro/Index.ABC123.css');
  await untouched('/airports/JFK/Photo.jpg');
  await untouched('/airports/JFK/rooms/');
  await untouched('/airports/JFKX/');
  await untouched('/airports/');
  await untouched('/Airports/JFK/');
  await untouched('/travel/Guide/');
});

test('non-GET/HEAD methods pass through', async () => {
  await untouched('/airports/JFK', 'POST');
  await untouched('/hospitals/NYP-Weill-Cornell/', 'PUT');
});

test('www host still redirects to apex first', async () => {
  const { res } = await run('/airports/JFK?x=1', 'GET', 'https://www.aroomtopray.com');
  assert.equal(res.status, 301);
  assert.equal(res.headers.get('location'), 'https://aroomtopray.com/airports/JFK?x=1');
});
