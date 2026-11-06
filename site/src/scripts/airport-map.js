import { boundedMapTransform, zoomMapAt, MAP_MIN_SCALE, MAP_MAX_SCALE, readMapSelection } from '../lib/airport-map-state.js';
import { clusterMapPoints, fitMapPoints, mapCoverage } from '../lib/place-map.js';
import { withBrowseContext } from '../lib/directory-context.js';
import { exploreMapPoints, mapWindowPoints, resolveMapSearch, nearestMapTarget, wheelMapTransform, focusMapTransform, expandMapGroup, mapMarkerLabel, mapSelectionQuery, mapResultFocus } from '../lib/map-explorer.js';
import { chooseAirportRoom, matchingAirportRooms, writeAirportRoom } from '../lib/airport-room-selection.js';

for (const root of document.querySelectorAll('[data-airport-map]')) {
  const { points, copy, explorerCopy, airportCopy, locale, kind, selectionKey = 'airport', width, height } = JSON.parse(root.querySelector('[data-atlas-data]').textContent);
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
  const markerLabels = dots.map(dot => {
    const point=byCode.get(dot.dataset.mapAirport),label=mapMarkerLabel(point,kind);
    const group=document.createElementNS('http://www.w3.org/2000/svg','g');group.setAttribute('class','atlas-pin-label');group.setAttribute('aria-hidden','true');
    const box=document.createElementNS('http://www.w3.org/2000/svg','rect'),text=document.createElementNS('http://www.w3.org/2000/svg','text');
    const width=Math.max(24,[...label].length*7+12);
    for(const [key,value] of Object.entries({x:9,y:-24,width,height:19,rx:5}))box.setAttribute(key,String(value));
    text.setAttribute('x',String(9+width/2));text.setAttribute('y','-10');text.setAttribute('text-anchor','middle');text.textContent=label;
    group.append(box,text);dot.append(group);return {dot,point,group,width};
  });
  const number = new Intl.NumberFormat(locale);
  let shown = new Set(points.map(point => point.code));
  let selected = null;
  let transform = { x: 0, y: 0, k: 1 };
  let browseTransform = { ...transform };
  let drawnScale = null;
  let pixelsPerUnit = 1;
  let frame = 0;
  let drag = null;
  let suppressClick = false;
  let motionFrame = 0;
  let motionTarget = null;
  let motionClusterScale = null;
  let clusterGroups = new Map();
  let clusterSignature = '';
  const clusters = root.querySelector('[data-atlas-clusters]');
  const groupPanel = root.querySelector('[data-atlas-group]');
  const localPanel = root.querySelector('[data-atlas-local]');
  const localFrame = root.querySelector('[data-atlas-local-frame]');
  const localButton = root.querySelector('[data-atlas-load-local]');
  const roomSelect = root.querySelector('[data-atlas-room]');
  const fitButton = root.querySelector('[data-atlas-fit]');
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const browser = root.querySelector('[data-explorer-browser]');
  const placeList = root.querySelector('[data-explorer-list]');
  const back = root.querySelector('[data-explorer-back]');
  const search = root.querySelector('[data-explorer-search]');
  const country = root.querySelector('[data-explorer-country]');
  const viewport = root.querySelector('[data-explorer-viewport]');
  const more = root.querySelector('[data-explorer-more]');
  const directorySearch = document.querySelector('#q-dir');
  const directoryCountry = document.querySelector('[data-directory-country]');
  let listLimit = 40;
  let listSignature = '';
  function renderBrowser() {
    const matching = exploreMapPoints(ordered, { allowedCodes: shown });
    const visible = viewport.checked ? mapWindowPoints(matching, transform, width, height) : matching;
    const page = visible.slice(0, listLimit);
    const signature = `${matching.length}:${visible.length}:${viewport.checked}:${page.map(p=>p.code).join(',')}`;
    if (signature === listSignature) return;
    listSignature = signature;
    const previousButtons=[...placeList.querySelectorAll('[data-explorer-place]')];
    const activePlace=document.activeElement?.closest?.('[data-explorer-place]');
    const hadFocus=activePlace && placeList.contains(activePlace);
    const focusCode=hadFocus?mapResultFocus(previousButtons.map(button=>button.dataset.explorerPlace),page.map(point=>point.code),activePlace.dataset.explorerPlace):null;
    root.querySelector('[data-explorer-count]').textContent = number.format(visible.length);
    const noPlaces = root.querySelector('[data-explorer-empty]');
    noPlaces.hidden = visible.length > 0;
    noPlaces.textContent = matching.length ? explorerCopy.empty : copy.none;
    const showAll=root.querySelector('[data-airport-show-all]');
    if(showAll)showAll.hidden=!(viewport.checked && visible.length<matching.length);
    more.hidden = visible.length <= listLimit;
    const fragment = document.createDocumentFragment();
    for (const point of page) {
      const li = document.createElement('li'), button = document.createElement('button');
      button.type = 'button'; button.dataset.explorerPlace = point.code;
      const code = document.createElement('span'); code.className = 'atlas-place-code'; code.dir = 'ltr'; code.textContent = mapMarkerLabel(point,kind); code.setAttribute('aria-hidden','true');
      const text = document.createElement('span'); text.className = 'atlas-place-copy';
      const title = document.createElement('strong'); title.textContent = point.fullName;
      const locationText = document.createElement('span'); locationText.textContent = `${point.city} · ${point.country}`;
      const status = document.createElement('small'); status.dataset.status = point.status; status.textContent = point.statusLabel;
      text.append(title, locationText, status);
      const arrow = document.createElement('span'); arrow.className = 'atlas-place-arrow'; arrow.textContent = '↗'; arrow.setAttribute('aria-hidden','true');
      button.append(code, text, arrow);
      button.addEventListener('click',()=>{choose(point.code,true,true);focusDetails();});
      li.append(button); fragment.append(li);
    }
    placeList.replaceChildren(fragment);
    if(hadFocus) {
      const target=[...placeList.querySelectorAll('[data-explorer-place]')].find(button=>button.dataset.explorerPlace===focusCode);
      (target || root.querySelector('#atlas-results-title')).focus({preventScroll:true});
    }
  }
  function focusDetails() {
    const heading = root.querySelector('[data-atlas-name]');
    heading.setAttribute('tabindex','-1'); heading.focus({preventScroll:true});
    if (window.matchMedia?.('(max-width: 760px)').matches) card.scrollIntoView({block:'nearest',behavior:'auto'});
  }
  fitButton.hidden = false;
  const writeHistory = (query, method='pushState') => {
    const target = location.pathname + (query ? '?' + query : '') + location.hash;
    if (target !== location.pathname + location.search + location.hash) {
      try { history[method]({}, '', target); } catch { /* Selection still works when history is blocked. */ }
    }
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(render); };
  function closeLocal() {
    localFrame.replaceChildren(); localFrame.hidden = true;
    root.dataset.street='false';
    root.querySelector('[data-explorer-world]').hidden=true;
    localButton.textContent = explorerCopy.street; localButton.setAttribute('aria-expanded', 'false');
  }
  function showRoom(index) {
    const room = selected?.roomDetails[Number(index)];
    root.querySelector('[data-atlas-room-details]').hidden = !room;
    root.querySelector('[data-atlas-no-source]').hidden = Boolean(room?.source);
    if(kind==='airports') {
      root.querySelector('.atlas-room-picker').hidden=!selected?.roomDetails.length;
      root.querySelector('[data-airport-no-rooms]').hidden=Boolean(room);
      if(selected)root.querySelector('[data-atlas-link]').href=withBrowseContext(selected.url,writeAirportRoom(room?Number(index):-1,location.search))+(room?`#room-${Number(index)+1}`:'');
      const match=root.querySelector('[data-airport-match]');
      const active=(new URLSearchParams(location.search).get('f') || '').split(',').some(f=>['airside','wudu','women','h24'].includes(f));
      match.hidden=!room || !active;
      match.textContent=matchingAirportRooms(selected?.roomDetails || [],location.search).includes(Number(index))?airportCopy.matching:airportCopy.alternative;
      if(room)root.querySelector('[data-atlas-room-security]').textContent=room.security;
    }
    if (!room) return;
    for (const [key,value] of Object.entries({ 'room-location':room.location || copy.notStated, 'room-access':room.access, 'room-hours':room.hours, wudu:room.wudu, women:room.women, checked:room.checked, 'source-kind':room.sourceLabel })) root.querySelector(`[data-atlas-${key}]`).textContent=value;
    const access=root.querySelector('[data-atlas-room-access]');
    access.lang = room.accessLang;
    const caution=root.querySelector('[data-atlas-room-caution]'); caution.hidden=!room.caution; caution.textContent=room.caution;
    const source=root.querySelector('[data-atlas-source]'); source.hidden=!room.source;
    if(room.source)source.href=room.source;else source.removeAttribute('href');
    root.querySelector('[data-atlas-source-kind]').hidden=!room.source;
    const indoor=root.querySelector('[data-atlas-indoor]');indoor.hidden=!room.indoorMap;
    if(room.indoorMap) {
      const resource=room.indoorMap,link=root.querySelector('[data-atlas-indoor-link]');
      link.href=resource.url;link.textContent=`${copy[resource.type]} ↗`;
      root.querySelector('[data-atlas-indoor-name]').textContent=resource.name;
      root.querySelector('[data-atlas-indoor-source]').href=resource.source;
      const checked=root.querySelector('[data-atlas-indoor-checked]');checked.dateTime=resource.checked;
      checked.textContent=new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeZone:'UTC'}).format(new Date(`${resource.checked}T12:00:00Z`));
    }
    const advisory=root.querySelector('[data-atlas-advisory]');advisory.hidden=!room.advisory;
    if(room.advisory) {
      root.querySelector('[data-atlas-advisory-text]').textContent=copy[room.advisory.key];
      root.querySelector('[data-atlas-advisory-sources]').replaceChildren(...room.advisory.sources.map((url,i)=>{
        const link=document.createElement('a');link.href=url;link.textContent=`${copy.advisorySources[i]} ↗`;link.target='_blank';link.rel='noopener noreferrer';return link;
      }));
    }
  }
  function renderClusters(scale) {
    // Keep membership stable during a camera transition. Only the cluster's
    // inverse scale changes, so its hit target and keyboard focus stay intact.
    const groupingScale=motionClusterScale ?? scale;
    const signature=`${groupingScale}:${selected?.code || ''}:${[...shown].join(',')}`;
    if(signature===clusterSignature) {
      for(const node of clusters.children) {
        const group=clusterGroups.get(node.dataset.atlasCluster);
        if(group)node.setAttribute('transform',`translate(${group.x},${group.y}) scale(${1/scale})`);
      }
      return;
    }
    const focusedCluster=document.activeElement?.closest?.('[data-atlas-cluster]');
    const focusedCode=focusedCluster && clusters.contains(focusedCluster)
      ? clusterGroups.get(focusedCluster.dataset.atlasCluster)?.members[0]?.code : null;
    clusterSignature=signature;
    const visible=points.filter(p=>shown.has(p.code));
    const groups=clusterMapPoints(visible, groupingScale, selected?.code);
    clusterGroups=new Map(groups.filter(g=>g.members.length>1).map(g=>[g.key,g]));
    const grouped=new Set([...clusterGroups.values()].flatMap(g=>g.members.map(p=>p.code)));
    for(const dot of dots) dot.toggleAttribute('hidden', !shown.has(dot.dataset.mapAirport) || grouped.has(dot.dataset.mapAirport));
    const fragment=document.createDocumentFragment();
    for(const group of clusterGroups.values()) {
      const node=document.createElementNS('http://www.w3.org/2000/svg','g');
      node.setAttribute('class','atlas-cluster');node.setAttribute('data-atlas-cluster',group.key);
      node.setAttribute('transform',`translate(${group.x},${group.y}) scale(${1/scale})`);
      node.setAttribute('role','button');node.setAttribute('tabindex','0');
      node.setAttribute('aria-label',`${number.format(group.members.length)} ${copy.group}`);
      const hit=document.createElementNS('http://www.w3.org/2000/svg','circle');hit.setAttribute('r','22');hit.setAttribute('class','atlas-cluster-hit');
      const circle=document.createElementNS('http://www.w3.org/2000/svg','circle');circle.setAttribute('r','17');
      const text=document.createElementNS('http://www.w3.org/2000/svg','text');text.setAttribute('text-anchor','middle');text.setAttribute('dy','.35em');text.textContent=number.format(group.members.length);
      node.append(hit,circle,text);fragment.append(node);
    }
    clusters.replaceChildren(fragment);
    if(focusedCode) {
      const replacement=[...clusters.children].find(node=>clusterGroups.get(node.dataset.atlasCluster)?.members.some(point=>point.code===focusedCode));
      (replacement || svg).focus({preventScroll:true});
    }
  }
  function showGroup(key) {
    const group=clusterGroups.get(key); if(!group)return;
    if(groupPanel.hidden)browseTransform={...transform};
    choose('',false,true);
    const members=[...group.members].sort((a,b)=>a.city.localeCompare(b.city,locale)||a.name.localeCompare(b.name,locale));
    groupPanel.hidden=false;
    browser.hidden=true; back.hidden=false; card.hidden=true;
    empty.hidden=true;
    const list=root.querySelector('[data-atlas-group-list]');list.replaceChildren();
    for(const point of members) {
      const li=document.createElement('li'),button=document.createElement('button');button.type='button';
      const name=document.createElement('strong'),locationText=document.createElement('span');name.textContent=point.fullName;locationText.textContent=`${point.city} · ${point.country}`;
      button.append(name,locationText);button.addEventListener('click',()=>{choose(point.code,true,true);focusDetails();});li.append(button);list.append(li);
    }
    move(expandMapGroup(members,transform,width,height),true);
    root.querySelector('#atlas-group-title').focus({preventScroll:true});
  }

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
        dot.querySelector('.atlas-point').setAttribute('r', String(5 / markerScale));
        dot.querySelector('.atlas-hit').setAttribute('r', String(22 / markerScale));
      }
      makkah.setAttribute('transform', `${makkahOrigin} scale(${1 / markerScale})`);
      root.dataset.zoomed = String(transform.k > 1.8);
      root.querySelector('[data-atlas-scale]').textContent = `${number.format(Math.round(transform.k * 100))}%`;
      root.querySelector('[data-map-zoom=in]').disabled = transform.k >= MAP_MAX_SCALE;
      root.querySelector('[data-map-zoom=out]').disabled = transform.k <= MAP_MIN_SCALE;
    }
    renderClusters(markerScale);
    const occupied=[];
    for(const {dot,point,group,width:labelWidth} of markerLabels) {
      const x=(point.x*transform.k+transform.x)*pixelsPerUnit,y=(point.y*transform.k+transform.y)*pixelsPerUnit;
      const box={left:x+9,right:x+9+labelWidth,top:y-24,bottom:y-5};
      const visible=!motionTarget && transform.k>=2 && !dot.hasAttribute('hidden') && point.code!==selected?.code && x>=0 && x<=width*pixelsPerUnit && y>=24 && y<=height*pixelsPerUnit
        && !occupied.some(other=>box.left<other.right+4 && box.right>other.left-4 && box.top<other.bottom+4 && box.bottom>other.top-4);
      group.toggleAttribute('hidden',!visible);
      if(visible){group.setAttribute('transform',`translate(${point.x},${point.y}) scale(${1/markerScale})`);occupied.push(box);}
    }
    selectedMarker();
    // Viewport results settle with the camera rather than replacing focused
    // result buttons repeatedly as points cross the screen during animation.
    if(!motionTarget)renderBrowser();
  }

  function stopMotion(finish = false) {
    if(motionFrame)cancelAnimationFrame(motionFrame);
    if(finish && motionTarget)transform=motionTarget;
    motionFrame=0;
    motionTarget=null;
    motionClusterScale=null;
  }
  function move(next, animate = false) {
    stopMotion();
    const target=boundedMapTransform(next,width,height);
    if(Math.abs(target.k-transform.k)<.0001 && Math.abs(target.x-transform.x)<.01 && Math.abs(target.y-transform.y)<.01){transform=target;schedule();return;}
    if(!animate || reducedMotion?.matches) { transform=target;schedule();return; }
    const before={...transform},start=performance.now();
    const duration=240;
    motionTarget=target;
    motionClusterScale=transform.k*pixelsPerUnit;
    const tick=time=>{
      const progress=Math.max(0,Math.min(1,(time-start)/duration)),eased=progress*progress*(3-2*progress);
      transform={x:before.x+(target.x-before.x)*eased,y:before.y+(target.y-before.y)*eased,k:before.k+(target.k-before.k)*eased};
      if(progress<1)motionFrame=requestAnimationFrame(tick);
      else { transform=target;motionFrame=0;motionTarget=null;motionClusterScale=null; }
      schedule();
    };
    motionFrame=requestAnimationFrame(tick);
  }
  reducedMotion?.addEventListener('change',event=>{
    if(event.matches && motionTarget) { stopMotion(true);schedule(); }
  });
  function zoom(factor, point = { x: width / 2, y: height / 2 }) {
    // Count every deliberate zoom press, even before the previous one settles.
    move(zoomMapAt(motionTarget || transform, factor, point, width, height), true);
  }
  function fitCameraPoints(visible) {
    const target=fitMapPoints(visible,width,height);
    if(target.k<=3.2)return target;
    // Sparse results need geographic context, not the maximum magnification.
    const k=3.2;
    return boundedMapTransform({k,x:width/2-(width/2-target.x)/target.k*k,y:height/2-(height/2-target.y)/target.k*k},width,height);
  }
  function returnToWorld(animate=true) {
    viewport.checked=false;
    closeLocal();
    choose('',false,true);
    move({x:0,y:0,k:1},animate);
  }
  function focusAirport(point) {
    move(focusMapTransform(point,transform,width,height),true);
  }
  function choose(code, focus = false, write = false, historyMethod = 'pushState') {
    const previousCode = selected?.code;
    selected = byCode.get(code) || null;
    if(selected && !previousCode)browseTransform={...(motionTarget || transform)};
    if(selected?.code!==previousCode)stopMotion();
    if (write) {
      writeHistory(mapSelectionQuery(selected?.code,location.search,selectionKey),historyMethod);
      document.dispatchEvent(new CustomEvent('atlas:selection'));
    }
    groupPanel.hidden=true;
    localPanel.hidden=!selected;
    localButton.hidden=!selected;
    if(selected?.code!==previousCode)closeLocal();
    card.hidden = !selected;
    empty.hidden = true;
    browser.hidden = Boolean(selected);
    back.hidden = !selected;
    root.dataset.selected = String(Boolean(selected));
    select.value = selected && shown.has(selected.code) ? selected.code : '';
    for (const dot of dots) dot.classList.toggle('is-selected', dot.dataset.mapAirport === code);
    if (selected) {
      const values = {
        code: mapMarkerLabel(selected,kind), name: selected.fullName, location: `${selected.city}, ${selected.country}`,
        status: selected.statusLabel,
        bearing: selected.qibla, rooms: selected.rooms,
      };
      {
        for (const [key, value] of Object.entries(values)) root.querySelector(`[data-atlas-${key}]`).textContent = value;
      }
      const flag=root.querySelector('[data-atlas-flag]');if(flag){flag.hidden=!selected.flagUrl;if(selected.flagUrl)flag.src=selected.flagUrl;}
      root.querySelector('[data-atlas-status]').dataset.status = selected.status;
      root.querySelector('[data-atlas-link]').href = withBrowseContext(selected.url, location.search);
      root.querySelector('[data-atlas-selected-label]').textContent = mapMarkerLabel(selected,kind);
      root.querySelector('[data-atlas-filtered]').hidden = shown.has(selected.code);
      root.querySelector('[data-atlas-reveal]').hidden = !shown.has(selected.code);
      const caution=root.querySelector('[data-atlas-caution]');caution.hidden=!selected.caution;caution.textContent=selected.caution;
      caution.lang=kind==='airports'?'en':locale;caution.dir='auto';
      const priorRoom=selected.code===previousCode?roomSelect.value:'0';
      roomSelect.replaceChildren(...selected.roomDetails.map((room,i)=>new Option(room.name,String(i))));
      roomSelect.disabled=!selected.roomDetails.length;
      roomSelect.value=kind==='airports'?String(chooseAirportRoom(selected.roomDetails,location.search,{preferredIndex:selected.code===previousCode?Number(priorRoom):null})):(selected.roomDetails[Number(priorRoom)]?priorRoom:'0');
      showRoom(roomSelect.value);
      if(!reducedMotion?.matches && selected.code!==previousCode)card.animate?.([{opacity:.35,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'cubic-bezier(.4,0,.2,1)'});
      root.querySelector('[data-atlas-local-name]').textContent=selected.fullName;
      root.querySelector('[data-atlas-coordinates]').textContent=`${selected.lat.toFixed(4)}, ${selected.lon.toFixed(4)}`;
      root.querySelector('[data-atlas-google]').href=selected.links.google;
      root.querySelector('[data-atlas-osm]').href=selected.links.osm;
      if (focus) focusAirport(selected);
    }
    schedule();
    selectedMarker();
  }

  function filter(codes) {
    clusterSignature='';
    shown = new Set(codes.filter(code => byCode.has(code)));
    for (const dot of dots) {
      const visible = shown.has(dot.dataset.mapAirport);
      dot.toggleAttribute('hidden', !visible);
      dot.setAttribute('aria-hidden', String(!visible));
    }
    const options = document.createDocumentFragment();
    options.append(new Option(copy.choose, ''));
    for (const point of ordered) if (shown.has(point.code)) options.append(new Option(`${kind==='airports'?point.iata+' · ':''}${point.city} · ${point.name}`, point.code));
    select.replaceChildren(options);
    select.disabled = shown.size === 0;
    select.value = selected && shown.has(selected.code) ? selected.code : '';
    root.querySelector('[data-atlas-count]').textContent = `${number.format(shown.size)} ${copy.count}`;
    root.querySelector('[data-atlas-no-results]').hidden = shown.size > 0;
    if (selected) root.querySelector('[data-atlas-filtered]').hidden = shown.has(selected.code);
    const coverage=mapCoverage(points.filter(point=>shown.has(point.code)));
    for(const [key,value] of Object.entries(coverage))root.querySelector(`[data-atlas-stat=${key}]`).textContent=number.format(value);
    fitButton.disabled=!shown.size;
    groupPanel.hidden=true;
    listLimit=40;
    search.value=directorySearch?.value || '';
    country.value=directoryCountry?.value || '';
    renderBrowser();
    schedule();selectedMarker();
  }

  // Both event targets are accepted. A document event may deliberately not bubble.
  const handledEvents = new WeakSet();
  const update = event => {
    if (handledEvents.has(event) || !Array.isArray(event.detail?.codes)) return;
    handledEvents.add(event);
    filter(event.detail.codes);
    choose(readMapSelection(location.search, byCode, selectionKey));
  };
  document.addEventListener('directory:updated', update);
  window.addEventListener('directory:updated', update);
  const listItems = [...document.querySelectorAll('#list a.lrow')];
  let initialCodes;
  try { initialCodes = JSON.parse(document.querySelector('[data-directory]')?.dataset.matchingCodes || 'null'); } catch { /* The rendered list is the fallback. */ }
  if (Array.isArray(initialCodes)) filter(initialCodes);
  else if (listItems.length) filter(listItems.filter(item => !item.hidden).map(item => new URL(item.href).pathname.split('/').filter(Boolean).at(-1)));

  choose(readMapSelection(location.search, byCode, selectionKey), true);
  if(!selected)move(fitCameraPoints(points.filter(point=>shown.has(point.code))));
  window.addEventListener('popstate', () => choose(readMapSelection(location.search, byCode, selectionKey), true));
  select.addEventListener('change', () => choose(select.value, true, true));
  const syncSearch = () => {
    if (!directorySearch) return;
    stopMotion();
    directorySearch.value=search.value;
    directorySearch.dispatchEvent(new Event('input',{bubbles:true}));
    choose('',false,true,'replaceState');
    // Typing refines results without pulling the camera around on each letter.
    // Choosing a result, region or Fit results is the explicit navigation step.
  };
  search.addEventListener('input',syncSearch);
  search.addEventListener('keydown',event=>{
    if(event.key!=='Enter'||event.isComposing)return;
    event.preventDefault();
    const matches=ordered.filter(p=>shown.has(p.code));
    const exact=resolveMapSearch(matches,search.value,kind);
    if(exact) {choose(exact.code,true,true);focusDetails();}
    else {const title=root.querySelector('#atlas-results-title');title.tabIndex=-1;title.focus();}
  });
  country.addEventListener('change',()=>{
    if (!directoryCountry) return;
    directoryCountry.value=country.value;
    directoryCountry.dispatchEvent(new Event('change',{bubbles:true}));
    choose('',false,true,'replaceState');
    move(fitCameraPoints(points.filter(p=>shown.has(p.code))),true);
  });
  root.querySelector('[data-explorer-reset]').addEventListener('click',()=>{
    viewport.checked=false;
    document.querySelector('#clear')?.click();
    choose('',false,true,'replaceState'); move({x:0,y:0,k:1},true); search.focus();
  });
  viewport.addEventListener('change',()=>{listLimit=40;listSignature='';renderBrowser();});
  more.addEventListener('click',()=>{
    const previousCount=placeList.querySelectorAll('[data-explorer-place]').length;
    listLimit+=40;renderBrowser();
    const firstNew=placeList.querySelectorAll('[data-explorer-place]')[previousCount];
    (firstNew || root.querySelector('#atlas-results-title')).focus();
  });
  function backToResults(focusSearch=false) {
    const code=selected?.code,wasGroup=!groupPanel.hidden; choose('',false,true);
    if(code||wasGroup)move(browseTransform,true);
    const previous=[...placeList.querySelectorAll('button')].find(button=>button.dataset.explorerPlace===code);
    (focusSearch?search:previous || search).focus({preventScroll:true});
  }
  back.addEventListener('click',()=>backToResults());
  root.addEventListener('keydown',event=>{
    // Expanded mode owns Escape in its capture listener. Native form controls
    // keep Escape for closing their popup or cancelling an edit.
    if(event.key!=='Escape' || event.defaultPrevented || root.classList.contains('is-expanded'))return;
    if(event.target.closest('input,select,textarea,[contenteditable]'))return;
    const panel=event.target.closest('[data-atlas-group],[data-atlas-card]');
    if(!panel || panel.hidden)return;
    event.preventDefault();event.stopPropagation();backToResults(true);
  });
  qiblaSwitch.addEventListener('change', selectedMarker);
  roomSelect.addEventListener('change',()=>{
    if(kind==='airports')writeHistory(writeAirportRoom(Number(roomSelect.value),location.search));
    if(selected)root.querySelector('[data-atlas-link]').href=withBrowseContext(selected.url,location.search);
    showRoom(roomSelect.value);
  });
  root.querySelector('[data-airport-show-all]')?.addEventListener('click',()=>{viewport.checked=false;listSignature='';renderBrowser();fitButton.click();});
  fitButton.addEventListener('click',()=>move(fitCameraPoints(points.filter(point=>shown.has(point.code))),true));
  localButton.addEventListener('click',()=>{
    if(!selected)return;
    if(!localFrame.hidden){closeLocal();return;}
    const iframe=document.createElement('iframe');iframe.src=selected.links.embed;
    iframe.title=`${copy.local}: ${selected.fullName}`;iframe.loading='lazy';
    iframe.referrerPolicy='strict-origin-when-cross-origin';
    const fallback=document.createElement('a'); fallback.className='atlas-street-fallback';
    fallback.href=selected.links.osm;fallback.target='_blank';fallback.rel='noopener noreferrer';fallback.textContent=`${copy.osm} ↗`;
    localFrame.replaceChildren(iframe,fallback);localFrame.hidden=false;
    root.dataset.street='true';
    root.querySelector('[data-explorer-world]').hidden=false;
    localButton.textContent=copy.hideMap;localButton.setAttribute('aria-expanded','true');
  });
  root.querySelector('[data-explorer-world]').addEventListener('click',()=>{
    closeLocal();
    if(selected)focusAirport(selected);
  });
  clusters.addEventListener('keydown',event=>{
    if(!['Enter',' '].includes(event.key))return;
    const cluster=event.target.closest('[data-atlas-cluster]');if(!cluster)return;
    event.preventDefault();event.stopPropagation();showGroup(cluster.dataset.atlasCluster);
  });
  root.querySelector('[data-atlas-clear]').addEventListener('click', () => { choose('', false, true); search.focus({preventScroll:true}); });
  root.querySelector('[data-atlas-reveal]').addEventListener('click', () => {
    if (selected && shown.has(selected.code)) document.dispatchEvent(new CustomEvent('directory:reveal', { detail: { code: selected.code } }));
  });
  root.querySelectorAll('[data-map-zoom]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.mapZoom === 'reset') returnToWorld();
    else zoom(button.dataset.mapZoom === 'in' ? 1.3 : 1 / 1.3);
  }));
  svg.addEventListener('click', event => {
    if (suppressClick) { event.preventDefault(); suppressClick = false; return; }
    if(event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)return;
    const cluster=event.target.closest('[data-atlas-cluster]');
    const dot=event.target.closest('[data-map-airport]');
    // Keyboard activation keeps the focused target. Pointer activation chooses
    // the nearest drawn symbol when neighboring 44px hit areas overlap.
    const target=event.detail===0
      ? cluster ? {group:cluster.dataset.atlasCluster} : dot ? {code:dot.dataset.mapAirport} : null
      : nearestMapTarget([
        ...dots.filter(node=>!node.hasAttribute('hidden')).map(node=>byCode.get(node.dataset.mapAirport)),
        ...[...clusterGroups.values()].map(group=>({x:group.x,y:group.y,group:group.key})),
      ],svgPoint(event),transform,Math.abs(svg.getScreenCTM()?.a)||1);
    if(!target)return;
    event.preventDefault();
    if(target.group){showGroup(target.group);return;}
    // A marker was already visible under the pointer. Selecting its facts
    // should not move that marker away or discard a deliberately close view.
    choose(target.code, false, true);
    focusDetails();
  });
  svg.addEventListener('dblclick', event => {
    if (event.target.closest('[data-map-airport],[data-atlas-cluster]')) return;
    event.preventDefault();
    move(zoomMapAt(transform,1.3,svgPoint(event),width,height),false);
  });
  svg.addEventListener('wheel', event => {
    // Ordinary scrolling always continues down the page.
    if (!event.ctrlKey) return;
    event.preventDefault();
    move(wheelMapTransform(transform,event.deltaY,event.deltaMode,svgPoint(event),width,height),false);
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
      if (event.key === '0' || event.key === 'Home') returnToWorld(false);
      else zoom(event.key === '+' || event.key === '=' ? 1.3 : 1 / 1.3);
    } else if (event.key === 'Escape') { event.preventDefault();choose('', false, true);svg.focus({preventScroll:true}); }
  });
  svg.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    // A direct gesture owns the camera immediately; a queued animation must
    // not move the world after this gesture has captured its starting point.
    const groupingScale=motionClusterScale;
    stopMotion();
    // Keep the pressed cluster mounted until pointerup/click has completed.
    motionClusterScale=groupingScale;
    schedule();
    suppressClick = false;
    drag = { id: event.pointerId, start: svgPoint(event), clientX:event.clientX, clientY:event.clientY, origin: { ...transform }, moved: false };
  });
  svg.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const point = svgPoint(event);
    const dx = point.x - drag.start.x, dy = point.y - drag.start.y;
    // A click allowance is measured in screen pixels, not responsive SVG units.
    if (!drag.moved && Math.hypot(event.clientX-drag.clientX,event.clientY-drag.clientY) < 5) return;
    if (!drag.moved) {
      drag.moved = true;
      svg.setPointerCapture(event.pointerId);
      svg.classList.add('is-dragging');
    }
    move({ ...drag.origin, x: drag.origin.x + dx, y: drag.origin.y + dy });
  });
  const endDrag = event => {
    if (!drag || event.pointerId !== drag.id) return;
    suppressClick = drag.moved && event.type==='pointerup';
    drag = null;
    motionClusterScale=null;
    schedule();
    svg.classList.remove('is-dragging');
    if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
  };
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);
  svg.addEventListener('lostpointercapture', endDrag);
  svg.addEventListener('pointerleave', event => { if (drag && !drag.moved) endDrag(event); });
  new ResizeObserver(() => { if (!frame) frame = requestAnimationFrame(render); }).observe(svg);
  render();
}
