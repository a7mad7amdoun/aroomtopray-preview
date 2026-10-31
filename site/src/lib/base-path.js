// Only the separate GitHub Pages review build sets this mount point.
export const previewBase = (import.meta.env?.PUBLIC_PREVIEW_BASE || '').replace(/\/$/, '');
export function withoutBase(path, base = previewBase) {
  return base && (path === base || path.startsWith(base + '/')) ? path.slice(base.length) || '/' : path;
}
export function withBase(path, base = previewBase) {
  if (!base || typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return path;
  return withoutBase(path, base) === path ? base + path : path;
}
