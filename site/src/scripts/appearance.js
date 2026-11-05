import { THEME_KEY, normalizeTheme, readTheme, saveTheme, applyTheme } from '../lib/theme-preference.js';

import { READING_KEY, readReading, saveReading, applyReading } from '../lib/reading-preference.js';

const root = document.documentElement;
const controls = [...document.querySelectorAll('[data-appearance-controls]')];
const system = window.matchMedia('(prefers-color-scheme: dark)');
let storage;
try { storage = window.localStorage; } catch { /* The current page can still change appearance. */ }
let preference = readTheme(storage);

function updateTheme(value) {
  preference = normalizeTheme(value);
  const theme = applyTheme(root, preference, system.matches);
  // Match mobile browser/app chrome to the room's current lighting.
  const chromeColor = getComputedStyle(root).getPropertyValue('--bg').trim();
  if (chromeColor) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', chromeColor);
  controls.forEach(control => {
    const select = control.querySelector('[data-theme-switch]');
    if (select) select.value = preference;
  });
  document.querySelectorAll('[data-room-light]').forEach(button => button.setAttribute('aria-pressed', String(theme === 'light')));
  document.querySelectorAll('[data-room-light-state]').forEach(label => label.textContent = theme === 'light' ? label.dataset.light : label.dataset.dark);
  window.dispatchEvent(new CustomEvent('themechange', { detail: { preference, theme } }));
}

function updateReading(value) {
 const preference = applyReading(root, value);
 controls.forEach(control => {
  const select = control.querySelector('[data-reading-switch]');
  if (select) select.value = preference;
 });
 return preference;
}
updateReading(readReading(storage));
updateTheme(preference);
document.querySelectorAll('[data-room-light-control]').forEach(control => control.hidden = false);
document.querySelectorAll('[data-room-light]').forEach(button => button.addEventListener('click', () => {
  const dark = preference === 'dark' || (preference === 'auto' && system.matches);
  updateTheme(dark ? 'light' : 'dark');
  const saved = saveTheme(storage, preference);
  const status = document.querySelector('[data-room-light-status]');
  if (status) {
    const state = document.querySelector('[data-room-light-state]')?.textContent || '';
    const feedback = saved ? controls[0]?.dataset.themeSaved || '' : controls[0]?.dataset.themeUnsaved || '';
    status.textContent = `${state}. ${feedback}`;
  }
}));
controls.forEach(control => {
  control.querySelector('[data-reading-switch]')?.addEventListener('change', event => {
    const value = updateReading(event.currentTarget.value);
    const saved = saveReading(storage, value);
    const status = control.querySelector('[data-appearance-status]');
    status.textContent = saved ? control.dataset.readingSaved : control.dataset.readingUnsaved;
    status.classList.toggle('sr', saved);
    status.classList.toggle('is-warning', !saved);
  });
  control.querySelector('[data-theme-switch]')?.addEventListener('change', event => {
    updateTheme(event.currentTarget.value);
    const saved = saveTheme(storage, preference);
    const status = control.querySelector('[data-appearance-status]');
    status.textContent = saved ? control.dataset.themeSaved : control.dataset.themeUnsaved;
    status.classList.toggle('sr', saved);
    status.classList.toggle('is-warning', !saved);
  });
  control.querySelector('[data-language-switch]')?.addEventListener('change', event => {
    const target = new URL(event.currentTarget.value, window.location.href);
    if (target.origin !== window.location.origin) return;
    target.search = window.location.search;
    target.hash = window.location.hash;
    window.location.assign(target.href);
  });
});
system.addEventListener('change', () => { if (preference === 'auto') updateTheme('auto'); });
window.addEventListener('storage', event => {
  if (event.key === THEME_KEY || event.key === null) updateTheme(readTheme(storage));
  if (event.key === READING_KEY || event.key === null) updateReading(readReading(storage));
});
