import test from 'node:test';
import assert from 'node:assert/strict';
import {readCountryExplorerState,writeCountryExplorerState,matchesCountryEntry} from '../src/lib/country-explorer-state.js';
import {initCountryExplorer} from '../src/scripts/country-explorer.js';

test('country state round-trips without overwriting the main place search or filters',()=>{
 const state={query:'المغرب & Maroc',scope:'all'};
 const query=writeCountryExplorerState(state,'q=Heathrow&country=GB&f=women&mode=map');
 assert.deepEqual(readCountryExplorerState(query),state);
 const params=new URLSearchParams(query);
 assert.equal(params.get('q'),'Heathrow');assert.equal(params.get('country'),'GB');
 assert.equal(params.get('f'),'women');assert.equal(params.get('mode'),'map');
 const cleared=writeCountryExplorerState({query:'',scope:'covered'},query);
 assert.equal(cleared,'q=Heathrow&country=GB&f=women&mode=map');
});

test('malformed country state defaults to real coverage and bounds search input',()=>{
 assert.deepEqual(readCountryExplorerState('?countriesScope=unknown'),{query:'',scope:'covered'});
 assert.equal(readCountryExplorerState('?countriesQ='+'x'.repeat(500)).query.length,160);
 assert.equal(new URLSearchParams(writeCountryExplorerState({query:' x '.repeat(200),scope:'all'})).get('countriesQ').length,160);
 assert.equal(writeCountryExplorerState({query:'  ',scope:'unknown'}),'');
});

test('uncovered territories appear only when requested and Arabic matching tolerates marks',()=>{
 const covered={covered:true,text:'MA Morocco Maroc المغرب Marruecos'};
 const uncovered={covered:false,text:'AQ Antarctica Antarctique القارة القطبية الجنوبية Antártida'};
 assert.equal(matchesCountryEntry(covered,{query:'المَغْرِب',scope:'covered'}),true);
 assert.equal(matchesCountryEntry(uncovered,{query:'Antartida',scope:'covered'}),false);
 assert.equal(matchesCountryEntry(uncovered,{query:'Antartida',scope:'all'}),true);
 assert.equal(matchesCountryEntry(covered,{query:'Morocco Antarctica',scope:'all'}),false);
});

function fixture({locale='en',url='http://localhost/?q=airport#countries',blocked=false,extraRows=0}={}) {
 let location=new URL(url),focused=false;
 const element=()=>({value:'',hidden:true,textContent:'',dataset:{},events:{},addEventListener(name,fn){this.events[name]=fn;},focus(){focused=true;}});
 const search=element(),scope=element(),clear=element(),status=element(),empty=element(),control=element();
 const rows=[{...element(),dataset:{countryCovered:'true',countryText:'MA Morocco Maroc المغرب Marruecos'}},{...element(),dataset:{countryCovered:'true',countryText:'FR France فرنسا Francia'}},{...element(),dataset:{countryCovered:'false',countryText:'AQ Antarctica القارة القطبية الجنوبية Antártida'}}];
 for(let i=0;i<extraRows;i++)rows.push({...element(),dataset:{countryCovered:'true',countryText:`Example ${i}`},querySelector:()=>null});
 const more=element();
 const template={en:'{count} of {total} countries and territories',fr:'{count} sur {total} pays et territoires',ar:'عرض {count} من {total} بلدًا وإقليمًا',es:'{count} de {total} países y territorios'}[locale];
 const nodes={'[data-country-search]':search,'[data-country-scope]':scope,'[data-country-clear]':clear,'[data-country-status]':status,'[data-country-empty]':empty,'[data-country-scope-control]':control};
 nodes['[data-country-more]']=more;
 const root={dataset:{locale,resultTemplate:template},querySelector:key=>nodes[key],querySelectorAll:()=>rows};
 const writes=[],events={};
 const browser={get location(){return location;},history:{state:{retained:true}},addEventListener(name,fn){events[name]=fn;}};
 for(const method of ['pushState','replaceState'])browser.history[method]=(state,title,next)=>{if(blocked)throw new Error('History unavailable');assert.deepEqual(state,{retained:true});location=new URL(next,location);writes.push({method,url:location.href});};
 initCountryExplorer(root,browser);
 return {search,scope,clear,status,empty,control,more,rows,writes,browser,get focused(){return focused;},restore(url,event='popstate'){location=new URL(url);events[event]();}};
}

test('country browsing reveals manageable batches while search reaches every country',()=>{
 const f=fixture({extraRows:25});
 const visible=()=>f.rows.filter(row=>!row.hidden).length;
 assert.equal(visible(),12);assert.equal(f.more.hidden,false);
 f.more.events.click();assert.equal(visible(),24);
 f.more.events.click();assert.equal(visible(),27);assert.equal(f.more.hidden,true);
 f.search.value='Example 24';f.search.events.input();
 assert.equal(visible(),1);assert.equal(f.rows.at(-1).hidden,false);
 f.clear.events.click();assert.equal(visible(),12);assert.equal(f.more.hidden,false);
 assert.equal(f.browser.location.search,'?q=airport');
});

test('reload, scope changes and back navigation restore the visible country results in all locales',()=>{
 for(const locale of ['en','fr','ar','es']){
  const f=fixture({locale,url:'http://localhost/?countriesScope=all&countriesQ=Antartida#countries'});
  assert.deepEqual(f.rows.map(row=>row.hidden),[true,true,false]);assert.equal(f.scope.value,'all');
  assert.equal(f.control.hidden,false);assert.equal(f.clear.hidden,false);
  assert.equal(f.status.textContent.includes(new Intl.NumberFormat(locale).format(3)),true);
  f.scope.value='covered';f.scope.events.change();assert.equal(f.empty.hidden,false);
  assert.equal(f.writes.at(-1).method,'pushState');
  f.restore('http://localhost/?countriesScope=all&countriesQ=Antartida#countries');
  assert.equal(f.rows[2].hidden,false);assert.equal(f.empty.hidden,true);
  f.restore('http://localhost/?countriesQ=Maroc#countries','pageshow');
  assert.equal(f.rows[0].hidden,false);assert.equal(f.scope.value,'covered');assert.equal(f.focused,false);
 }
});

test('typing avoids history spam and reset preserves the main query, hash and input focus',()=>{
 const f=fixture();f.search.value='Morocco';f.search.events.input();
 assert.equal(f.writes.at(-1).method,'replaceState');
 assert.equal(f.browser.location.searchParams.get('countriesQ'),'Morocco');
 f.scope.value='all';f.scope.events.change();f.clear.events.click();
 assert.equal(f.browser.location.search,'?q=airport');assert.equal(f.browser.location.hash,'#countries');
 assert.equal(f.clear.hidden,true);assert.equal(f.focused,true);assert.equal(f.rows[2].hidden,true);
});

test('filtering and reset still work if browser history writes are denied',()=>{
 const f=fixture({blocked:true});f.search.value='nowhere';f.search.events.input();
 assert.equal(f.empty.hidden,false);f.clear.events.click();
 assert.equal(f.rows[0].hidden,false);assert.equal(f.empty.hidden,true);assert.equal(f.focused,true);
});
