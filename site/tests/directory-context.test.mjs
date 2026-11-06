import test from 'node:test';
import assert from 'node:assert/strict';
import { browseQuery, withBrowseContext, returnToDirectory } from '../src/lib/directory-context.js';
import { readDirectoryState } from '../src/lib/directory-state.js';
import { readCountry } from '../src/lib/countries.js';
import { readPresentation, readDirectoryMode } from '../src/lib/directory-presentation.js';
import { readPage } from '../src/lib/directory-pagination.js';
import { readMapSelection } from '../src/lib/airport-map-state.js';

test('selected airport room survives the guide round trip and invalid room values are removed', () => {
 const guide=new URL(withBrowseContext('/airports/lhr/','?mode=map&airport=lhr&room=2&f=wudu'),'https://local.test');
 const returned=new URL(returnToDirectory('/airports/',guide.search),'https://local.test');
 assert.equal(returned.searchParams.get('room'),'2');
 for(const query of ['room=2','airport=lhr&room=0','airport=lhr&room=-1','airport=lhr&room=1.2','airport=lhr&room=1000'])assert.equal(new URLSearchParams(browseQuery(query)).has('room'),false);
});

test('a guide round trip preserves search, country, facilities, page, sort and selected airport across languages', () => {
  const search = '?q=London&country=GB&f=women,wudu&sort=name&view=cards&page=3&mode=list&airport=lhr';
  const guide = new URL(withBrowseContext('/fr/airports/lhr/', search), 'https://local.test');
  // Language switching keeps the query but uses the destination language's directory.
  const returned = new URL(returnToDirectory('/ar/airports/', guide.search), 'https://local.test');
  assert.equal(returned.pathname, '/ar/airports/');
  assert.deepEqual(readDirectoryState(returned.search, ['All'], ['women', 'wudu']), { q: 'London', region: 'All', f: new Set(['women', 'wudu']) });
  assert.equal(readCountry(returned.search, ['GB']), 'GB');
  assert.deepEqual(readPresentation(returned.search), { view: 'cards', sort: 'name' });
  assert.equal(readPage(returned.search), 3);
  assert.equal(readDirectoryMode(returned.search, true), 'list');
  assert.equal(readMapSelection(returned.search, new Set(['lhr'])), 'lhr');
});

test('all categories and supported locales can return to their own results', () => {
  const search = new URLSearchParams({ q: 'مستشفى & Córdoba', country: 'ES', mode: 'list' });
  for (const locale of ['', 'fr/', 'ar/', 'es/']) for (const category of ['airports', 'universities', 'hospitals']) {
    const path = `/${locale}${category}/`;
    const guide = new URL(withBrowseContext(path + 'example/', search), 'https://local.test');
    const returned = new URL(returnToDirectory(path, guide.search), 'https://local.test');
    assert.equal(returned.pathname, path);
    assert.equal(returned.searchParams.get('q'), 'مستشفى & Córdoba');
    assert.equal(returned.searchParams.get('country'), 'ES');
  }
});

test('return context cannot create external, nested or unrelated navigation', () => {
  assert.equal(returnToDirectory('//evil.test/', '?browse=q%3Dx'), null);
  assert.equal(returnToDirectory('/about/', '?browse=q%3Dx'), null);
  assert.equal(returnToDirectory('/airports/', '?browse=https%3A%2F%2Fevil.test'), null);
  assert.equal(withBrowseContext('https://evil.test/airports/lhr/', '?q=London'), 'https://evil.test/airports/lhr/');
  const cleaned = new URLSearchParams(browseQuery('?browse=q%3Dnested&report=ok&redirect=evil&country=invalid&page=-2&mode=unknown&f=wudu,invalid,wudu'));
  assert.deepEqual([...cleaned], [['f', 'wudu']]);
  assert.equal(browseQuery('?q=' + 'a'.repeat(1000)).length, 162);
});

test('direct visits and unfiltered links keep the original directory navigation', () => {
  assert.equal(withBrowseContext('/universities/oxford/', ''), '/universities/oxford/');
  assert.equal(returnToDirectory('/hospitals/', ''), null);
  assert.equal(returnToDirectory('/hospitals/', '?browse=report%3Dok'), null);
});

test('a selected airport room survives a localized guide round trip', () => {
  const guide = new URL(withBrowseContext('/fr/airports/lhr/', '?airport=lhr&room=3&mode=map&f=airside,wudu'), 'https://local.test');
  const returned = new URL(returnToDirectory('/ar/airports/', guide.search), 'https://local.test');
  assert.equal(returned.searchParams.get('airport'), 'lhr');
  assert.equal(returned.searchParams.get('room'), '3');
  assert.equal(returned.searchParams.get('mode'), 'map');
  assert.equal(returned.searchParams.get('f'), 'airside,wudu');
});

test('room context requires a syntactically valid airport selection', () => {
  for (const search of ['?room=2', '?place=oxford&room=2', '?airport=INVALID&room=2', '?airport=../lhr&room=2']) {
    assert.equal(new URLSearchParams(browseQuery(search)).has('room'), false);
  }
  assert.equal(new URLSearchParams(browseQuery('?airport=lhr&room=1')).get('room'), '1');
  assert.equal(new URLSearchParams(browseQuery('?airport=lhr&room=999')).get('room'), '999');
});

test('malformed room values are discarded without losing the airport or search', () => {
  for (const room of ['', '0', '-1', '01', '1.5', '1e2', '1000', 'Infinity', 'no']) {
    const search = new URLSearchParams({ airport:'lhr', room, q:'London', mode:'map' });
    const cleaned = new URLSearchParams(browseQuery(search));
    assert.equal(cleaned.has('room'), false, room);
    assert.equal(cleaned.get('airport'), 'lhr');
    assert.equal(cleaned.get('q'), 'London');
    assert.equal(cleaned.get('mode'), 'map');
  }
});
