// Only paths are stored, and only after an explicit Save action.
export const SAVED_KEY = 'aroomtopray.saved-places.v1';
export const MAX_SAVED = 24;
const validPath = p => typeof p === 'string' && /^\/(?:airports\/[a-z]{3}|(?:universities|hospitals)\/[a-z0-9-]+)\/$/.test(p);
export function parseSaved(value) {
  if (!value) return [];
  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed)) throw new Error('Saved places could not be read.');
  return [...new Set(parsed.filter(validPath))].slice(0, MAX_SAVED);
}
export function readSaved(storage) { return parseSaved(storage.getItem(SAVED_KEY)); }
export function writeSaved(storage, paths) {
  const clean = parseSaved(JSON.stringify(paths));
  if (!clean.length) storage.removeItem(SAVED_KEY);
  else storage.setItem(SAVED_KEY, JSON.stringify(clean));
  return clean;
}
export function toggleSaved(paths, path) {
  if (!validPath(path)) throw new Error('This place could not be saved.');
  if (paths.includes(path)) return paths.filter(p => p !== path);
  if (paths.length >= MAX_SAVED) throw new Error(`You can save up to ${MAX_SAVED} places. Remove one first.`);
  return [...paths, path];
}
export function restoreSaved(paths, path, index) {
  if (!validPath(path) || paths.includes(path)) return paths;
  if (paths.length >= MAX_SAVED) throw new Error(`You can save up to ${MAX_SAVED} places.`);
  const next = [...paths]; next.splice(Math.max(0, Math.min(index, next.length)), 0, path); return next;
}
export function formatPlaceNotes(place) {
  const out = [place.name, `${place.kind} · ${place.city}, ${place.country}`, place.status,
    `Qibla: ${place.qibla}° from true north (fixed bearing, not a live compass).`, ...place.warnings];
  if (!place.rooms.length) out.push('No room details are available in this listing. Ask the institution before visiting.');
  for (const r of place.rooms) out.push('', r.name, r.location, `Access: ${r.access}`, `Hours: ${r.hours}`,
    `Wuḍūʾ: ${r.wudu}`, `Women: ${r.women}`, ...(r.extra ? [r.extra] : []),
    `Source: ${r.source}`, `Source date: ${r.checked || 'Date unavailable'} · ${r.provenance}`);
  out.push('', `Listing: https://aroomtopray.com${place.path}`, 'Facilities can change. Check with the institution before travelling.');
  return out.join('\n');
}
