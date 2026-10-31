import test from 'node:test';
import assert from 'node:assert/strict';
import { boundedMapTransform, zoomMapAt, readMapSelection, writeMapSelection } from '../src/lib/airport-map-state.js';

test('selection survives reload and filter changes, and clearing it retains directory state', () => {
  const codes = new Set(['lhr', 'cdg']);
  const selected = writeMapSelection('lhr', '?country=GB&f=wudu&mode=map');
  assert.equal(readMapSelection(selected, codes), 'lhr');
  const filtered = new URLSearchParams(selected);
  filtered.set('country', 'FR');
  assert.equal(readMapSelection(filtered, codes), 'lhr');
  assert.equal(writeMapSelection('', filtered), 'country=FR&f=wudu&mode=map');
  assert.equal(readMapSelection('?airport=unknown', codes), '');
  assert.equal(readMapSelection('?airport=https://example.com', codes), '');
});

test('map panning never exposes an empty viewport and reset returns to the whole world', () => {
  assert.deepEqual(boundedMapTransform({ x: 100, y: -9999, k: 3 }, 1200, 640), { x: 0, y: -1280, k: 3 });
  assert.deepEqual(boundedMapTransform({ x: -9999, y: 90, k: 1 }, 1200, 640), { x: 0, y: 0, k: 1 });
  assert.deepEqual(boundedMapTransform({ x: NaN, y: Infinity, k: NaN }, 1200, 640), { x: 0, y: 0, k: 1 });
  assert.equal(boundedMapTransform({ k: 100 }, 1200, 640).k, 7);
});

test('zooming keeps the chosen map point stationary, within zoom and pan bounds', () => {
  const transform = { x: -250, y: -100, k: 2 };
  const anchor = { x: 600, y: 320 };
  const next = zoomMapAt(transform, 1.5, anchor, 1200, 640);
  assert.equal((anchor.x - transform.x) / transform.k, (anchor.x - next.x) / next.k);
  assert.equal((anchor.y - transform.y) / transform.k, (anchor.y - next.y) / next.k);
  assert.deepEqual(zoomMapAt(next, 0.01, anchor, 1200, 640), { x: 0, y: 0, k: 1 });
  assert.equal(zoomMapAt(transform, 100, anchor, 1200, 640).k, 7);
});
