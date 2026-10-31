// Layover prayer planner (client only). Everything is computed in the browser; the plan is kept in
// localStorage on this device and never sent anywhere.
import { planTrip, tzOf, localParts, addDays, PRAYER_NAMES } from '../lib/prayer-times.js';

const KEY = 'arp-planner-v1';
const MAX_LEGS = 3;
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fold = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const dataEl = document.getElementById('pl-data');
if (dataEl) init(JSON.parse(dataEl.textContent));

function init(rows) {
  const AP = Object.fromEntries(rows.map(([code, short, city, country, label, cls, lat, lon]) => [code, { code, short, city, country, label, cls, lat, lon, tz: tzOf(code) }]));
  const lookup = (c) => (c && AP[String(c).toLowerCase()]?.tz ? AP[String(c).toLowerCase()] : null);
  const apText = (c) => (AP[c] ? `${c.toUpperCase()} · ${AP[c].short}` : '');

  // ---------- state ----------
  const todayLocal = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function example() {
    const d = addDays(todayLocal(), 7);
    return {
      example: true, method: 'mwl', asr: 'standard', before: '3',
      legs: [
        { from: 'jfk', to: 'lhr', depDate: d, depTime: '18:30', arrDate: addDays(d, 1), arrTime: '06:35' },
        { from: 'lhr', to: 'dxb', depDate: addDays(d, 1), depTime: '09:40', arrDate: addDays(d, 1), arrTime: '19:40' },
      ],
    };
  }
  const blankLeg = (from = '') => ({ from, to: '', depDate: todayLocal(), depTime: '', arrDate: todayLocal(), arrTime: '' });
  let st;
  try { st = JSON.parse(localStorage.getItem(KEY)); } catch { st = null; }
  if (!st || !Array.isArray(st.legs) || !st.legs.length) st = example();
  st.legs = st.legs.slice(0, MAX_LEGS);
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* storage unavailable: fine */ } };

  const form = $('#pl-form'), legsEl = $('#pl-legs');
  const methodEl = $('#pl-method'), asrEl = $('#pl-asr'), beforeEl = $('#pl-before');
  methodEl.value = st.method || 'mwl'; asrEl.value = st.asr || 'standard'; beforeEl.value = String(st.before || '3');

  // ---------- form ----------
  let uid = 0;
  function apField(i, end, label) {
    const id = `pl-${end}-${i}-${++uid}`;
    return `<div class="pl-ap" data-ap="${end}">
      <label for="${id}">${label} <span class="hint">Code or city</span></label>
      <input id="${id}" type="text" autocomplete="off" spellcheck="false" placeholder="e.g. JFK or New York" role="combobox" aria-expanded="false" aria-controls="${id}-list" aria-autocomplete="list" aria-describedby="${id}-err">
      <ul class="suggest" id="${id}-list" role="listbox" aria-label="Matching airports" hidden></ul>
      <span class="hint" id="${id}-err" aria-live="polite"></span>
    </div>`;
  }
  function drawLegs() {
    legsEl.innerHTML = st.legs.map((l, i) => `
      <fieldset class="pl-leg" data-i="${i}">
        <legend>Flight ${i + 1}</legend>
        <div class="pl-end"><h3>Departs</h3>${apField(i, 'from', 'From airport')}
          <div class="pl-when"><label>Date (local)<input type="date" data-f="depDate" value="${esc(l.depDate)}"></label><label>Time (local)<input type="time" data-f="depTime" value="${esc(l.depTime)}"></label></div></div>
        <div class="pl-end"><h3>Arrives</h3>${apField(i, 'to', 'To airport')}
          <div class="pl-when"><label>Date (local)<input type="date" data-f="arrDate" value="${esc(l.arrDate)}"></label><label>Time (local)<input type="time" data-f="arrTime" value="${esc(l.arrTime)}"></label></div></div>
        ${i > 0 ? `<button type="button" class="btn ghost rm" data-rm="${i}">Remove flight ${i + 1}</button>` : ''}
      </fieldset>`).join('');
    legsEl.querySelectorAll('.pl-leg').forEach((fs) => {
      const i = +fs.dataset.i;
      fs.querySelectorAll('[data-ap]').forEach((w) => combobox(w, i, w.dataset.ap));
    });
    $('#pl-add').hidden = st.legs.length >= MAX_LEGS;
  }

  function combobox(wrap, i, end) {
    const input = $('input', wrap), list = $('[role=listbox]', wrap), err = wrap.querySelector('[aria-live]');
    input.value = apText(st.legs[i][end]);
    let items = [], hl = -1;
    const close = () => { items = []; hl = -1; list.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); };
    const pick = (code) => {
      st.legs[i][end] = code; input.value = apText(code); input.removeAttribute('aria-invalid'); err.textContent = '';
      // A connecting flight leaves from where the previous one landed.
      if (end === 'to' && st.legs[i + 1] && !st.legs[i + 1].from) { st.legs[i + 1].from = code; const nxt = legsEl.querySelector(`.pl-leg[data-i="${i + 1}"] [data-ap="from"] input`); if (nxt) nxt.value = apText(code); }
      close(); changed();
    };
    const draw = () => {
      const q = fold(input.value.trim());
      items = q ? rows.filter((a) => a.slice(0, 4).some((v) => fold(v).includes(q))).sort((a, b) => (b[0] === q) - (a[0] === q)).slice(0, 7) : [];
      if (!items.length) return close();
      list.innerHTML = items.map((a, k) => `<li role="option" id="${list.id}-${k}" aria-selected="${k === hl}" data-code="${a[0]}"><span class="opt"><span class="code">${a[0].toUpperCase()}</span><span>${esc(a[1])}<br><span class="muted" style="font-size:.85rem">${esc(a[2])}, ${esc(a[3])}</span></span></span></li>`).join('');
      list.hidden = false; input.setAttribute('aria-expanded', 'true');
      if (hl >= 0) { input.setAttribute('aria-activedescendant', `${list.id}-${hl}`); document.getElementById(`${list.id}-${hl}`)?.scrollIntoView({ block: 'nearest' }); } else input.removeAttribute('aria-activedescendant');
    };
    // Typing invalidates the chosen airport: save and re-render so no stale timeline or stored airport remains.
    input.addEventListener('input', () => { const had = st.legs[i][end]; st.legs[i][end] = ''; hl = -1; draw(); markEdited(); if (had) changed(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { if (list.hidden) draw(); if (items.length) { hl = Math.min(hl + 1, items.length - 1); draw(); } e.preventDefault(); }
      else if (e.key === 'ArrowUp' && items.length) { hl = Math.max(hl - 1, 0); draw(); e.preventDefault(); }
      else if (e.key === 'Enter') { if (!list.hidden && items.length) { pick((items[hl] || items[0])[0]); e.preventDefault(); } }
      else if (e.key === 'Escape') close();
    });
    list.addEventListener('mousedown', (e) => e.preventDefault()); // keep focus in the input
    list.addEventListener('click', (e) => { const li = e.target.closest('[data-code]'); if (li) pick(li.dataset.code); });
    input.addEventListener('blur', () => {
      if (st.legs[i][end]) return close();
      const q = fold(input.value.trim());
      const exact = rows.find((a) => a[0] === q);
      if (exact) return pick(exact[0]);
      if (items.length === 1) return pick(items[0][0]);
      close();
      if (q) { input.setAttribute('aria-invalid', 'true'); err.textContent = 'Choose an airport from the list. The planner covers the airports in our directory.'; }
    });
  }

  legsEl.addEventListener('change', (e) => {
    const f = e.target.dataset.f; if (!f) return;
    const i = +e.target.closest('.pl-leg').dataset.i;
    st.legs[i][f] = e.target.value;
    // Keep the arrival date from falling before the departure date.
    if (f === 'depDate' && st.legs[i].arrDate < e.target.value) { st.legs[i].arrDate = e.target.value; const a = e.target.closest('.pl-leg').querySelector('[data-f="arrDate"]'); if (a) a.value = e.target.value; }
    markEdited(); changed();
  });
  legsEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-rm]'); if (!b) return;
    st.legs.splice(+b.dataset.rm, 1); markEdited(); drawLegs(); changed();
    legsEl.querySelector('.pl-leg:last-child legend')?.scrollIntoView({ block: 'nearest' });
  });
  $('#pl-add').addEventListener('click', () => {
    if (st.legs.length >= MAX_LEGS) return;
    const prev = st.legs.at(-1);
    const leg = blankLeg(prev.to); leg.depDate = prev.arrDate || leg.depDate; leg.arrDate = leg.depDate;
    st.legs.push(leg); markEdited(); drawLegs(); changed();
    legsEl.querySelector(`.pl-leg[data-i="${st.legs.length - 1}"] [data-ap="to"] input`)?.focus();
  });
  $('#pl-blank').addEventListener('click', () => {
    st = { example: false, method: methodEl.value, asr: asrEl.value, before: beforeEl.value, legs: [blankLeg()] };
    drawLegs(); changed();
    legsEl.querySelector('input')?.focus();
  });
  for (const [el, k] of [[methodEl, 'method'], [asrEl, 'asr'], [beforeEl, 'before']]) el.addEventListener('change', () => { st[k] = el.value; changed(); });
  form.addEventListener('submit', (e) => e.preventDefault());

  function markEdited() { if (st.example) { st.example = false; $('#pl-example').hidden = true; } }

  // ---------- results ----------
  const zoneName = (tz) => tz.split('/').at(-1).replace(/_/g, ' ');
  const fmtDay = (ms, tz) => new Date(ms).toLocaleDateString('en-GB', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' });
  const at = (ms, tz) => `${localParts(ms, tz).time} <small>${esc(fmtDay(ms, tz))}</small>`;
  const code = (a) => a.code.toUpperCase();
  const room = (a) => `<div class="pl-room"><span>Our listing for ${code(a)}:</span><span class="pill ${a.cls}">${esc(a.label)}</span><a href="/airports/${a.code}/">${esc(a.short)} airport page</a></div>`;
  const prayerList = (evs, tz) => `<ul class="pl-pr">${evs.map((e) => `<li><span class="n">${PRAYER_NAMES[e.prayer]}</span><span class="t">begins ${at(e.ms, tz)}${e.adjusted ? ' <small>(high-latitude estimate)</small>' : ''}</span></li>`).join('')}</ul>`;
  const context = (p) => {
    const parts = [];
    if (p.before) parts.push(`Last prayer time to begin before this: <b>${PRAYER_NAMES[p.before.prayer]}</b> at ${at(p.before.ms, p.place.tz)}.`);
    if (p.next && p.kind !== 'before' && p.kind !== 'layover') parts.push(`Next: <b>${PRAYER_NAMES[p.next.prayer]}</b> at ${at(p.next.ms, p.place.tz)}.`);
    return parts.length ? `<p class="pl-none">${parts.join(' ')}</p>` : '';
  };

  function ground(p, kicker, title) {
    const tz = p.place.tz;
    const win = p.kind === 'arrival' ? `Lands ${at(p.from, tz)} (${zoneName(tz)} time)` : `${at(p.from, tz)} to ${at(p.to, tz)} (${zoneName(tz)} time)`;
    const body = p.kind === 'arrival' ? '' : (p.events.length ? prayerList(p.events, tz) : '<p class="pl-none">No prayer time begins at this airport in this window.</p>');
    return `<li class="pl-ph"><span class="k">${kicker}</span><h3>${title}</h3><p class="win">${win}</p>
      <div class="pl-card">${body}${context(p)}${room(p.place)}</div></li>`;
  }
  function air(p) {
    const a = p.place, b = p.dest;
    const end = (evs, ap, label) => `<div><p class="pl-none"><b>${label}</b> (${code(ap)}, ${zoneName(ap.tz)} time)</p>${evs.length ? prayerList(evs, ap.tz) : '<p class="pl-none">None begins during the flight.</p>'}</div>`;
    const body = p.events.length
      ? `<p class="pl-none">Prayer times that begin while you’re flying, measured on the ground at each end:</p>${end(p.atFrom, a, 'Where you left')}${end(p.atTo, b, 'Where you’re going')}`
      : '<p class="pl-none">No prayer time begins at either airport while you’re flying.</p>';
    return `<li class="pl-ph air"><span class="k">In the air · flight ${p.leg + 1}</span><h3>${code(a)} → ${code(b)}</h3>
      <p class="win">Takes off ${at(p.from, a.tz)} (${zoneName(a.tz)}), lands ${at(p.to, b.tz)} (${zoneName(b.tz)})</p>
      <div class="pl-card">${body}<p class="pl-air-note">On board, prayer times depend on where the plane is, so these are only a guide. <a href="/travel/praying-on-a-plane/">Praying on a plane</a></p></div></li>`;
  }

  let timer;
  function changed() { save(); clearTimeout(timer); timer = setTimeout(render, 120); }
  function render() {
    const errEl = $('#pl-errors'), tl = $('#pl-tl'), status = $('#pl-status');
    $('#pl-example').hidden = !st.example;
    const complete = st.legs.every((l) => l.from && l.to && l.depDate && l.depTime && l.arrDate && l.arrTime);
    if (!complete) {
      errEl.hidden = true; tl.innerHTML = '<li class="pl-ph"><p class="pl-none">Fill in each flight’s airports, dates and local times to see your timeline.</p></li>';
      $('#pl-qasr').hidden = true; status.textContent = ''; return;
    }
    const { errors, phases } = planTrip(st.legs, lookup, { method: st.method, asr: st.asr, beforeHours: +st.before || 3 });
    errEl.hidden = !errors.length;
    errEl.innerHTML = errors.map(esc).join('<br>');
    if (errors.length) { tl.innerHTML = ''; $('#pl-qasr').hidden = true; status.textContent = 'Check your flights: ' + errors.join(' '); return; }
    tl.innerHTML = phases.map((p) => {
      if (p.kind === 'air') return air(p);
      if (p.kind === 'before') return ground(p, 'Before you fly', `At ${code(p.place)}, ${esc(p.place.city)}`);
      if (p.kind === 'layover') return ground(p, 'Layover', `At ${code(p.place)}, ${esc(p.place.city)}`);
      return ground(p, 'After you land', `At ${code(p.place)}, ${esc(p.place.city)}`);
    }).join('');
    const n = phases.reduce((s, p) => s + p.events.length, 0);
    $('#pl-qasr').hidden = false;
    status.textContent = `Timeline updated: ${n} prayer time${n === 1 ? '' : 's'} across ${st.legs.length} flight${st.legs.length === 1 ? '' : 's'}.`;
  }

  drawLegs();
  render();
}
