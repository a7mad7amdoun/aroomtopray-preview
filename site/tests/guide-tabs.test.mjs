import test from 'node:test';
import assert from 'node:assert/strict';
import { initGuideTabs } from '../src/scripts/guide-tabs.js';

function fixture({ hash = '', query = '', rtl = false } = {}) {
 const doc = { activeElement: null }, listeners = new Map(), frames = [], timers = [];
 function element(id, parent = null, tagName = 'DIV') {
  const handlers = new Map(), attributes = new Map();
  const node = {
   id, parentElement: parent, ownerDocument: doc, tagName, dataset: {}, hidden: false,
   contains(target) { for (let value = target; value; value = value.parentElement) if (value === this) return true; return false; },
   addEventListener(type, listener) { const list = handlers.get(type) || []; list.push(listener); handlers.set(type, list); },
   dispatchEvent(event) { for (const listener of handlers.get(event.type) || []) listener(event); return !event.defaultPrevented; },
   emit(type, props = {}) {
    const event = { type, target: node, button: 0, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...props };
    node.dispatchEvent(event); return event;
   },
   setAttribute(name, value) { attributes.set(name, value); },
   getAttribute(name) { return attributes.get(name); },
   hasAttribute(name) { return attributes.has(name); },
   focus() { doc.activeElement = this; },
   scrollIntoView() { this.scrolled = (this.scrolled || 0) + 1; },
   closest(selector) { return selector === '[data-guide-tabs]' ? root : null; },
   querySelector() { return null; },
  };
  return node;
 }
 const root = element('guide'), nav = element('tabs', root);
 const panels = ['rooms', 'direction', 'tools'].map(id => element(id, root));
 const tabs = panels.map(panel => { const tab = element('tab-' + panel.id, nav, 'A'); tab.dataset.guideTab = panel.id; return tab; });
 const details = element('report', panels[2], 'DETAILS'), report = element('report-form', details, 'FORM');
 const focusedField = element('report-field', report, 'TEXTAREA');
 const outside = element('outside'), anchor = element('anchor', panels[0], 'A');
 anchor.closest = selector => selector === 'a[href^="#"]' ? anchor : null;
 panels[2].querySelector = selector => selector === '[data-report]' ? report : null;
 root.querySelectorAll = selector => selector === '[data-guide-tablist]' ? [nav] : [];
 nav.querySelectorAll = () => tabs;
 const nodes = [root, nav, ...tabs, ...panels, details, report, focusedField, outside, anchor];
 doc.getElementById = id => nodes.find(node => node.id === id) || null;
 doc.addEventListener = (type, handler) => { const list = listeners.get(type) || []; list.push(handler); listeners.set(type, list); };
 doc.emit = (type, props = {}) => {
  const event = { type, target: doc, button: 0, defaultPrevented: false, ...props };
  for (const handler of listeners.get(type) || []) handler(event);
  return event;
 };
 const browser = element('browser');
 browser.location = new URL('https://example.test/airports/lhr/' + query + hash);
 browser.history = {
  state: { existing: true }, writes: [],
  pushState(state, title, url) { this.writes.push({ state, url }); browser.location.href = new URL(url, browser.location).href; },
 };
 browser.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init.detail; } };
 browser.getComputedStyle = () => ({ direction: rtl ? 'rtl' : 'ltr' });
 browser.requestAnimationFrame = fn => frames.push(fn);
 browser.setTimeout = fn => timers.push(fn);
 const selected = () => tabs.find(tab => tab.getAttribute('aria-selected') === 'true');
 return { root, nav, panels, tabs, details, report, focusedField, outside, anchor, doc, browser, frames, timers, selected };
}

test('tabs retain one visible panel and native links while exposing complete accessible relationships', () => {
 const f = fixture();
 assert.equal(initGuideTabs(f.root, f.browser), true);
 assert.equal(initGuideTabs(f.root, f.browser), false);
 assert.equal(f.selected(), f.tabs[0]);
 assert.deepEqual(f.panels.map(panel => panel.hidden), [false, true, true]);
 f.tabs.forEach((tab, i) => {
  assert.equal(tab.getAttribute('aria-controls'), f.panels[i].id);
  assert.equal(f.panels[i].getAttribute('aria-labelledby'), tab.id);
  assert.equal(f.panels[i].getAttribute('role'), 'tabpanel');
 });
 f.tabs[1].emit('click');
 assert.equal(f.selected(), f.tabs[1]);
 assert.equal(f.browser.location.hash, '#direction');
 assert.deepEqual(f.browser.history.writes[0].state, { existing: true });
 assert.equal(f.browser.history.writes.length, 1, 'Repeated initialization must not attach duplicate listeners');
});

test('modified keys and modified or canceled clicks never hijack browser navigation', () => {
 const f = fixture(); initGuideTabs(f.root, f.browser);
 for (const props of [{ altKey: true }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { isComposing: true }]) {
  const event = f.tabs[0].emit('keydown', { key: 'ArrowLeft', ...props });
  assert.equal(event.defaultPrevented, false);
  assert.equal(f.selected(), f.tabs[0]);
 }
 for (const props of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { defaultPrevented: true }]) {
  f.tabs[1].emit('click', props);
  assert.equal(f.selected(), f.tabs[0]);
 }
 assert.equal(f.browser.history.writes.length, 0);
});

test('keyboard navigation follows Arabic direction and leaves Tab and Enter native', () => {
 const f = fixture({ rtl: true }); initGuideTabs(f.root, f.browser);
 assert.equal(f.tabs[0].emit('keydown', { key: 'ArrowLeft' }).defaultPrevented, true);
 assert.equal(f.selected(), f.tabs[1]); assert.equal(f.doc.activeElement, f.tabs[1]);
 f.tabs[1].emit('keydown', { key: 'End' }); assert.equal(f.selected(), f.tabs[2]);
 f.tabs[2].emit('keydown', { key: 'Home' }); assert.equal(f.selected(), f.tabs[0]);
 for (const key of ['Enter', 'Tab', 'Escape']) assert.equal(f.tabs[0].emit('keydown', { key }).defaultPrevented, false);
 f.tabs[2].emit('keydown', { key: ' ' }); assert.equal(f.selected(), f.tabs[2]);
});

test('deep links reveal the containing panel and open the enclosing report disclosure', () => {
 const f = fixture({ hash: '#report-form' }); initGuideTabs(f.root, f.browser);
 assert.equal(f.selected(), f.tabs[2]); assert.equal(f.details.open, true);
 f.frames.shift()(); assert.equal(f.report.scrolled, 1);
 f.browser.location.hash = '#direction'; f.browser.emit('hashchange');
 f.tabs[0].emit('click');
 f.frames.shift()(); assert.equal(f.panels[1].scrolled, undefined, 'A stale animation frame must not scroll to information hidden by a later choice');
});

test('Back and Forward restore the panel and never leave focus inside hidden information', () => {
 const f = fixture({ hash: '#tools' }); initGuideTabs(f.root, f.browser);
 f.focusedField.focus(); f.browser.location.hash = '#direction'; f.browser.emit('popstate');
 assert.equal(f.selected(), f.tabs[1]); assert.equal(f.doc.activeElement, f.tabs[1]);
 f.outside.focus(); f.browser.location.hash = ''; f.browser.emit('popstate');
 assert.equal(f.selected(), f.tabs[0]); assert.equal(f.doc.activeElement, f.outside, 'History must not steal focus from outside the hidden panel');
 f.browser.location.hash = '#tools'; f.browser.emit('popstate'); assert.equal(f.selected(), f.tabs[2]);
});

test('report return URLs keep their useful default after history restoration without a fragment', () => {
 const f = fixture({ query: '?report=error' }); initGuideTabs(f.root, f.browser);
 assert.equal(f.selected(), f.tabs[2]);
 f.tabs[0].emit('click'); f.browser.location.hash = ''; f.browser.emit('popstate');
 assert.equal(f.selected(), f.tabs[2]);
});

test('failed history writes do not disable information tabs', () => {
 const f = fixture(); initGuideTabs(f.root, f.browser);
 f.browser.history.pushState = () => { throw new Error('History unavailable'); };
 assert.doesNotThrow(() => f.tabs[2].emit('click'));
 assert.equal(f.selected(), f.tabs[2]); assert.equal(f.panels[2].hidden, false);
});

test('printing exposes all information and restores the chosen tab afterward', () => {
 const f = fixture({ hash: '#direction' }); initGuideTabs(f.root, f.browser);
 f.browser.emit('beforeprint'); assert.equal(f.panels.some(panel => panel.hidden), false);
 f.browser.emit('afterprint'); assert.equal(f.selected(), f.tabs[1]);
 assert.deepEqual(f.panels.map(panel => panel.hidden), [true, false, true]);
});

test('only ordinary same-page links request a deep-link scroll', () => {
 const f = fixture(); initGuideTabs(f.root, f.browser);
 for (const props of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { button: 1 }, { defaultPrevented: true }]) f.doc.emit('click', { target: f.anchor, ...props });
 f.anchor.target = '_blank'; f.doc.emit('click', { target: f.anchor });
 assert.equal(f.timers.length, 0);
 f.anchor.target = ''; f.doc.emit('click', { target: f.anchor });
 assert.equal(f.timers.length, 1);
 f.browser.location.hash = '#report'; f.timers.shift()();
 assert.equal(f.selected(), f.tabs[2]); assert.equal(f.details.open, true);
});


test('wide guide orientation changes preserve selection, focus and URL', () => {
 const f=fixture({rtl:true});let change;
 const wide={matches:true,addEventListener:(_type,fn)=>change=fn};
 f.browser.matchMedia=query=>query.includes('1280')?wide:{matches:true};
 initGuideTabs(f.root,f.browser);
 assert.equal(f.nav.getAttribute('aria-orientation'),'vertical');
 f.tabs[0].emit('keydown',{key:'ArrowDown'});
 assert.equal(f.selected(),f.tabs[1]);
 const url=f.browser.location.href,focus=f.doc.activeElement;
 wide.matches=false;change();
 assert.equal(f.nav.getAttribute('aria-orientation'),'horizontal');
 assert.equal(f.selected(),f.tabs[1]);assert.equal(f.doc.activeElement,focus);assert.equal(f.browser.location.href,url);
 f.tabs[1].emit('keydown',{key:'ArrowLeft'});assert.equal(f.selected(),f.tabs[2]);
});

test('panel motion runs only after an explicit choice and cancels on reselection or page exit', () => {
 const f=fixture({hash:'#direction'}),animations=[];
 const reduced={matches:false};
 f.browser.matchMedia=query=>query.includes('1280')?{matches:false}:reduced;
 f.panels.forEach(panel=>panel.animate=(frames,options)=>{
  const animation={cancelled:false,cancel(){this.cancelled=true;},frames,options};animations.push(animation);return animation;
 });
 initGuideTabs(f.root,f.browser);assert.equal(animations.length,0);
 f.tabs[2].emit('click');assert.equal(animations.length,1);
 assert.equal(animations[0].options.duration,180);
 assert.equal(animations[0].frames[0].opacity,.92);
 f.tabs[0].emit('click');assert.equal(animations[0].cancelled,true);assert.equal(animations.length,2);
 f.browser.emit('pagehide');assert.equal(animations[1].cancelled,true);
 reduced.matches=true;f.tabs[1].emit('click');assert.equal(animations.length,2);
 f.browser.location.hash='#tools';f.browser.emit('popstate');assert.equal(animations.length,2);
 assert.equal(f.selected(),f.tabs[2]);
});
