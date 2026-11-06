// Pointer, keyboard and toolbar interactions share these viewport bounds.
export const MAP_MIN_SCALE = 1;
export const MAP_MAX_SCALE = 7;

export function readMapSelection(search, validCodes, key = 'airport') {
  const code = new URLSearchParams(search).get(key);
  return validCodes.has(code) ? code : '';
}

export function writeMapSelection(code, search = '', key = 'airport') {
  const params = new URLSearchParams(search);
  params.delete(key);
  if (code) params.set(key, code);
  return params.toString();
}

export function boundedMapTransform({ x = 0, y = 0, k = 1 }, width, height) {
  const scale = Math.max(MAP_MIN_SCALE, Math.min(MAP_MAX_SCALE, Number.isFinite(k) ? k : 1));
  const clamp = (value, limit) => Math.min(0, Math.max(limit * (1 - scale), Number.isFinite(value) ? value : 0));
  return { x: clamp(x, width), y: clamp(y, height), k: scale };
}

export function zoomMapAt(transform, factor, point, width, height) {
  const before = boundedMapTransform(transform, width, height);
  const scale = Math.max(MAP_MIN_SCALE, Math.min(MAP_MAX_SCALE, before.k * factor));
  const ratio = scale / before.k;
  return boundedMapTransform({
    x: point.x - (point.x - before.x) * ratio,
    y: point.y - (point.y - before.y) * ratio,
    k: scale,
  }, width, height);
}
