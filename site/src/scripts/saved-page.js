import { withBase } from '../lib/base-path.js';
import { readSaved, writeSaved, restoreSaved, formatPlaceNotes } from '../lib/saved-places.js';
import { copyText } from '../lib/clipboard.js';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sourceURL = s => { try { const u = new URL(s); return ['http:', 'https:'].includes(u.protocol) ? esc(u.href) : '#'; } catch { return '#'; } };
const content = $('[data-saved-content]'), status = $('[data-saved-status]');
let catalog, displayed = [], removed, generation = 0;
async function loadCatalog() {
  if (!catalog) {
    const response = await fetch('/saved/places.json');
    if (!response.ok) throw new Error('The directory could not load. Your saved list is still on this device. Refresh the page to try again.');
    catalog = new Map((await response.json()).map(p => [p.path, p]));
  }
  return catalog;
}
function card(p) {
  return `<article class="saved-card"><header><div><p class="eyebrow">${esc(p.kind)}${p.code ? ' · ' + esc(p.code) : ''}</p><h2><a href="${esc(withBase(p.path))}">${esc(p.name)}</a></h2><p class="muted">${esc(p.city)}, ${esc(p.country)} · ${esc(p.status)}</p></div><button class="clear remove-place" data-remove="${esc(p.path)}" aria-label="Remove ${esc(p.name)}">Remove</button></header>${p.warnings.map(w=>`<p class="note">${esc(w)}</p>`).join('')}<details data-print-expand><summary>Room directions & sources <span class="fine">(${p.rooms.length} listing${p.rooms.length===1?'':'s'})</span></summary><div class="saved-rooms">${p.rooms.length ? p.rooms.map(r=>`<section><h3>${esc(r.name)}</h3><p class="where">${esc(r.location)}</p><dl class="facts"><div><dt>Access</dt><dd>${esc(r.access)}</dd></div><div><dt>Hours</dt><dd>${esc(r.hours)}</dd></div><div><dt>Wuḍūʾ</dt><dd>${esc(r.wudu)}</dd></div><div><dt>Women</dt><dd>${esc(r.women)}</dd></div></dl>${r.extra?`<p class="extra">${esc(r.extra)}</p>`:''}<p class="fine">Source date: ${esc(r.checked || 'Date unavailable')} · ${esc(r.provenance)}<br><a href="${sourceURL(r.source)}" rel="noopener">${esc(r.source)}</a></p></section>`).join('') : '<p>No room details are available in this listing. Ask the institution before visiting.</p>'}<p class="fine">Qibla: ${esc(p.qibla)}° from true north. Fixed bearing, not a live compass.</p></div></details><a class="saved-open" href="${esc(withBase(p.path))}">Open full listing →</a></article>`;
}
async function render() {
  const version = ++generation;
  document.querySelector('.saved-page [data-copy-fallback]')?.remove();
  let paths;
  try { paths = readSaved(localStorage); $('[data-saved-recovery]').hidden = true; }
  catch { status.textContent = 'Your saved list could not be read. Storage may be blocked or the saved data may be damaged. You can reset it below.'; $('[data-saved-recovery]').hidden = false; content.innerHTML=''; $('[data-saved-tools]').hidden=true; $('[data-saved-empty]').hidden=true; return; }
  $('[data-saved-empty]').hidden = paths.length > 0;
  $('[data-saved-tools]').hidden = true;
  if (!paths.length) { displayed = []; content.innerHTML = ''; return; }
  try {
    const all = await loadCatalog(); if (version !== generation) return;
    displayed = paths.map(path => all.get(path)).filter(Boolean);
    const missing = paths.filter(path => !all.has(path));
    $('[data-saved-tools]').hidden = displayed.length === 0;
    $('[data-saved-total]').textContent = `${paths.length} saved place${paths.length === 1 ? '' : 's'}`;
    const comparison = displayed.length ? `<section class="saved-comparison"><h2>At a glance</h2><p class="fine">These summaries cover any listed room at each place. Amenities may be in different rooms; check the directions below.</p><div class="comparison-scroll" tabindex="0" role="region" aria-label="Saved places comparison"><table><caption class="sr">Facilities at your saved places</caption><thead><tr><th scope="col">Place</th><th scope="col">Prayer space</th><th scope="col">Wuḍūʾ (any room)</th><th scope="col">Women (any room)</th></tr></thead><tbody>${displayed.map(p=>`<tr><th scope="row"><a href="${esc(withBase(p.path))}">${esc(p.code || p.name)}</a><span class="fine">${esc(p.city)}</span></th><td>${esc(p.status)}</td><td>${esc(p.wudu)}</td><td>${esc(p.women)}</td></tr>`).join('')}</tbody></table></div></section>` : '';
    content.innerHTML = comparison + displayed.map(card).join('') + missing.map(path=>`<article class="saved-card"><h2>Listing no longer available</h2><p>${esc(path)}</p><button class="clear" data-remove="${esc(path)}">Remove unavailable listing</button></article>`).join('');
  } catch (error) { status.textContent = error.message || 'Could not load saved places. Refresh to try again.'; }
}
content.addEventListener('click', async e => {
  const button = e.target.closest('[data-remove]'); if (!button) return;
  try {
    const paths = readSaved(localStorage), path = button.dataset.remove;
    const index = paths.indexOf(path), name = catalog?.get(path)?.name || 'Unavailable listing';
    writeSaved(localStorage, paths.filter(p => p !== path));
    removed = {path,index}; $('[data-undo-label]').textContent = `${name} removed.`; $('[data-saved-undo]').hidden = false;
    status.textContent = 'Place removed from this device.';
    window.dispatchEvent(new Event('saved-places-change')); await render(); $('[data-undo]').focus();
  } catch { status.textContent = 'Could not update saved places. No changes were saved.'; }
});
$('[data-undo]').addEventListener('click', async () => {
  if (!removed) return;
  try { writeSaved(localStorage, restoreSaved(readSaved(localStorage), removed.path, removed.index)); removed = null;
    $('[data-saved-undo]').hidden = true; status.textContent = 'Place restored.'; window.dispatchEvent(new Event('saved-places-change')); await render();
    content.querySelector('a')?.focus();
  } catch { status.textContent = 'Could not restore this place. Check storage settings or the 24-place limit.'; }
});
$('[data-copy-saved]').addEventListener('click', () => copyText(displayed.map(formatPlaceNotes).join('\n\n--------------------\n\n'), status, $('.saved-page')));
$('[data-reset-saved]').addEventListener('click', async () => {
  try { writeSaved(localStorage, []); status.textContent = 'Saved data cleared from this device.'; window.dispatchEvent(new Event('saved-places-change')); await render(); }
  catch { status.textContent = 'Browser storage is blocked. Enable it to use saved places, or copy details from individual listings.'; }
});
window.addEventListener('storage', () => { status.textContent = ''; render(); });
render();
