import { tabIndexForKey, panelIndexForTarget } from '../lib/guide-navigation.js';

const initialized = new WeakSet();
const nativeIntent = event => event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

// Progressive enhancement: without JavaScript every section and anchor remains available.
export function initGuideTabs(root, browser = globalThis.window) {
 if (!root || !browser || initialized.has(root)) return false;
 const doc = root.ownerDocument;
 const nav = [...root.querySelectorAll('[data-guide-tablist]')].find(el => el.closest('[data-guide-tabs]') === root);
 if (!nav) return false;
 const tabs = [...nav.querySelectorAll('[data-guide-tab]')];
 const panels = tabs.map(tab => doc.getElementById(tab.dataset.guideTab));
 if (!tabs.length || panels.some(panel => !panel || !root.contains(panel))) return false;
 initialized.add(root);
 let active = 0;
 root.dataset.guideEnhanced = 'true';
 nav.setAttribute('role', 'tablist');
 const wide = browser.matchMedia?.('(min-width:1280px)');
 const reduced = browser.matchMedia?.('(prefers-reduced-motion: reduce)');
 const syncOrientation = () => nav.setAttribute('aria-orientation', wide?.matches ? 'vertical' : 'horizontal');
 wide?.addEventListener?.('change', syncOrientation);
 syncOrientation();
 let panelAnimation;
 reduced?.addEventListener?.('change', () => { if (reduced.matches) panelAnimation?.cancel(); });
 browser.addEventListener('pagehide', () => panelAnimation?.cancel());
 tabs.forEach((tab, i) => {
  tab.setAttribute('role', 'tab');
  tab.setAttribute('aria-controls', panels[i].id);
  panels[i].setAttribute('role', 'tabpanel');
  panels[i].setAttribute('aria-labelledby', tab.id);
  panels[i].tabIndex = 0;
 });
 function select(index, { focus = false, write = false } = {}) {
  // A history change must not leave keyboard focus in information we just hid.
  const hidesFocus = panels.some((panel, i) => i !== index && panel.contains(doc.activeElement));
  const changed = active !== index;
  panelAnimation?.cancel();
  active = index;
  tabs.forEach((tab, i) => {
   tab.setAttribute('aria-selected', String(i === index));
   tab.tabIndex = i === index ? 0 : -1;
   panels[i].hidden = i !== index;
  });
  if (focus || hidesFocus) tabs[index].focus({ preventScroll: true });
  if (write && browser.location.hash !== '#' + panels[index].id) {
   // Tabs remain usable if a privacy setting or history quota refuses the write.
   try {
    browser.history.pushState(browser.history.state, '', browser.location.pathname + browser.location.search + '#' + panels[index].id);
   } catch {}
  }
  if (changed && write && reduced && !reduced.matches) {
   panelAnimation = panels[index].animate?.([{ opacity:.92 }, { opacity:1 }], { duration:180, easing:'ease-out' });
  }
  root.dispatchEvent(new browser.CustomEvent('guide:change', { detail: { panel: panels[index].id } }));
 }
 function revealHash(scroll = false) {
  let id;
  try { id = decodeURIComponent(browser.location.hash.slice(1)); } catch { return; }
  const target = doc.getElementById(id);
  const index = panelIndexForTarget(panels, target);
  if (index < 0) return;
  select(index);
  for (let node = target; node && node !== root; node = node.parentElement) {
   if (node.tagName === 'DETAILS') node.open = true;
  }
  if (scroll) browser.requestAnimationFrame(() => {
   // Ignore a queued scroll if another tab was chosen before the frame arrived.
   if (!panels[index].hidden) target.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
 }
 function defaultPanel() {
  const reportPanel = new URLSearchParams(browser.location.search).has('report')
   ? panels.findIndex(panel => panel.querySelector('[data-report]')) : -1;
  return reportPanel >= 0 ? reportPanel : 0;
 }
 tabs.forEach((tab, i) => {
  tab.addEventListener('click', event => {
   if (nativeIntent(event)) return;
   event.preventDefault();
   select(i, { write: true });
  });
  tab.addEventListener('keydown', event => {
   // Alt+Left remains browser Back; modified shortcuts and IME input stay native.
   if (nativeIntent(event) || event.isComposing) return;
   if (event.key === ' ') { event.preventDefault(); select(i, { write: true }); return; }
   const rtl = browser.getComputedStyle(nav).direction === 'rtl';
   const next = tabIndexForKey(event.key, i, tabs.length, rtl, wide?.matches);
   if (next !== null) { event.preventDefault(); select(next, { focus: true, write: true }); }
  });
 });
 doc.addEventListener('click', event => {
  if (nativeIntent(event)) return;
  const link = event.target.closest?.('a[href^="#"]');
  if (!link || link.hasAttribute('data-guide-tab') || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
  browser.setTimeout(() => revealHash(true), 0);
 });
 browser.addEventListener('hashchange', () => revealHash(true));
 browser.addEventListener('popstate', () => {
  if (!browser.location.hash) select(defaultPanel());
  else revealHash();
 });
 browser.addEventListener('beforeprint', () => { panelAnimation?.cancel(); panels.forEach(panel => panel.hidden = false); });
 browser.addEventListener('afterprint', () => select(active));
 select(defaultPanel());
 revealHash(Boolean(browser.location.hash));
 return true;
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
 document.querySelectorAll('[data-guide-tabs]').forEach(root => initGuideTabs(root, window));
}
