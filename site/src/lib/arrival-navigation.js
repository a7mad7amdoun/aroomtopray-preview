import { previewBase, withoutBase } from './base-path.js';
import { browseQuery, returnToDirectory } from './directory-context.js';

const directoryRoute = /^\/(?:fr\/|ar\/|es\/)?(airports|universities|hospitals)\/$/;
const placeRoute = /^\/(?:fr\/|ar\/|es\/)?(airports|universities|hospitals)\/[a-z0-9-]+\/$/;

// A category link may retain only its own directory context. Its existing locale
// and preview mount remain unchanged; query strings never supply a destination.
export function arrivalNavigationHref(directoryPath, location, base = previewBase) {
  if (typeof directoryPath !== 'string' || !location) return directoryPath;
  const targetPath = withoutBase(directoryPath, base);
  const target = directoryRoute.exec(targetPath);
  if (!target) return directoryPath;
  const currentPath = withoutBase(location.pathname || '', base);
  const directory = directoryRoute.exec(currentPath);
  if (directory?.[1] === target[1]) {
    const query = browseQuery(location.search || '');
    return query ? `${directoryPath}?${query}` : directoryPath;
  }
  const place = placeRoute.exec(currentPath);
  if (place?.[1] !== target[1]) return directoryPath;
  // Validate the route without its mount so explicit test/build bases work too.
  const returned = returnToDirectory(targetPath, location.search || '');
  return returned ? directoryPath + returned.slice(targetPath.length) : directoryPath;
}

const initialized = new WeakSet();

export function initArrivalNavigation(doc = document, browser = window, base = previewBase) {
  if (initialized.has(doc)) return;
  const links = [...doc.querySelectorAll('.primary-navigation a, .menu-destinations > a')]
    .map(link => ({ link, path: link.getAttribute('href') }));
  if (!links.length) return;
  const syncLink = ({ link, path }) => {
    const next = arrivalNavigationHref(path, browser.location, base);
    if (next !== link.getAttribute('href')) link.setAttribute('href', next);
  };
  const sync = () => links.forEach(syncLink);
  for (const item of links) {
    // Refresh before native activation, including keyboard, modified clicks,
    // middle clicks and copying a link from its context menu. Never intercept it.
    for (const event of ['focus', 'pointerenter', 'pointerdown', 'click', 'auxclick', 'contextmenu']) {
      item.link.addEventListener(event, () => syncLink(item));
    }
  }
  for (const event of ['pageshow', 'popstate']) browser.addEventListener(event, sync);
  for (const event of ['directory:updated', 'atlas:selection']) doc.addEventListener(event, sync);
  initialized.add(doc);
  sync();
}
