import { fold } from './directory-state.js';

// Separate keys prevent the country browser from replacing the place-search query.
export function readCountryExplorerState(search) {
 const params=new URLSearchParams(search);
 return {query:(params.get('countriesQ')||'').slice(0,160),scope:params.get('countriesScope')==='all'?'all':'covered'};
}
export function writeCountryExplorerState(state,search='') {
 const params=new URLSearchParams(search);
 params.delete('countriesQ');params.delete('countriesScope');
 const query=String(state.query||'').trim().slice(0,160);
 if(query)params.set('countriesQ',query);
 if(state.scope==='all')params.set('countriesScope','all');
 return params.toString();
}
export function matchesCountryEntry(entry,state) {
 return (state.scope==='all'||entry.covered)&&fold(state.query).split(/\s+/).filter(Boolean).every(token=>fold(entry.text).includes(token));
}
