import { withoutBase } from './base-path.js';
// Carry only directory state, never an arbitrary return URL or nested context.
const choices = {
  mode: ['list', 'map', 'guide'], view: ['cards'], sort: ['name', 'location'],
};
const facilities = new Set(['room', 'airside', 'wudu', 'women', 'h24', 'halal', 'ask', 'jumuah', 'open', 'musalla']);
export function browseQuery(search = '') {
  const input = new URLSearchParams(search), output = new URLSearchParams();
  for (const key of ['q', 'region']) {
    const value = (input.get(key) || '').trim().slice(0, key === 'q' ? 160 : 64);
    if (value && !(key === 'region' && value === 'All')) output.set(key, value);
  }
  const country = (input.get('country') || '').toUpperCase();
  if (/^[A-Z]{2}$/.test(country)) output.set('country', country);
  const filters = [...new Set((input.get('f') || '').split(',').filter(value => facilities.has(value)))].sort();
  if (filters.length) output.set('f', filters.join(','));
  for (const [key, values] of Object.entries(choices)) if (values.includes(input.get(key))) output.set(key, input.get(key));
  const page = input.get('page');
  if (/^\d{1,5}$/.test(page || '') && Number(page) > 1) output.set('page', String(Number(page)));
  const airport = input.get('airport');
  if (/^[a-z0-9-]{2,12}$/.test(airport || '')) output.set('airport', airport);
  return output.toString();
}

export function withBrowseContext(placePath, search = '') {
  if (!/^\/(?:fr\/|ar\/|es\/)?(?:airports|universities|hospitals)\/[a-z0-9-]+\/$/.test(withoutBase(placePath))) return placePath;
  const context = browseQuery(search);
  return context ? `${placePath}?${new URLSearchParams({ browse: context })}` : placePath;
}

export function returnToDirectory(directoryPath, search = '') {
  if (!/^\/(?:fr\/|ar\/|es\/)?(?:airports|universities|hospitals)\/$/.test(withoutBase(directoryPath))) return null;
  const context = browseQuery(new URLSearchParams(search).get('browse') || '');
  return context ? `${directoryPath}?${context}` : null;
}
