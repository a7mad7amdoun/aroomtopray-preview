// Shared map presentation for every institution category.
for (const root of document.querySelectorAll('[data-airport-map]')) {
  const { airportCopy, explorerCopy, copy, kind } = JSON.parse(root.querySelector('[data-atlas-data]').textContent);
  const words = airportCopy.wayfinding;
  const directory = document.querySelector(`[data-directory="${kind}"]`);
  if (!directory) continue;
  const card = root.querySelector('[data-atlas-card]'), group = root.querySelector('[data-atlas-group]');
  const reset = root.querySelector('[data-explorer-reset]');
  const expand = root.querySelector('[data-airport-expand]'); expand.hidden = false;
  const options = document.createElement('details'); options.className = 'airport-map-options';
  const summary = document.createElement('summary'); summary.textContent = words.options;
  const optionsContent = document.createElement('div'); optionsContent.className = 'airport-map-options-content';
  options.append(summary, optionsContent); root.querySelector('.airport-map-heading').append(options);
  optionsContent.append(root.querySelector('.atlas-map-bar'), root.querySelector('.atlas-viewport-switch'), expand);
  const about = document.createElement('details'); about.className = 'airport-map-about';
  const aboutSummary = document.createElement('summary'); aboutSummary.textContent = words.legend;
  const aboutContent = document.createElement('div'); aboutContent.className = 'airport-about-content';
  about.append(aboutSummary, aboutContent);
  aboutContent.append(root.querySelector('.atlas-stats'), root.querySelector('.atlas-stats-note'), root.querySelector('.atlas-legend'), root.querySelector('.atlas-notes')); root.append(about);
  const roomPicker = root.querySelector('[data-atlas-room]'), roomLabel = root.querySelector('label[for="atlas-room"]');
  const roomLabelText = roomLabel.textContent;
  const singleRoom = document.createElement('p'); singleRoom.className = 'airport-single-room'; singleRoom.hidden = true; roomPicker.after(singleRoom);
  const sync = () => {
    const query = new URLSearchParams(location.search);
    const filtered = Boolean(query.get('q') || query.get('country') || query.get('f') || (query.get('region') && query.get('region') !== 'All'));
    const stage = !card.hidden ? 'detail' : !group.hidden || filtered ? 'results' : 'start'; root.dataset.airportStage = stage;
    const oneRoom = roomPicker.options.length === 1; roomPicker.hidden = oneRoom; singleRoom.hidden = !oneRoom;
    singleRoom.textContent = oneRoom ? roomPicker.options[0].textContent : ''; roomLabel.textContent = oneRoom ? words.room : roomLabelText;
    reset.hidden = !filtered && stage === 'start';
    root.querySelector('[data-airport-map-hint]').textContent = stage === 'detail' ? root.querySelector('[data-atlas-name]').textContent : copy.locationNote;
  };
  const world = root.querySelector('[data-airport-world]'); world.textContent = explorerCopy.world;
  world.addEventListener('click', () => { root.querySelector('[data-map-zoom="reset"]').click(); sync(); });
  const observer = new MutationObserver(() => { sync(); if (!card.hidden) options.open = false; });
  observer.observe(card, { attributes: true, attributeFilter: ['hidden'] }); observer.observe(group, { attributes: true, attributeFilter: ['hidden'] });
  let expanded = false, previousOverflow = '', previousFocus = null;
  const placeholder = document.createComment('Map position');
  const closeExpanded = document.createElement('button'); closeExpanded.type = 'button'; closeExpanded.className = 'airport-close-expanded'; closeExpanded.textContent = airportCopy.collapse; closeExpanded.hidden = true; root.prepend(closeExpanded);
  const setExpanded = value => {
    expanded = value; root.classList.toggle('is-expanded', value); expand.setAttribute('aria-expanded', String(value)); closeExpanded.hidden = !value;
    expand.querySelector('span').textContent = value ? airportCopy.collapse : airportCopy.expand; options.open = false;
    if (value) { previousOverflow = document.body.style.overflow; previousFocus = document.activeElement; root.before(placeholder); document.body.append(root); document.body.style.overflow = 'hidden'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); closeExpanded.focus(); }
    else { placeholder.replaceWith(root); document.body.style.overflow = previousOverflow; root.removeAttribute('role'); root.removeAttribute('aria-modal'); options.open = true; previousFocus?.focus({ preventScroll: true }); }
  };
  expand.addEventListener('click', () => setExpanded(!expanded)); closeExpanded.addEventListener('click', () => setExpanded(false));
  root.addEventListener('click', event => { if (expanded && event.target.closest('[data-atlas-reveal],[data-atlas-load-local]')) setExpanded(false); }, true);
  root.addEventListener('keydown', event => {
    if (!expanded) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setExpanded(false); return; }
    if (event.key !== 'Tab') return;
    const items = [...root.querySelectorAll('button,input,select,summary,a[href],iframe,[tabindex="0"]')].filter(element => !element.disabled && element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
    const first = items[0], last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }, true);
  document.addEventListener('directory:updated', sync); window.addEventListener('popstate', sync); sync();
}
