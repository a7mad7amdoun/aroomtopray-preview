import { INTERFACE_COPY } from '../data/interface-copy.js';

export const DEFAULT_LOCALE = 'en';
export const LOCALES = Object.freeze([
  Object.freeze({ code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' }),
  Object.freeze({ code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr' }),
  Object.freeze({ code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' }),
  Object.freeze({ code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr' }),
]);
const codes = new Set(LOCALES.map(({ code }) => code));
const normalizeLocale = (locale) => codes.has(locale) ? locale : DEFAULT_LOCALE;

/** Metadata for the document language, direction and language selector. */
export function localeMeta(locale) {
  return LOCALES.find(({ code }) => code === normalizeLocale(locale));
}

export function getCopy(locale = DEFAULT_LOCALE) {
  return INTERFACE_COPY[normalizeLocale(locale)];
}

/** Only a complete leading route segment is a locale, never an institution slug. */
export function localeFromPath(path = '/') {
  if (typeof path !== 'string') return DEFAULT_LOCALE;
  let pathname = path;
  if (/^https?:\/\//i.test(path)) {
    try { pathname = new URL(path).pathname; } catch { return DEFAULT_LOCALE; }
  }
  const segment = pathname.split(/[/?#]/)[1];
  return codes.has(segment) ? segment : DEFAULT_LOCALE;
}

/** Remove an existing locale while retaining the complete query and fragment. */
export function unlocalizedPath(path = '/') {
  if (typeof path !== 'string' || !path) return '/';
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|[?#])/i.test(path)) return path;
  const rooted = path.startsWith('/') ? path : `/${path}`;
  const match = rooted.match(/^\/(en|fr|ar|es)(?=\/|[?#]|$)/);
  if (!match) return rooted;
  const remainder = rooted.slice(match[0].length);
  return remainder.startsWith('/') ? remainder : `/${remainder}`;
}

/** English is unprefixed; external URLs and same-page references are unchanged. */
export function localizedPath(path = '/', locale = DEFAULT_LOCALE) {
  const clean = unlocalizedPath(path);
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|[?#])/i.test(clean)) return clean;
  const code = normalizeLocale(locale);
  return code === DEFAULT_LOCALE ? clean : `/${code}${clean}`;
}

export function formatCount(count, locale = DEFAULT_LOCALE) {
  return new Intl.NumberFormat(normalizeLocale(locale)).format(count);
}

/** Translate known interface terms only. Source prose and proper names stay intact. */
export function translateTerm(term, locale = DEFAULT_LOCALE) {
  if (typeof term !== 'string') return term;
  return getCopy(locale).terms[term] ?? term;
}
