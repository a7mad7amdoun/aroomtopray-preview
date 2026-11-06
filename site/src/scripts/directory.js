import { readDirectoryState, writeDirectoryState, matchesDirectory } from '../lib/directory-state.js';
import {tabIndexForKey} from '../lib/guide-navigation.js';
import { readCountry, writeCountry, countryCode } from '../lib/countries.js';
import { copyText } from '../lib/clipboard.js';
import { readPresentation, writePresentation, sortPlaces, readDirectoryMode } from '../lib/directory-presentation.js';
import { withBrowseContext } from '../lib/directory-context.js';
import { PAGE_SIZE, readPage, pageWindow, writePage } from '../lib/directory-pagination.js';
const controls=document.querySelector('[data-directory]');
if(controls){
 const input=controls.querySelector('input[type=search]'), regionButtons=[...controls.querySelectorAll('[data-r]')],filterButtons=[...controls.querySelectorAll('[data-f]')];
 const regions=regionButtons.map(b=>b.dataset.r),filters=filterButtons.map(b=>b.dataset.f);
 const data=[...document.querySelectorAll('#list a.lrow')].map((el,order)=>({el,order,url:el.getAttribute('href'),name:el.dataset.name,location:el.dataset.location,region:el.dataset.region,country:el.dataset.country,status:el.dataset.status,rooms:JSON.parse(el.dataset.rooms),text:el.dataset.text,halal:el.dataset.halal==='1',code:el.getAttribute('href').split('/').filter(Boolean).at(-1)}));
 let state=readDirectoryState(location.search,regions,filters),presentation=readPresentation(location.search),page=readPage(location.search),appliedSort,matching=[];
 const mapPanel=document.querySelector('[data-directory-map]'),listPanel=document.querySelector('[data-directory-list-panel]');
 const countrySelect=controls.querySelector('[data-directory-country]'),countries=[...countrySelect.options].map(option=>option.value);
 const readCountryFilter=()=>{const explicit=readCountry(location.search,countries),legacy=countryCode(state.region);if(controls.dataset.directory!=='airports')state.region='All';return explicit||(controls.dataset.directory!=='airports'&&countries.includes(legacy)?legacy:'');};
 let country=readCountryFilter();
 const guidePanel=document.querySelector('[data-directory-guidance-panel]');
 const getMode=()=>readDirectoryMode(location.search,Boolean(mapPanel));
 let mode=getMode();
 const list=document.getElementById('list'),empty=document.getElementById('empty'),sortSelect=document.querySelector('[data-directory-sort]'),viewButtons=[...document.querySelectorAll('[data-directory-view]')];
 const browseTools=document.querySelector('[data-browse-tools]'),clearButton=controls.querySelector('#clear'),linkButton=controls.querySelector('[data-filter-link]'),status=controls.querySelector('[data-filter-status]');
 const pager=document.querySelector('[data-directory-pagination]'),previous=pager.querySelector('[data-page-previous]'),next=pager.querySelector('[data-page-next]'),pageStatus=pager.querySelector('[data-page-status]');
 const modeButtons=[...document.querySelectorAll('[data-directory-mode]')];
 const activeFilters=controls.querySelector('[data-active-filters]');
 const visibleSearch=()=>mode==='map'?(mapPanel?.querySelector('#atlas-search')||input):input;
 const rowAnimations=new WeakMap();
 function renderActiveFilters(){
  const items=[];
  if(country)items.push({kind:'country',value:country,label:countrySelect.selectedOptions[0].textContent});
  if(state.region!=='All')items.push({kind:'region',value:state.region,label:regionButtons.find(button=>button.dataset.r===state.region)?.textContent||state.region});
  filterButtons.filter(button=>state.f.has(button.dataset.f)).forEach(button=>items.push({kind:'facility',value:button.dataset.f,label:button.textContent}));
  activeFilters.replaceChildren();activeFilters.hidden=items.length===0;
  items.forEach(item=>{
   const li=document.createElement('li'),button=document.createElement('button'),label=document.createElement('span');
   button.type='button';button.dataset.filterKind=item.kind;button.dataset.filterValue=item.value;
   button.setAttribute('aria-label',`${activeFilters.dataset.removeLabel}: ${item.label}`);label.textContent=item.label;
   const icon=document.createElementNS('http://www.w3.org/2000/svg','svg'),use=document.createElementNS('http://www.w3.org/2000/svg','use');
   icon.setAttribute('width','15');icon.setAttribute('height','15');icon.setAttribute('aria-hidden','true');use.setAttribute('href','#i-close');icon.append(use);
   button.append(label,icon);li.append(button);activeFilters.append(li);
  });
 }
 document.querySelector('[data-directory-mode-controls]').hidden=false;linkButton.hidden=false;
 const number=new Intl.NumberFormat(controls.dataset.locale||'en');
 function apply(historyMode){
  matching=sortPlaces(data.filter(item=>matchesDirectory(item,state)&&(!country||item.country===country)),presentation.sort);
  const pageResult=pageWindow(matching,page);page=pageResult.page;const visible=new Set(pageResult.items);
  const arriving=pageResult.items.filter(item=>item.el.hidden);
  data.forEach(item=>item.el.hidden=!visible.has(item));
  if(historyMode&&mode==='list'&&!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches){
   arriving.forEach((item,index)=>{
    rowAnimations.get(item.el)?.cancel();
    const animation=item.el.animate?.([{opacity:.65,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,delay:index*22,easing:'cubic-bezier(.2,.7,.2,1)'});
    if(animation)rowAnimations.set(item.el,animation);
   });
  }
  controls.dataset.matchingCodes=JSON.stringify(matching.map(item=>item.code));
  controls.querySelector('#count').textContent=`${number.format(matching.length)} / ${number.format(data.length)} ${controls.dataset.directoryLabel||controls.dataset.directory}`;
  empty.hidden=matching.length>0;clearButton.hidden=!(state.q||state.region!=='All'||state.f.size||country);input.value=state.q;countrySelect.value=country;
  regionButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.r===state.region)));filterButtons.forEach(b=>b.setAttribute('aria-pressed',String(state.f.has(b.dataset.f))));
  list.dataset.view=presentation.view;viewButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.directoryView===presentation.view)));sortSelect.value=presentation.sort;
  if(appliedSort!==presentation.sort){sortPlaces(data,presentation.sort).forEach(item=>list.insertBefore(item.el,empty));appliedSort=presentation.sort;}
  if(mapPanel)mapPanel.hidden=mode!=='map';listPanel.hidden=mode!=='list';guidePanel.hidden=mode!=='guide';browseTools.hidden=mode!=='list';document.querySelector('.results-toolbar').hidden=mode!=='list';
  // The header shortcut always reaches the search field that is visible.
  document.querySelector('.header-search')?.setAttribute('href',mode==='map'?'#atlas-search':'#q-dir');
  modeButtons.forEach(b=>{const selected=b.dataset.directoryMode===mode;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});
  [mapPanel,listPanel,guidePanel].filter(Boolean).forEach(panel=>{panel.setAttribute('role','tabpanel');panel.tabIndex=0;});
  pager.hidden=matching.length===0;previous.disabled=page===1;next.disabled=page===pageResult.totalPages;
  pageStatus.textContent=`${pageStatus.dataset.label} ${number.format(page)} ${pageStatus.dataset.of} ${number.format(pageResult.totalPages)}`;
  if(historyMode){const params=new URLSearchParams(writeCountry(country,writePage(page,writePresentation(presentation,writeDirectoryState(state,location.search)))));params.delete('mode');params.set('mode',mode);const query=params.toString();const url=location.pathname+(query?'?'+query:'')+location.hash;if(url!==location.pathname+location.search+location.hash)history[historyMode]({},'',url);}
  data.forEach(item=>item.el.href=withBrowseContext(item.url,location.search));
  const filterCount=state.f.size+Number(state.region!=='All');
  const filterBadge=controls.querySelector('[data-filter-count]');filterBadge.hidden=!filterCount;filterBadge.textContent=number.format(filterCount);
  renderActiveFilters();
  document.dispatchEvent(new CustomEvent('directory:updated',{detail:{codes:matching.map(item=>item.code),query:state.q}}));
  status.textContent='';controls.querySelector('[data-copy-fallback]')?.remove();
 }
 input.addEventListener('input',()=>{state.q=input.value;page=1;apply('replaceState');});
 regionButtons.forEach(b=>b.addEventListener('click',()=>{state.region=b.dataset.r;page=1;apply('pushState');}));
 filterButtons.forEach(b=>b.addEventListener('click',()=>{const f=b.dataset.f;state.f.has(f)?state.f.delete(f):state.f.add(f);if(state.f.has(f)&&f==='room')state.f.delete('ask');if(state.f.has(f)&&f==='ask')state.f.delete('room');page=1;apply('pushState');}));
 countrySelect.addEventListener('change',()=>{country=countrySelect.value;page=1;apply('pushState');});
 activeFilters.addEventListener('click',event=>{
  const button=event.target.closest('button[data-filter-kind]');if(!button)return;
  const buttons=[...activeFilters.querySelectorAll('button')],index=buttons.indexOf(button);
  if(button.dataset.filterKind==='country')country='';
  else if(button.dataset.filterKind==='region')state.region='All';
  else state.f.delete(button.dataset.filterValue);
  page=1;apply('pushState');
  const remaining=activeFilters.querySelectorAll('button');
  (remaining[Math.min(index,remaining.length-1)]||visibleSearch()).focus({preventScroll:true});
 });
 const clear=()=>{country='';state={q:'',region:'All',f:new Set()};page=1;apply('pushState');visibleSearch().focus();};clearButton.addEventListener('click',clear);document.querySelector('[data-clear]').addEventListener('click',clear);
 linkButton.addEventListener('click',()=>copyText(location.href,status,controls));sortSelect.addEventListener('change',()=>{presentation.sort=sortSelect.value;page=1;apply('pushState');});
 viewButtons.forEach(b=>b.addEventListener('click',()=>{presentation.view=b.dataset.directoryView;apply('pushState');}));
 modeButtons.forEach((b,i)=>{b.addEventListener('click',()=>{mode=b.dataset.directoryMode;apply('pushState');});b.addEventListener('keydown',event=>{const index=tabIndexForKey(event.key,i,modeButtons.length,document.documentElement.dir==='rtl');if(index!==null){event.preventDefault();modeButtons[index].focus();modeButtons[index].click();}});});
 document.addEventListener('directory:reveal',event=>{
  const index=matching.findIndex(item=>item.code===event.detail?.code);
  if(index<0)return;
  page=Math.floor(index/PAGE_SIZE)+1;mode='list';apply('pushState');
  matching[index].el.focus({preventScroll:true});matching[index].el.scrollIntoView({block:'nearest',behavior:'instant'});
 });
 document.addEventListener('atlas:selection',()=>data.forEach(item=>item.el.href=withBrowseContext(item.url,location.search)));
 const changePage=amount=>{
  page+=amount;apply('pushState');list.scrollTop=0;
  // Move back into the newly displayed results, including when Next becomes
  // disabled on the last page. The page-status live region announces the page.
  const target=pageWindow(matching,page).items[0]?.el||listPanel;
  target.focus({preventScroll:true});target.scrollIntoView({block:'nearest',behavior:'instant'});
 };previous.addEventListener('click',()=>changePage(-1));next.addEventListener('click',()=>changePage(1));
 window.addEventListener('popstate',()=>{state=readDirectoryState(location.search,regions,filters);presentation=readPresentation(location.search);page=readPage(location.search);country=readCountryFilter();mode=getMode();apply();});
 window.addEventListener('beforeprint',()=>{listPanel.hidden=false;if(mapPanel)mapPanel.hidden=true;const all=new Set(matching);data.forEach(item=>item.el.hidden=!all.has(item));});window.addEventListener('afterprint',()=>apply());
 if(state.region!=='All'||state.f.size)controls.querySelector('.directory-refine').open=true;
 apply();
}
