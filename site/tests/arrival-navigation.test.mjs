import test from 'node:test';
import assert from 'node:assert/strict';
import { arrivalNavigationHref, initArrivalNavigation } from '../src/lib/arrival-navigation.js';

const location = (path, search = '') => ({ pathname: path, search });

test('current directory navigation preserves useful state and removes invalid parameters', () => {
  const query = '?q=%20London%20&country=gb&f=women,wudu,evil,wudu&mode=map&view=cards&sort=name&page=03&airport=lhr&redirect=https://evil.test&browse=q%3Dnested';
  const href = arrivalNavigationHref('/airports/', location('/airports/', query));
  assert.equal(href, '/airports/?q=London&country=GB&f=women%2Cwudu&mode=map&view=cards&sort=name&page=3&airport=lhr');
  assert.equal(arrivalNavigationHref('/airports/', location('/airports/', '?region=All&country=invalid&f=invalid&mode=unknown&sort=unknown&page=-1&airport=bad/code')), '/airports/');
});

test('a place uses the sanitized browse context rather than unrelated detail parameters', () => {
  const search = '?' + new URLSearchParams({ browse: 'q=Paris&country=FR&f=women,wudu&page=2&mode=list&redirect=evil', q: 'ignored', report: 'ok' });
  assert.equal(arrivalNavigationHref('/airports/', location('/airports/cdg/', search)), '/airports/?q=Paris&country=FR&f=women%2Cwudu&mode=list&page=2');
  assert.equal(arrivalNavigationHref('/airports/', location('/airports/cdg/', '?q=ignored&mode=map')), '/airports/');
  assert.equal(arrivalNavigationHref('/airports/', location('/airports/cdg/', '?browse=redirect%3Devil')), '/airports/');
});

test('all locales and categories retain their exact mounted link paths', () => {
  const mount = '/aroomtopray-preview';
  const search = '?' + new URLSearchParams({ browse: 'q=مستشفى &country=MA&mode=list' });
  for (const locale of ['', 'fr/', 'ar/', 'es/']) for (const category of ['airports', 'universities', 'hospitals']) {
    const path = `${mount}/${locale}${category}/`;
    const returned = new URL(arrivalNavigationHref(path, location(path + 'example/', search), mount), 'https://preview.test');
    assert.equal(returned.pathname, path);
    assert.equal(returned.searchParams.get('q'), 'مستشفى');
    assert.equal(returned.searchParams.get('country'), 'MA');
    const direct = arrivalNavigationHref(path, location(path, '?country=ES&mode=list'), mount);
    assert.equal(direct, `${path}?country=ES&mode=list`);
  }
  assert.equal(arrivalNavigationHref(`${mount}/ar/airports/`, location(`${mount}/fr/airports/lhr/`, '?browse=country%3DGB'), mount), `${mount}/ar/airports/?country=GB`);
});

test('search and facilities never leak into a different category or a support page', () => {
  for (const current of ['/airports/', '/airports/lhr/']) {
    const state = location(current, '?country=GB&f=airside&browse=country%3DGB%26f%3Dairside');
    assert.equal(arrivalNavigationHref('/universities/', state), '/universities/');
    assert.equal(arrivalNavigationHref('/hospitals/', state), '/hospitals/');
  }
  assert.equal(arrivalNavigationHref('/hospitals/', location('/visit/', '?browse=country%3DGB')), '/hospitals/');
});

test('external destinations and lookalike routes cannot receive browse context', () => {
  const state = location('/airports/lhr/', '?browse=q%3DLondon');
  for (const target of ['https://evil.test/airports/', '//evil.test/airports/', '/airports/lhr/', '/about/', '/airports/?redirect=evil']) {
    assert.equal(arrivalNavigationHref(target, state), target);
  }
  assert.equal(arrivalNavigationHref('/aroomtopray-preview/airports/', location('/aroomtopray-preview-other/airports/', '?q=London'), '/aroomtopray-preview'), '/aroomtopray-preview/airports/');
  assert.equal(arrivalNavigationHref('/fr/airports/', location('/de/airports/lhr/', '?browse=q%3DLondon')), '/fr/airports/');
});

function eventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, listener) { const values = listeners.get(type) || []; values.push(listener); listeners.set(type, values); },
    listenerCount(type) { return (listeners.get(type) || []).length; },
    emit(type, values = {}) {
      const event = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...values };
      for (const listener of listeners.get(type) || []) listener(event);
      return event;
    },
  };
}
function fixture() {
  const mount = '/aroomtopray-preview';
  const links = ['airports', 'universities', 'hospitals', 'airports'].map(kind => {
    let href = `${mount}/ar/${kind}/`;
    return { ...eventTarget(), getAttribute: name => name === 'href' ? href : null, setAttribute(name, value) { if (name === 'href') href = value; } };
  });
  const doc = { ...eventTarget(), querySelectorAll: () => links };
  const browser = { ...eventTarget(), location: location(`${mount}/ar/airports/`, '?country=GB') };
  initArrivalNavigation(doc, browser, mount);
  return { links, doc, browser, mount };
}

test('header and menu links follow filters, map selection, history and restored pages', () => {
  const f = fixture();
  for (const link of [f.links[0], f.links[3]]) assert.equal(link.getAttribute('href'), `${f.mount}/ar/airports/?country=GB`);
  f.browser.location.search = '?country=MA&mode=map'; f.doc.emit('directory:updated');
  f.browser.location.search += '&airport=cmn'; f.doc.emit('atlas:selection');
  assert.equal(f.links[3].getAttribute('href'), `${f.mount}/ar/airports/?country=MA&mode=map&airport=cmn`);
  f.browser.location.search = ''; f.browser.emit('popstate');
  assert.equal(f.links[0].getAttribute('href'), `${f.mount}/ar/airports/`);
  f.browser.location.search = '?q=London'; f.browser.emit('pageshow', { persisted: true });
  assert.equal(f.links[0].getAttribute('href'), `${f.mount}/ar/airports/?q=London`);
  assert.equal(f.links[1].getAttribute('href'), `${f.mount}/ar/universities/`);
});

test('native activation refreshes stale context without intercepting clicks or copying', () => {
  const f = fixture();
  for (const event of ['focus', 'pointerenter', 'pointerdown', 'click', 'auxclick', 'contextmenu']) {
    f.browser.location.search = `?q=${event}`;
    assert.equal(f.links[0].emit(event, { ctrlKey: true, metaKey: true, button: 1 }).defaultPrevented, false);
    assert.equal(f.links[0].getAttribute('href'), `${f.mount}/ar/airports/?q=${event}`);
  }
});

test('reinitialization cannot capture an enriched href or duplicate event listeners', () => {
  const f = fixture();
  initArrivalNavigation(f.doc, f.browser, f.mount);
  assert.equal(f.doc.listenerCount('directory:updated'), 1);
  assert.equal(f.browser.listenerCount('popstate'), 1);
  assert.equal(f.links[0].listenerCount('click'), 1);
  f.browser.location.search = '?country=FR'; f.doc.emit('directory:updated');
  assert.equal(f.links[0].getAttribute('href'), `${f.mount}/ar/airports/?country=FR`);
});
