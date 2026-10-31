import test from 'node:test';
import assert from 'node:assert/strict';
import { readDirectoryState, writeDirectoryState, matchesDirectory } from '../src/lib/directory-state.js';
const regions=['All','Europe','Americas'], filters=['room','ask','airside','wudu','women'];
test('directory URL survives reload with accents, spaces and multiple filters',()=>{
 const s={q:'São Paulo',region:'Americas',f:new Set(['wudu','women'])};
 assert.deepEqual(readDirectoryState(writeDirectoryState(s),regions,filters),s);
 assert.equal(new URLSearchParams(writeDirectoryState(s,'campaign=family')).get('campaign'),'family');
});
test('unknown URL filters and regions cannot alter directory behavior',()=>{
 const s=readDirectoryState('?region=Anywhere&f=wudu,constructor,wudu,junk',regions,filters);
 assert.equal(s.region,'All');assert.deepEqual([...s.f],['wudu']);
 assert.equal(readDirectoryState('?q='+ 'a'.repeat(200),regions,filters).q.length,160);
});
test('amenities from different rooms cannot satisfy a combined search',()=>{
 const p={region:'Europe',text:'LHR London Heathrow',status:'room',rooms:[{airside:true,wudu:false},{airside:false,wudu:true}]};
 const s={q:'',region:'All',f:new Set(['airside','wudu'])};
 assert.equal(matchesDirectory(p,s),false);
 assert.equal(matchesDirectory({...p,rooms:[...p.rooms,{airside:true,wudu:true}]},s),true);
});
test('multiword accent-insensitive search and status distinctions stay meaningful',()=>{
 const p={region:'Americas',text:'GRU São Paulo Brazil',status:'pending',rooms:[]};
 assert.equal(matchesDirectory(p,{q:'sao brazil',region:'All',f:new Set()}),true);
 assert.equal(matchesDirectory(p,{q:'',region:'All',f:new Set(['ask'])}),false);
 assert.equal(matchesDirectory({...p,status:'planned'},{q:'',region:'All',f:new Set(['ask'])}),true);
});
