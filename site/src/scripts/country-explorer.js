import { readCountryExplorerState, writeCountryExplorerState, matchesCountryEntry } from '../lib/country-explorer-state.js';

export function initCountryExplorer(root, browser=window) {
 if(!root)return;
 const search=root.querySelector('[data-country-search]'),scope=root.querySelector('[data-country-scope]');
 const clear=root.querySelector('[data-country-clear]'),status=root.querySelector('[data-country-status]'),empty=root.querySelector('[data-country-empty]');
 const number=new Intl.NumberFormat(root.dataset.locale||'en');
 const rows=[...root.querySelectorAll('[data-country-card]')];
 const more=root.querySelector('[data-country-more]');
 let limit=12;
 root.querySelector('[data-country-scope-control]').hidden=false;
 const state=()=>({query:search.value.slice(0,160),scope:scope.value});
 function render(){
  const current=state();let count=0,total=0,matched=0;
  for(const row of rows){
   const entry={covered:row.dataset.countryCovered==='true',text:row.dataset.countryText};
   if(current.scope==='all'||entry.covered)total++;
   const matches=matchesCountryEntry(entry,current);
   if(matches)matched++;
   row.hidden=!matches||(Boolean(more)&&matched>limit);
   if(!row.hidden)count++;
  }
  status.textContent=root.dataset.resultTemplate.replace('{count}',number.format(count)).replace('{total}',number.format(total));
  empty.hidden=count>0;clear.hidden=!current.query&&current.scope==='covered';
  if(more)more.hidden=matched<=limit;
 }
 function save(push=false){
  const query=writeCountryExplorerState(state(),browser.location.search);
  const next=browser.location.pathname+(query?'?'+query:'')+browser.location.hash;
  const current=browser.location.pathname+browser.location.search+browser.location.hash;
  if(next!==current){
   // Search remains usable when the browser refuses a history write.
   try{browser.history[push?'pushState':'replaceState'](browser.history.state,'',next);}catch{}
  }
 }
 function restore(){
  const saved=readCountryExplorerState(browser.location.search);
  search.value=saved.query;scope.value=saved.scope;limit=12;render();
 }
 search.addEventListener('input',()=>{limit=12;render();save();});
 scope.addEventListener('change',()=>{limit=12;render();save(true);});
 clear.addEventListener('click',()=>{search.value='';scope.value='covered';limit=12;render();save(true);search.focus();});
 more?.addEventListener('click',()=>{const previouslyVisible=new Set(rows.filter(row=>!row.hidden));limit+=12;render();rows.find(row=>!row.hidden&&!previouslyVisible.has(row))?.querySelector('a')?.focus({preventScroll:true});});
 browser.addEventListener('popstate',restore);
 browser.addEventListener('pageshow',restore);
 restore();
}

if(typeof document!=='undefined')document.querySelectorAll('[data-country-explorer]').forEach(root=>initCountryExplorer(root));
