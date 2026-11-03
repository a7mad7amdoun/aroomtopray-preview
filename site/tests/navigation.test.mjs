import test from 'node:test';
import assert from 'node:assert/strict';
import { initSiteMenu } from '../src/scripts/navigation.js';

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
