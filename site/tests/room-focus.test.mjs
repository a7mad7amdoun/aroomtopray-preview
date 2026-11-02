import test from 'node:test';
import assert from 'node:assert/strict';
import { initRoomFocus, ROOM_FOCUS_KEY } from '../src/scripts/room-focus.js';

function fixture({ saved, legacy, focused, blocked, hasRoom = true } = {}) {
  const storage = new Map([
    ['aroomtopray.theme.v1', 'dark'],
    ['aroomtopray.saved-places.v1', '["/airports/lhr/"]'],
    ['directory-query', 'London'],
  ]);
  if (saved !== undefined) storage.set(ROOM_FOCUS_KEY, String(saved));
  if (legacy !== undefined) storage.set('aroomtopray.focus.v1', String(legacy));
  const root = { dataset: { theme: 'dark' } };
  if (focused !== undefined) root.dataset.roomFocus = String(focused);
  const room = { hidden: true, dataset: { doorState: 'closed', roomPreview: 'campus' } };
  const main = {
    hidden: false,
    innerHTML: '<section id="find-place">Unchanged guide</section>',
    dataset: { query: 'London', country: 'GB', mode: 'map', page: '2' },
  };
  const browser = {
    listeners: {},
    location: { pathname: '/airports/', search: '?q=London&country=GB&mode=map&page=2', hash: '#browse' },
    addEventListener(event, listener) { this.listeners[event] = listener; },
  };
  Object.defineProperty(browser, 'sessionStorage', {
    get() {
      if (blocked === 'access') throw new Error('Storage access denied');
      return {
        removeItem(key) {
          if (blocked === 'remove') throw new Error('Storage write denied');
          storage.delete(key);
        },
      };
    },
  });
  const queried = [];
  const doc = {
    documentElement: root,
    querySelector(selector) {
      queried.push(selector);
      if (selector !== '#prayer-room') throw new Error(`Unexpected obsolete control query: ${selector}`);
      return hasRoom ? room : null;
    },
  };
  const originalMain = structuredClone(main);
  const originalLocation = structuredClone(browser.location);
  // Focus and scrolling APIs are deliberately absent: migration must not need them.
  initRoomFocus(doc, browser);
  return { root, room, main, browser, storage, queried, doc, originalMain, originalLocation };
}

test('the unified page keeps the room visible without requiring former mode controls', () => {
  const f = fixture();
  assert.equal(f.room.hidden, false);
  assert.equal(Object.hasOwn(f.root.dataset, 'roomFocus'), false);
  assert.deepEqual(f.queried, ['#prayer-room']);
});

test('both stored mode choices and stale root state are retired', () => {
  for (const saved of [true, false]) {
    const f = fixture({ saved, legacy: true, focused: true });
    assert.equal(f.room.hidden, false);
    assert.equal(Object.hasOwn(f.root.dataset, 'roomFocus'), false);
    assert.equal(f.storage.has(ROOM_FOCUS_KEY), false);
    assert.equal(f.storage.has('aroomtopray.focus.v1'), false);
  }
});

test('page restoration clears a stale hidden room without changing its selected scene or door', () => {
  const f = fixture();
  f.root.dataset.roomFocus = 'true';
  f.room.hidden = true;
  f.room.dataset.doorState = 'open';
  f.storage.set(ROOM_FOCUS_KEY, 'true');
  f.browser.listeners.pageshow();
  assert.equal(f.room.hidden, false);
  assert.equal(Object.hasOwn(f.root.dataset, 'roomFocus'), false);
  assert.equal(f.storage.has(ROOM_FOCUS_KEY), false);
  assert.deepEqual(f.room.dataset, { doorState: 'open', roomPreview: 'campus' });
});

test('blocked storage cannot prevent unified visibility on init or page restoration', () => {
  for (const blocked of ['access', 'remove']) {
    const f = fixture({ saved: true, focused: true, blocked });
    assert.equal(f.room.hidden, false);
    assert.equal(Object.hasOwn(f.root.dataset, 'roomFocus'), false);
    f.root.dataset.roomFocus = 'true';
    f.room.hidden = true;
    f.browser.listeners.pageshow();
    assert.equal(f.room.hidden, false);
    assert.equal(Object.hasOwn(f.root.dataset, 'roomFocus'), false);
  }
});

test('migration leaves search, filters, location, content, theme, and saved places intact', () => {
  const f = fixture({ saved: true, focused: true });
  assert.deepEqual(f.main, f.originalMain);
  assert.deepEqual(f.browser.location, f.originalLocation);
  f.browser.listeners.pageshow();
  assert.deepEqual(f.main, f.originalMain);
  assert.deepEqual(f.browser.location, f.originalLocation);
  assert.deepEqual(f.root.dataset, { theme: 'dark' });
  assert.deepEqual([...f.storage], [
    ['aroomtopray.theme.v1', 'dark'],
    ['aroomtopray.saved-places.v1', '["/airports/lhr/"]'],
    ['directory-query', 'London'],
  ]);
});

test('pages without a room still clear the obsolete preference safely', () => {
  const f = fixture({ saved: true, focused: true, hasRoom: false });
  assert.equal(f.storage.has(ROOM_FOCUS_KEY), false);
  assert.equal(Object.hasOwn(f.root.dataset, 'roomFocus'), false);
  assert.doesNotThrow(() => f.browser.listeners.pageshow());
});
