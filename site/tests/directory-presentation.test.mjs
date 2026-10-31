import test from 'node:test';
import assert from 'node:assert/strict';
import { readPresentation, writePresentation, sortPlaces, readDirectoryMode } from '../src/lib/directory-presentation.js';
import { readDirectoryState, writeDirectoryState } from '../src/lib/directory-state.js';

test('shared card and paginated links remain lists, while explicit map mode survives navigation', () => {
  assert.equal(readDirectoryMode('', true), 'map');
  assert.equal(readDirectoryMode('?view=cards', true), 'list');
  assert.equal(readDirectoryMode('?page=3', true), 'list');
  assert.equal(readDirectoryMode('?mode=map&view=cards&page=3', true), 'map');
  assert.equal(readDirectoryMode('?mode=list&q=lhr', true), 'list');
  assert.equal(readDirectoryMode('?mode=map', false), 'list');
});

test('layout and sorting survive filter changes without dropping existing URL parameters', () => {
  const url = '?view=cards&sort=location&f=wudu&region=Europe&q=Paris';
  const state = readDirectoryState(url, ['All', 'Europe'], ['wudu', 'women']);
  state.f.add('women');
  const next = writePresentation(readPresentation(url), writeDirectoryState(state, url));
  assert.deepEqual(readPresentation(next), { view: 'cards', sort: 'location' });
  assert.equal(new URLSearchParams(next).get('q'), 'Paris');
  assert.equal(new URLSearchParams(next).get('f'), 'women,wudu');
  const reset = writePresentation({ view: 'list', sort: 'default' }, next);
  assert.equal(new URLSearchParams(reset).has('view'), false);
  assert.equal(new URLSearchParams(reset).get('region'), 'Europe');
});
test('unknown presentation options fall back to the full directory order', () => {
  assert.deepEqual(readPresentation('?view=broken&sort=distance'), { view: 'list', sort: 'default' });
});
test('sorting is stable, accent-insensitive and restores original order without mutating input', () => {
  const places = [{ name: 'Zürich', location: 'Zürich', order: 0 }, { name: 'École', location: 'Paris', order: 1 }, { name: 'Alpha', location: 'Paris', order: 2 }];
  const byName = sortPlaces(places, 'name');
  assert.deepEqual(byName.map(p => p.name), ['Alpha', 'École', 'Zürich']);
  assert.deepEqual(sortPlaces(places, 'location').map(p => p.order), [1, 2, 0]);
  assert.deepEqual(sortPlaces(byName, 'default'), places);
  assert.equal(places[0].name, 'Zürich');
});
