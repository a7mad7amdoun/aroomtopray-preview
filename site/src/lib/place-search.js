import { fold } from './directory-state.js';

export function searchIndexForKey(key, index, count) {
  if (!count || !['ArrowDown', 'ArrowUp'].includes(key)) return null;
  if (index < 0) return key === 'ArrowUp' ? count - 1 : 0;
  return (index + (key === 'ArrowDown' ? 1 : -1) + count) % count;
}

export function searchPlaces(entries, query, limit = 7) {
  const q = fold(query).trim();
  if (!q) return [];
  const tokens = q.split(/\s+/);
  return entries.filter(place => tokens.every(token => fold(place.text).includes(token)))
    .sort((a, b) => Number(fold(b.code) === q) - Number(fold(a.code) === q))
    .slice(0, limit);
}
