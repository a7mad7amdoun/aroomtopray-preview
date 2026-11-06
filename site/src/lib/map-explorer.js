import { boundedMapTransform, zoomMapAt, MAP_MAX_SCALE } from './airport-map-state.js';

// Discovery only: retain the original records and their access/source status.
const searchText = value => String(value ?? '').normalize('NFD').replace(/\p{M}/gu, '').replace(/\u0640/g, '').toLowerCase();

export function exploreMapPoints(points, { query = '', country = '', allowedCodes = null } = {}) {
  const words = searchText(query).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const allowed = allowedCodes === null ? null : allowedCodes instanceof Set ? allowedCodes : new Set(allowedCodes);
  return points.filter(point => {
    if (country && point.countryCode !== country) return false;
    if (allowed && !allowed.has(point.code)) return false;
    const text = searchText([point.iata, point.fullName, point.name, point.city, point.country, point.code].filter(Boolean).join(' '));
    return words.every(word => text.includes(word));
  });
}

// Country badges on institution maps are not unique airport identifiers.
// Enter may open an unambiguous exact name/code, or the sole matching result.
export function resolveMapSearch(points, query, kind = 'airports') {
  const wanted = searchText(query).trim();
  if (!wanted) return null;
  const exact = points.filter(point => [point.code, point.fullName, point.name, ...(kind === 'airports' ? [point.iata] : [])].some(value => value && searchText(value).trim() === wanted));
  if (exact.length === 1) return exact[0];
  return points.length === 1 ? points[0] : null;
}

export function mapSelectionQuery(code, search = '', key = 'airport') {
  const params = new URLSearchParams(search);
  if (key === 'airport' && (!code || params.get(key) !== code)) params.delete('room');
  params.delete(key);
  if (code) params.set(key, code);
  return params.toString();
}

// Keep keyboard focus on its place when filtering/repainting the result list.
// If that place disappears, use the nearest surviving row; an empty list lets
// the caller return focus to the result heading rather than the document body.
export function mapResultFocus(previousCodes, nextCodes, focusedCode) {
  if (!focusedCode || !previousCodes.includes(focusedCode) || !nextCodes.length) return null;
  if (nextCodes.includes(focusedCode)) return focusedCode;
  return nextCodes[Math.min(previousCodes.indexOf(focusedCode), nextCodes.length - 1)];
}

// Resolve overlapping hit areas by visual distance, never SVG paint order.
// Pointer coordinates are in the outer SVG viewBox; scale converts them to px.
export function nearestMapTarget(targets, pointer, transform, pixelsPerUnit = 1, radius = 22) {
  if (![pointer?.x, pointer?.y, transform?.x, transform?.y, transform?.k, pixelsPerUnit, radius].every(Number.isFinite) || transform.k <= 0 || pixelsPerUnit <= 0 || radius < 0) return null;
  let nearest = null, distance = radius * radius;
  for (const target of targets) {
    if (!Number.isFinite(target.x) || !Number.isFinite(target.y)) continue;
    const dx = (target.x * transform.k + transform.x - pointer.x) * pixelsPerUnit;
    const dy = (target.y * transform.k + transform.y - pointer.y) * pixelsPerUnit;
    const squared = dx * dx + dy * dy;
    if (squared <= distance && (!nearest || squared < distance)) { nearest = target; distance = squared; }
  }
  return nearest;
}

export function wheelMapTransform(transform, deltaY, deltaMode, pointer, width, height) {
  if (!Number.isFinite(deltaY) || !Number.isFinite(pointer?.x) || !Number.isFinite(pointer?.y)) return boundedMapTransform(transform, width, height);
  const pixels = deltaY * (deltaMode === 1 ? 16 : deltaMode === 2 ? height : 1);
  const factor = Math.exp(-Math.max(-120, Math.min(120, pixels)) * .002);
  return zoomMapAt(transform, factor, pointer, width, height);
}

export function focusMapTransform(point, transform, width, height) {
  const current = boundedMapTransform(transform, width, height);
  if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) return current;
  const x = point.x * current.k + current.x, y = point.y * current.k + current.y;
  const margin = Math.min(90, width / 6, height / 6);
  if (current.k >= 2.2 && x >= margin && x <= width - margin && y >= margin && y <= height - margin) return current;
  const k = Math.max(current.k, 2.2);
  return boundedMapTransform({ k, x: width / 2 - point.x * k, y: height / 2 - point.y * k }, width, height);
}

export function expandMapGroup(points, transform, width, height) {
  const current = boundedMapTransform(transform, width, height);
  const valid = points.filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (!valid.length) return current;
  // Cluster expansion is independent of overview fitting limits. Close groups
  // must remain explorable beyond the deliberately restrained overview scale.
  const xs = valid.map(point => point.x), ys = valid.map(point => point.y);
  const spanX = Math.max(...xs) - Math.min(...xs), spanY = Math.max(...ys) - Math.min(...ys);
  const fitScale = Math.min((width - 140) / Math.max(1, spanX), (height - 140) / Math.max(1, spanY));
  const k = Math.min(MAP_MAX_SCALE, Math.max(current.k, Math.min(current.k * 1.6, fitScale)));
  const x = valid.reduce((sum, point) => sum + point.x, 0) / valid.length;
  const y = valid.reduce((sum, point) => sum + point.y, 0) / valid.length;
  return boundedMapTransform({ k, x: width / 2 - x * k, y: height / 2 - y * k }, width, height);
}

export function mapMarkerLabel(point, kind) {
  if (kind === 'airports' && /^[a-z]{3}$/i.test(point.iata || '')) return point.iata.toUpperCase();
  const name = String(point.name || point.fullName || '').trim();
  if (/^[\p{L}\p{N}]{1,4}$/u.test(name)) return name.toLocaleUpperCase();
  return (name.match(/[\p{L}\p{N}]+/gu) || []).slice(0, 3).map(word => [...word][0]).join('').toLocaleUpperCase();
}

export function mapCountries(points, locale = 'en') {
  const countries = new Map();
  for (const point of points) {
    if (!point.countryCode) continue;
    const existing = countries.get(point.countryCode);
    if (existing) existing.count++;
    else countries.set(point.countryCode, { code: point.countryCode, name: point.country || point.countryCode, count: 1 });
  }
  const collator = new Intl.Collator(locale);
  return [...countries.values()].sort((a, b) => collator.compare(a.name, b.name) || collator.compare(a.code, b.code));
}

// SVG coordinates after the same translate/scale used by the map's world group.
// Boundary points are visible; invalid coordinates never enter the result list.
export function mapWindowPoints(points, transform, width, height) {
  const { x = 0, y = 0, k = 1 } = transform || {};
  if (![x, y, k, width, height].every(Number.isFinite) || k <= 0 || width <= 0 || height <= 0) return [];
  return points.filter(point => {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return false;
    const screenX = point.x * k + x, screenY = point.y * k + y;
    return screenX >= 0 && screenX <= width && screenY >= 0 && screenY <= height;
  });
}
