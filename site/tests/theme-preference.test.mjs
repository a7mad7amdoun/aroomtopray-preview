import test from 'node:test';
import assert from 'node:assert/strict';
import { THEME_KEY, normalizeTheme, readTheme, saveTheme, applyTheme } from '../src/lib/theme-preference.js';

test('theme choice is explicit and invalid stored choices return to the system', () => {
  for (const value of [null, undefined, '', 'unknown', 'DARK', '<script>']) assert.equal(normalizeTheme(value), 'auto');
  assert.equal(readTheme({ getItem: () => 'dark' }), 'dark');
  assert.equal(readTheme({ getItem: () => 'light' }), 'light');
  assert.equal(readTheme({ getItem: () => 'invalid' }), 'auto');
  assert.equal(readTheme(undefined), 'auto');
});

test('choosing system removes a saved override and blocked storage never throws', () => {
  const items = new Map();
  const storage = { getItem: key => items.get(key), setItem: (key, value) => items.set(key, value), removeItem: key => items.delete(key) };
  assert.equal(saveTheme(storage, 'dark'), true);
  assert.equal(items.get(THEME_KEY), 'dark');
  assert.equal(saveTheme(storage, 'auto'), true);
  assert.equal(items.has(THEME_KEY), false);
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
  assert.equal(readTheme(blocked), 'auto');
  assert.equal(saveTheme(blocked, 'light'), false);
  assert.equal(saveTheme(blocked, 'auto'), false);
});

test('manual appearance overrides the system and automatic appearance follows it', () => {
  const attributes = new Map();
  const element = { setAttribute: (key, value) => attributes.set(key, value), removeAttribute: key => attributes.delete(key) };
  assert.equal(applyTheme(element, 'light', true), 'light');
  assert.equal(attributes.get('data-theme'), 'light');
  assert.equal(applyTheme(element, 'dark', false), 'dark');
  assert.equal(attributes.get('data-theme'), 'dark');
  assert.equal(applyTheme(element, 'auto', true), 'dark');
  assert.equal(attributes.has('data-theme'), false);
  assert.equal(applyTheme(element, 'auto', false), 'light');
});
