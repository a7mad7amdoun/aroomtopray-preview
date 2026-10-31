import { boundedMapTransform, zoomMapAt, MAP_MIN_SCALE, MAP_MAX_SCALE, readMapSelection, writeMapSelection } from '../lib/airport-map-state.js';
import { withBrowseContext } from '../lib/directory-context.js';

for (const root of document.querySelectorAll('[data-airport-map]')) {
  const { points, copy, locale, width, height } = JSON.parse(root.querySelector('[data-atlas-data]').textContent);
  const byCode = new Map(points.map(point => [point.code, point]));
  const ordered = [...points].sort((a, b) => a.city.localeCompare(b.city, locale) || a.iata.localeCompare(b.iata));
  const svg = root.querySelector('[data-atlas-svg]');
  const world = root.querySelector('[data-atlas-world]');
  const select = root.querySelector('[data-atlas-select]');
  const card = root.querySelector('[data-atlas-card]');
  const empty = root.querySelector('[data-atlas-empty]');
  const arc = root.querySelector('[data-atlas-arc]');
  const qiblaSwitch = root.querySelector('[data-atlas-qibla]');
  const marker = root.querySelector('[data-atlas-selected]');
  const makkah = root.querySelector('.atlas-makkah');
  const makkahOrigin = makkah.getAttribute('transform');
  const dots = [...root.querySelectorAll('[data-map-airport]')];
  const number = new Intl.NumberFormat(locale);
  let shown = new Set(points.map(point => point.code));
  let selected = null;
  let transform = { x: 0, y: 0, k: 1 };
  let drawnScale = null;
  let pixelsPerUnit = 1;
  let frame = 0;
  let drag = null;
  let suppressClick = false;

  for (const name of ['tools', 'zoom', 'information', 'instructions']) root.querySelector(`[data-atlas-${name}]`).hidden = false;
  svg.setAttribute('tabindex', '0');
  root.dataset.enhanced = 'true';

  function svgPoint(event) {
    const matrix = svg.getScreenCTM();
    if (!matrix) return { x: width / 2, y: height / 2 };
    return new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  }

  function selectedMarker() {
    const visible = selected && shown.has(selected.code);
    marker.toggleAttribute('hidden', !visible);
    arc.toggleAttribute('hidden', !visible || !qiblaSwitch.checked);
    if (!selected) return;
    marker.setAttribute('transform', `translate(${selected.x},${selected.y}) scale(${1 / (transform.k * pixelsPerUnit)})`);
    arc.setAttribute('d', selected.arc);
  }

  function render() {
    frame = 0;
    world.setAttribute('transform', `translate(${transform.x},${transform.y}) scale(${transform.k})`);
    pixelsPerUnit = Math.abs(svg.getScreenCTM()?.a) || 1;
    const markerScale = transform.k * pixelsPerUnit;
    const scaleKey = `${transform.k}:${pixelsPerUnit}`;
    if (drawnScale !== scaleKey) {
      drawnScale = scaleKey;
      for (const dot of dots) {
        dot.querySelector('.atlas-point').setAttribute('r', String(3.5 / markerScale));
        dot.querySelector('.atlas-hit').setAttribute('r', String(11 / markerScale));
      }
      makkah.setAttribute('transform', `${makkahOrigin} scale(${1 / markerScale})`);
      root.dataset.zoomed = String(transform.k > 1.8);
      root.querySelector('[data-atlas-scale]').textContent = `${number.format(Math.round(transform.k * 100))}%`;
      root.querySelector('[data-map-zoom=in]').disabled = transform.k >= MAP_MAX_SCALE;
      root.querySelector('[data-map-zoom=out]').disabled = transform.k <= MAP_MIN_SCALE;
    }
    selectedMarker();
  }

  function move(next) {
    transform = boundedMapTransform(next, width, height);
    if (!frame) frame = requestAnimationFrame(render);
  }
  function zoom(factor, point = { x: width / 2, y: height / 2 }) {
    move(zoomMapAt(transform, factor, point, width, height));
  }
  function focusAirport(point) {
    const k = Math.max(transform.k, 3.2);
    move({ x: width / 2 - point.x * k, y: height / 2 - point.y * k, k });
  }
  function choose(code, focus = false, write = false) {
    const previousCode = selected?.code;
    selected = byCode.get(code) || null;
    if (write) {
      const query = writeMapSelection(selected?.code, location.search);
      const target = location.pathname + (query ? '?' + query : '') + location.hash;
      if (target !== location.pathname + location.search + location.hash) history.pushState({}, '', target);
      document.dispatchEvent(new CustomEvent('atlas:selection'));
    }
    card.hidden = !selected;
    empty.hidden = Boolean(selected);
    select.value = selected && shown.has(selected.code) ? selected.code : '';
    for (const dot of dots) dot.classList.toggle('is-selected', dot.dataset.mapAirport === code);
    if (selected) {
      const values = {
        code: selected.iata, name: selected.fullName, location: `${selected.city}, ${selected.country}`,
        status: selected.statusLabel, wudu: selected.wudu, women: selected.women,
        bearing: selected.qibla, rooms: selected.rooms, checked: selected.checked,
      };
      if (selected.code !== previousCode) {
        for (const [key, value] of Object.entries(values)) root.querySelector(`[data-atlas-${key}]`).textContent = value;
      }
      const flag=root.querySelector('[data-atlas-flag]');if(flag){flag.hidden=!selected.flagUrl;if(selected.flagUrl)flag.src=selected.flagUrl;}
      root.querySelector('[data-atlas-status]').dataset.status = selected.status;
      root.querySelector('[data-atlas-link]').href = withBrowseContext(selected.url, location.search);
      root.querySelector('[data-atlas-selected-label]').textContent = selected.iata;
      root.querySelector('[data-atlas-filtered]').hidden = shown.has(selected.code);
      root.querySelector('[data-atlas-reveal]').hidden = !shown.has(selected.code);
      if (focus) focusAirport(selected);
    }
    selectedMarker();
  }

  function filter(codes) {
    shown = new Set(codes.filter(code => byCode.has(code)));
    for (const dot of dots) {
      const visible = shown.has(dot.dataset.mapAirport);
      dot.toggleAttribute('hidden', !visible);
      dot.setAttribute('aria-hidden', String(!visible));
    }
    const options = document.createDocumentFragment();
    options.append(new Option(copy.choose, ''));
    for (const point of ordered) if (shown.has(point.code)) options.append(new Option(`${point.iata} · ${point.city} · ${point.name}`, point.code));
    select.replaceChildren(options);
    select.disabled = shown.size === 0;
    select.value = selected && shown.has(selected.code) ? selected.code : '';
    root.querySelector('[data-atlas-count]').textContent = `${number.format(shown.size)} ${copy.count}`;
    root.querySelector('[data-atlas-no-results]').hidden = shown.size > 0;
    if (selected) root.querySelector('[data-atlas-filtered]').hidden = shown.has(selected.code);
    selectedMarker();
  }

  // Both event targets are accepted. A document event may deliberately not bubble.
  const handledEvents = new WeakSet();
  const update = event => {
    if (handledEvents.has(event) || !Array.isArray(event.detail?.codes)) return;
    handledEvents.add(event);
    filter(event.detail.codes);
    choose(readMapSelection(location.search, byCode));
  };
  document.addEventListener('directory:updated', update);
  window.addEventListener('directory:updated', update);
  const listItems = [...document.querySelectorAll('#list a.lrow')];
  let initialCodes;
  try { initialCodes = JSON.parse(document.querySelector('[data-directory]')?.dataset.matchingCodes || 'null'); } catch { /* The rendered list is the fallback. */ }
  if (Array.isArray(initialCodes)) filter(initialCodes);
  else if (listItems.length) filter(listItems.filter(item => !item.hidden).map(item => new URL(item.href).pathname.split('/').filter(Boolean).at(-1)));

  choose(readMapSelection(location.search, byCode), true);
  window.addEventListener('popstate', () => choose(readMapSelection(location.search, byCode), true));
  select.addEventListener('change', () => choose(select.value, true, true));
  qiblaSwitch.addEventListener('change', selectedMarker);
  root.querySelector('[data-atlas-clear]').addEventListener('click', () => { choose('', false, true); select.focus(); });
  root.querySelector('[data-atlas-reveal]').addEventListener('click', () => {
    if (selected && shown.has(selected.code)) document.dispatchEvent(new CustomEvent('directory:reveal', { detail: { code: selected.code } }));
  });
  root.querySelectorAll('[data-map-zoom]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.mapZoom === 'reset') move({ x: 0, y: 0, k: 1 });
    else zoom(button.dataset.mapZoom === 'in' ? 1.5 : 1 / 1.5);
  }));
  svg.addEventListener('click', event => {
    if (suppressClick) { event.preventDefault(); suppressClick = false; return; }
    const dot = event.target.closest('[data-map-airport]');
    if (!dot || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    choose(dot.dataset.mapAirport, false, true);
  });
  svg.addEventListener('dblclick', event => {
    if (event.target.closest('[data-map-airport]')) return;
    event.preventDefault();
    zoom(1.5, svgPoint(event));
  });
  svg.addEventListener('wheel', event => {
    // Ordinary scrolling always continues down the page.
    if (!event.ctrlKey) return;
    event.preventDefault();
    zoom(event.deltaY < 0 ? 1.15 : 1 / 1.15, svgPoint(event));
  }, { passive: false });
  svg.addEventListener('keydown', event => {
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    const steps = { ArrowLeft: [70, 0], ArrowRight: [-70, 0], ArrowUp: [0, 70], ArrowDown: [0, -70] };
    if (steps[event.key]) {
      event.preventDefault();
      const [x, y] = steps[event.key];
      move({ ...transform, x: transform.x + x, y: transform.y + y });
    } else if (['+', '=', '-', '−', '0', 'Home'].includes(event.key)) {
      event.preventDefault();
      if (event.key === '0' || event.key === 'Home') move({ x: 0, y: 0, k: 1 });
      else zoom(event.key === '+' || event.key === '=' ? 1.5 : 1 / 1.5);
    } else if (event.key === 'Escape') choose('', false, true);
  });
  svg.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    suppressClick = false;
    drag = { id: event.pointerId, start: svgPoint(event), origin: { ...transform }, moved: false };
  });
  svg.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const point = svgPoint(event);
    const dx = point.x - drag.start.x, dy = point.y - drag.start.y;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    if (!drag.moved) {
      drag.moved = true;
      svg.setPointerCapture(event.pointerId);
      svg.classList.add('is-dragging');
    }
    move({ ...drag.origin, x: drag.origin.x + dx, y: drag.origin.y + dy });
  });
  const endDrag = event => {
    if (!drag || event.pointerId !== drag.id) return;
    suppressClick = drag.moved;
    drag = null;
    svg.classList.remove('is-dragging');
    if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
  };
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);
  svg.addEventListener('pointerleave', event => { if (drag && !drag.moved) endDrag(event); });
  new ResizeObserver(() => { if (!frame) frame = requestAnimationFrame(render); }).observe(svg);
  render();
}
