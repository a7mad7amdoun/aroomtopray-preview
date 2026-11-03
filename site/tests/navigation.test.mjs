import test from 'node:test';
import assert from 'node:assert/strict';
import { initSiteMenu, initSiteNavigation } from '../src/scripts/navigation.js';

function element(root) {
  const listeners = new Map(), attributes = new Map();
  return {
    open: false, hidden: false,
    addEventListener(type, listener) { const current = listeners.get(type) || []; current.push(listener); listeners.set(type, current); },
    setAttribute(name, value) { attributes.set(name, value); },
    getAttribute(name) { return attributes.get(name); },
    focus() { root.activeElement = this; },
    emit(type, props = {}) {
      const event = { target: this, button: 0, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...props };
      for (const listener of listeners.get(type) || []) listener(event);
      return event;
    },
  };
}
function fixture() {
  const root = {}, document = Object.assign(root, element(root)), browser = element(root);
  const menu = element(root), summary = element(root), panel = element(root);
  const language = element(root), theme = element(root), guide = element(root), saved = element(root), contact = element(root), outside = element(root);
  const controls = [language, theme, guide, saved, contact], links = [guide, saved, contact];
  menu.querySelector = selector => ({ summary, '.site-menu-panel': panel })[selector];
  menu.contains = target => [menu, summary, panel, ...controls].includes(target);
  panel.querySelectorAll = selector => selector === 'a' ? links : controls;
  initSiteMenu(menu, document, browser);
  return { document, browser, menu, summary, panel, language, theme, guide, saved, contact, outside };
}

test('native disclosure state is exposed without overriding Enter, Space, or Tab', () => {
  const f = fixture();
  assert.equal(f.summary.getAttribute('aria-expanded'), 'false');
  for (const key of ['Enter', ' ', 'Tab']) assert.equal(f.summary.emit('keydown', { key }).defaultPrevented, false);
  f.menu.open = true;
  f.menu.emit('toggle');
  assert.equal(f.summary.getAttribute('aria-expanded'), 'true');
  f.menu.open = false;
  f.menu.emit('toggle');
  assert.equal(f.summary.getAttribute('aria-expanded'), 'false');
});

test('summary arrow shortcuts enter the first preference or last tool without capturing modified keys', () => {
  const f = fixture();
  assert.equal(f.summary.emit('keydown', { key: 'ArrowDown' }).defaultPrevented, true);
  assert.equal(f.menu.open, true);
  assert.equal(f.document.activeElement, f.language);
  f.summary.emit('keydown', { key: 'ArrowUp' });
  assert.equal(f.document.activeElement, f.contact);
  assert.equal(f.summary.emit('keydown', { key: 'ArrowDown', ctrlKey: true }).defaultPrevented, false);
  assert.equal(f.document.activeElement, f.contact);
});

test('Escape closes the disclosure and returns focus only when focus was inside it', () => {
  const f = fixture();
  f.summary.emit('keydown', { key: 'ArrowDown' });
  assert.equal(f.document.emit('keydown', { key: 'Escape' }).defaultPrevented, true);
  assert.equal(f.menu.open, false);
  assert.equal(f.document.activeElement, f.summary);
  assert.equal(f.summary.getAttribute('aria-expanded'), 'false');
  f.menu.open = true;
  f.outside.focus();
  f.document.emit('keydown', { key: 'Escape' });
  assert.equal(f.document.activeElement, f.outside);
});

test('outside click and focus departure close the menu without stealing focus', () => {
  const f = fixture();
  f.menu.open = true;
  f.document.emit('click', { target: f.theme });
  assert.equal(f.menu.open, true);
  f.menu.emit('focusout', { relatedTarget: f.saved });
  assert.equal(f.menu.open, true);
  f.outside.focus();
  f.menu.emit('focusout', { relatedTarget: f.outside });
  assert.equal(f.menu.open, false);
  assert.equal(f.document.activeElement, f.outside);
  f.menu.open = true;
  f.document.emit('click', { target: f.outside });
  assert.equal(f.menu.open, false);
  assert.equal(f.document.activeElement, f.outside);
});

test('tool links retain native navigation and modified clicks keep the menu open', () => {
  const f = fixture();
  for (const options of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { button: 1 }, { defaultPrevented: true }]) {
    f.menu.open = true;
    f.guide.emit('click', options);
    assert.equal(f.menu.open, true);
  }
  f.menu.open = true;
  assert.equal(f.guide.emit('click').defaultPrevented, false);
  assert.equal(f.menu.open, false);
});

test('restored pages do not leave focus hidden in the menu and initialization is idempotent', () => {
  const f = fixture();
  initSiteMenu(f.menu, f.document, f.browser);
  f.menu.open = true;
  f.saved.focus();
  f.browser.emit('pageshow', { persisted: true });
  assert.equal(f.menu.open, false);
  assert.equal(f.document.activeElement, f.summary);
  f.outside.focus();
  assert.equal(f.document.emit('keydown', { key: 'Escape' }).defaultPrevented, false);
  assert.equal(f.document.activeElement, f.outside);
});

// The old destination-card arrow uses a 32px yellow circle on direct child
// spans. A shared class once made every masthead label inherit that styling.
test('masthead labels do not match legacy destination-card circle selectors', async () => {
  const { readFile } = await import('node:fs/promises');
  const header = await readFile(new URL('../src/components/HeaderNavigation.astro', import.meta.url), 'utf8');
  const legacy = await readFile(new URL('../src/styles/experience.css', import.meta.url), 'utf8');
  const navigation = header.match(/<nav class="primary-navigation"[\s\S]*?<\/nav>/)?.[0];
  assert.ok(navigation, 'The three primary destinations remain in a named navigation');
  const linkClasses = navigation.match(/<a class="([^"]+)"/)?.[1].split(/\s+/) || [];
  const circularChildRules = [...legacy.matchAll(/\.([\w-]+)\s*>\s*span\s*\{([^{}]*)\}/g)]
    .filter(([, , declarations]) => /border-radius:\s*50%/.test(declarations) && /width:\s*32px/.test(declarations));
  assert.ok(circularChildRules.length, 'The legacy card treatment remains available for its original content');
  for (const [, ancestorClass] of circularChildRules) {
    assert.ok(!linkClasses.includes(ancestorClass), `Header labels must not inherit .${ancestorClass}>span circle dimensions`);
  }
});


test('restoring a page refreshes saved totals after a place was changed elsewhere in the same tab', () => {
  const root = {}, document = Object.assign(root, element(root)), browser = element(root), count = element(root);
  let saved = '["/airports/lhr/"]';
  browser.localStorage = { getItem: () => saved };
  browser.location = new URL('https://example.test/');
  document.querySelector = selector => selector === '[data-saved-count]' ? count : null;
  document.querySelectorAll = () => [];
  initSiteNavigation(document, browser);
  assert.equal(count.textContent, '1'); assert.equal(count.hidden, false);
  saved = '[]'; browser.emit('pageshow', { persisted: true });
  assert.equal(count.textContent, '0'); assert.equal(count.hidden, true);
  saved = '["/airports/lhr/", "/universities/example/"]'; browser.emit('pageshow', { persisted: true });
  assert.equal(count.textContent, '2'); assert.equal(count.hidden, false);
});
