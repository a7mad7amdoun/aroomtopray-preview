import { unlocalizedPath, localizedPath } from './i18n.js';
// These routes have full translated interfaces. Source prose retains its language.
export function hasLocalizedRoute(path) {
  const clean = unlocalizedPath(path).split(/[?#]/)[0];
  return clean === '/' || /^\/(airports|universities|hospitals)\/(?:[a-z0-9-]+\/)?$/.test(clean) || clean === '/visit/';
}
export function languageTarget(path, locale) {
  return localizedPath(hasLocalizedRoute(path) ? path : '/', locale);
}
export function navigationPath(path, locale) {
  return hasLocalizedRoute(path) ? localizedPath(path, locale) : path;
}
