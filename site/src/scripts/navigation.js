import { readSaved } from '../lib/saved-places.js';
import { returnToDirectory } from '../lib/directory-context.js';

const initializedMenus = new WeakSet();
const initializedDocuments = new WeakSet();

// A disclosure, not an application menu: native Tab order and links remain intact.
// Arrow keys on the summary offer a shortcut; they never capture keys in a select.
export function initSiteMenu(menu, root = globalThis.document, browser = globalThis.window) {
  if (!menu || initializedMenus.has(menu)) return;
  const summary = menu.querySelector('summary');
  const panel = menu.querySelector('.site-menu-panel');
  if (!summary || !panel) return;
  initializedMenus.add(menu);
  const sync = () => summary.setAttribute('aria-expanded', String(menu.open));
  const close = ({ restoreFocus = false } = {}) => {
    if (!menu.open) return;
    menu.open = false;
    sync();
    if (restoreFocus) summary.focus();
  };
  sync();
  menu.addEventListener('toggle', sync);
  summary.addEventListener('keydown', event => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const controls = [...panel.querySelectorAll('select:not([disabled]), a[href], button:not([disabled])')].filter(control => !control.hidden);
    if (!controls.length) return;
    event.preventDefault();
    menu.open = true;
    sync();
    controls[event.key === 'ArrowDown' ? 0 : controls.length - 1].focus();
  });
  root.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !menu.open || event.defaultPrevented) return;
    event.preventDefault();
    close({ restoreFocus: menu.contains(root.activeElement) });
  });
  root.addEventListener('click', event => {
    if (menu.open && !menu.contains(event.target)) close();
  });
  menu.addEventListener('focusout', event => {
    if (event.relatedTarget && !menu.contains(event.relatedTarget)) close();
  });
  panel.querySelectorAll('a').forEach(link => link.addEventListener('click', event => {
    // Preserve the current page's state when visitors open a tool in another tab.
    if (event.defaultPrevented || event.button > 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || link.target === '_blank') return;
    close();
  }));
  browser.addEventListener('pageshow', () => close({ restoreFocus: menu.contains(root.activeElement) }));
}

export function initSiteNavigation(root = globalThis.document, browser = globalThis.window) {
  if (!root || !browser || initializedDocuments.has(root)) return;
  initializedDocuments.add(root);
  root.querySelectorAll('[data-directory-return]').forEach(link => {
    const target = returnToDirectory(link.getAttribute('href'), browser.location.search);
    if (target) {
      link.href = target;
      link.textContent = link.dataset.directoryReturn;
      link.classList.add('return-to-results');
    }
  });
  const count = root.querySelector('[data-saved-count]');
  const updateSaved = () => {
    if (!count) return;
    try {
      const total = readSaved(browser.localStorage).length;
      count.textContent = String(total);
      count.hidden = total === 0;
    } catch { count.hidden = true; }
  };
  browser.addEventListener('storage', updateSaved);
  browser.addEventListener('saved-places-change', updateSaved);
  updateSaved();
  initSiteMenu(root.querySelector('[data-site-menu]'), root, browser);
  root.querySelectorAll('[data-print]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => browser.print());
  });
  let expanded = [];
  browser.addEventListener('beforeprint', () => {
    expanded = [...root.querySelectorAll('details[data-print-expand]:not([open])')];
    expanded.forEach(details => details.open = true);
  });
  browser.addEventListener('afterprint', () => {
    expanded.forEach(details => details.open = false);
    expanded = [];
  });
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') initSiteNavigation(document, window);
