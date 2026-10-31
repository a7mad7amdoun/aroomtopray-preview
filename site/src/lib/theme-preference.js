export const THEME_KEY = 'aroomtopray.theme.v1';

export function normalizeTheme(value) {
  return value === 'light' || value === 'dark' ? value : 'auto';
}

export function readTheme(storage) {
  try { return normalizeTheme(storage.getItem(THEME_KEY)); }
  catch { return 'auto'; }
}

export function saveTheme(storage, value) {
  try {
    const preference = normalizeTheme(value);
    if (preference === 'auto') storage.removeItem(THEME_KEY);
    else storage.setItem(THEME_KEY, preference);
    return true;
  } catch { return false; }
}

export function applyTheme(element, value, systemDark = false) {
  const preference = normalizeTheme(value);
  if (preference === 'auto') element.removeAttribute('data-theme');
  else element.setAttribute('data-theme', preference);
  return preference === 'auto' ? (systemDark ? 'dark' : 'light') : preference;
}
