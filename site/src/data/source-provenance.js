import { ORIGINAL_LISTING_PATHS } from './original-listing-paths.js';

export const ORIGINAL_DIRECTORY_ORIGIN = 'https://aroomtopray.com';
const listingPaths = new Set(Object.values(ORIGINAL_LISTING_PATHS).flat());
const directoryPaths = new Set(Object.keys(ORIGINAL_LISTING_PATHS).map(kind => `/${kind}/`));

export const SOURCE_PROVENANCE_COPY = {
  en: {
    label: 'From Hamza’s directory',
    directory: 'Place records come from A Room to Pray. Additional guidance and artwork are credited separately.',
    listing: 'The original listing is linked here. Room details retain their source links; additional guidance and artwork are credited separately.',
    openDirectory: 'Visit the original directory',
    openListing: 'View Hamza’s original listing',
    english: 'In English',
  },
  fr: {
    label: 'D’après l’annuaire de Hamza',
    directory: 'Les fiches des lieux proviennent d’A Room to Pray. Les conseils complémentaires et les illustrations sont crédités séparément.',
    listing: 'Retrouvez ici la fiche d’origine. Les informations sur les salles conservent leurs sources ; les conseils complémentaires et les illustrations sont crédités séparément.',
    openDirectory: 'Consulter l’annuaire d’origine',
    openListing: 'Voir la fiche d’origine de Hamza',
    english: 'En anglais',
  },
  ar: {
    label: 'من دليل حمزة',
    directory: 'تأتي بيانات الأماكن من دليل A Room to Pray. وتُنسب الإرشادات الإضافية والأعمال الفنية إلى مصادرها بشكل منفصل.',
    listing: 'يمكنك فتح الصفحة الأصلية هنا. تحتفظ تفاصيل غرف الصلاة بروابط مصادرها، وتُنسب الإرشادات الإضافية والأعمال الفنية إلى مصادرها بشكل منفصل.',
    openDirectory: 'زيارة الدليل الأصلي',
    openListing: 'عرض صفحة حمزة الأصلية',
    english: 'بالإنجليزية',
  },
  es: {
    label: 'Del directorio de Hamza',
    directory: 'Las fichas de los lugares proceden de A Room to Pray. Las recomendaciones adicionales y las ilustraciones tienen créditos independientes.',
    listing: 'Aquí puedes consultar la ficha original. Los detalles de las salas conservan sus fuentes; las recomendaciones adicionales y las ilustraciones tienen créditos independientes.',
    openDirectory: 'Visitar el directorio original',
    openListing: 'Ver la ficha original de Hamza',
    english: 'En inglés',
  },
};

/** Only routes actually observed in Hamza’s directories get an original-listing link. */
export function originalDirectorySource(input = '/') {
  if (typeof input !== 'string' || !input) return null;
  let path = input;
  if (/^https?:\/\//i.test(path)) {
    let url;
    try { url = new URL(path); } catch { return null; }
    if (url.origin !== ORIGINAL_DIRECTORY_ORIGIN || url.username || url.password) return null;
    path = url.pathname;
  }
  if (!path.startsWith('/') || path.startsWith('//')) return null;
  path = path.split(/[?#]/)[0].replace(/^\/(en|fr|ar|es)(?=\/|$)/, '') || '/';
  if (!path.endsWith('/')) path += '/';
  const kind = listingPaths.has(path) ? 'listing' : path === '/' || directoryPaths.has(path) ? 'directory' : null;
  return kind ? { kind, path, url: `${ORIGINAL_DIRECTORY_ORIGIN}${path}` } : null;
}
