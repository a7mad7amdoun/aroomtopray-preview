import { fold } from '../lib/directory-state.js';
import { withBrowseContext } from '../lib/directory-context.js';
import { searchPlaces, searchIndexForKey } from '../lib/place-search.js';
const form=document.querySelector('[data-place-search]');
if(form){
 const input=form.querySelector('input'),panel=form.querySelector('.place-search-results'),list=form.querySelector('ul'),status=form.querySelector('[data-place-search-status]');
 const entries=JSON.parse(form.querySelector('[data-place-search-index]').textContent),copy=JSON.parse(form.querySelector('[data-place-search-copy]').textContent);
 input.setAttribute('role','combobox');input.setAttribute('aria-controls',list.id);input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-expanded','false');list.setAttribute('role','listbox');
 const number=new Intl.NumberFormat(document.documentElement.lang);
 input.value=(new URLSearchParams(location.search).get('q')||'').slice(0,160);
 const guideUrl=place=>withBrowseContext(place.url,new URLSearchParams({q:input.value,mode:'list'}).toString());
 let matches=[],active=-1,pointerInPanel=false;
 const close=()=>{panel.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;};
 function render(){
  matches=searchPlaces(entries,input.value);if(!input.value.trim()){list.replaceChildren();status.textContent='';close();return;}
  list.replaceChildren();
  matches.forEach((place,i)=>{const li=document.createElement('li');li.id=`place-result-${i}`;li.setAttribute('role','option');li.setAttribute('aria-selected',String(i===active));const link=document.createElement('a');link.href=guideUrl(place);link.tabIndex=-1;const title=document.createElement('b');title.textContent=place.name;const detail=document.createElement('span');detail.className='place-search-meta';if(place.flagUrl){const flag=document.createElement('img');flag.src=place.flagUrl;flag.className='country-flag';flag.alt='';flag.width=24;flag.height=18;flag.setAttribute('aria-hidden','true');detail.append(flag);}const location=document.createElement('span');location.textContent=`${place.city} · ${place.country} · ${place.kind}${place.photoLabel?' · '+place.photoLabel:''}`;detail.append(location);const arrow=document.createElement('span');arrow.textContent=place.code||'↗';arrow.className='place-search-code';link.append(title,detail,arrow);li.append(link);list.append(li);});
  status.textContent=matches.length?`${number.format(matches.length)} ${copy.suggestions}`:copy.empty;
  form.querySelectorAll('[data-search-directory]').forEach(a=>{const target=new URL(a.dataset.searchDirectory,location.origin);target.searchParams.set('q',input.value);target.searchParams.set('mode','list');a.href=target.pathname+target.search;});
  panel.hidden=false;input.setAttribute('aria-expanded','true');
  if(active>=0){input.setAttribute('aria-activedescendant',`place-result-${active}`);list.children[active]?.scrollIntoView({block:'nearest'});}else input.removeAttribute('aria-activedescendant');
 }
 input.addEventListener('input',()=>{active=-1;const params=new URLSearchParams(location.search);params.delete('q');if(input.value.trim())params.set('q',input.value.trim().slice(0,160));const query=params.toString();history.replaceState({},'',location.pathname+(query?'?'+query:'')+location.hash);render();});input.addEventListener('focus',render);
 input.addEventListener('keydown',e=>{
  if(e.isComposing)return;
  if(e.key==='Escape'){e.preventDefault();close();return;}
  const next=searchIndexForKey(e.key,active,matches.length);
  if(next!==null){e.preventDefault();active=next;render();}
 });
 form.addEventListener('submit',e=>{e.preventDefault();if(!input.value.trim()){close();input.focus();return;}render();const exact=matches.filter(p=>p.code&&fold(p.code)===fold(input.value));const place=active>=0?matches[active]:exact.length===1?exact[0]:matches.length===1?matches[0]:null;if(place)location.assign(guideUrl(place));else{input.focus();status.textContent=matches.length?copy.select:copy.empty;}});
 window.addEventListener('popstate',()=>{input.value=(new URLSearchParams(location.search).get('q')||'').slice(0,160);active=-1;if(document.activeElement===input)render();else close();});
 // Some touch browsers blur the input before dispatching a result's click.
 panel.addEventListener('pointerdown',()=>{pointerInPanel=true;});
 document.addEventListener('pointerup',()=>{pointerInPanel=false;});
 document.addEventListener('pointercancel',()=>{pointerInPanel=false;});
 form.addEventListener('focusout',e=>{if(!pointerInPanel&&!form.contains(e.relatedTarget))close();});
 document.addEventListener('click',e=>{if(!form.contains(e.target))close();});
 window.addEventListener('blur',()=>{pointerInPanel=false;close();});
}
