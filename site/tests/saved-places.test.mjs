import test from 'node:test';
import assert from 'node:assert/strict';
import { SAVED_KEY, parseSaved, readSaved, writeSaved, toggleSaved, restoreSaved, formatPlaceNotes } from '../src/lib/saved-places.js';
test('saved data retains local path shapes, deduplicates, and rejects corrupt data',()=>{
 assert.deepEqual(parseSaved(JSON.stringify(['/airports/iah/','https://evil.example/','/airports/iah/','/universities/ucla/','/hospitals/st-thomas-hospital/','/api/report',null])),['/airports/iah/','/universities/ucla/','/hospitals/st-thomas-hospital/']);
 assert.throws(()=>parseSaved('{bad'));assert.throws(()=>parseSaved('{}'));assert.deepEqual(parseSaved(null),[]);
});
test('save, remove and undo preserve ordering without duplicate entries',()=>{
 let paths=toggleSaved(['/airports/lhr/'],'/airports/iah/');
 paths=toggleSaved(paths,'/airports/lhr/');assert.deepEqual(paths,['/airports/iah/']);
 paths=restoreSaved(paths,'/airports/lhr/',0);assert.deepEqual(paths,['/airports/lhr/','/airports/iah/']);
 assert.deepEqual(restoreSaved(paths,'/airports/lhr/',0),paths);
 const full=Array.from({length:24},(_,i)=>`/universities/place-${i}/`);
 assert.throws(()=>toggleSaved(full,'/airports/iah/'),/24/);assert.throws(()=>restoreSaved(full,'/airports/iah/',0),/24/);
});
test('storage is opt-in, reports write failures, and removal clears the key',()=>{
 const data=new Map();const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 assert.deepEqual(readSaved(storage),[]);assert.equal(data.size,0);
 writeSaved(storage,['/airports/iah/']);assert.deepEqual(JSON.parse(data.get(SAVED_KEY)),['/airports/iah/']);
 writeSaved(storage,[]);assert.equal(data.size,0);
 assert.throws(()=>writeSaved({setItem(){throw new Error('Blocked');}},['/airports/iah/']),/Blocked/);
});
test('exported notes carry caveats, source provenance, access and original dates',()=>{
 const note=formatPlaceNotes({name:'Example',kind:'University',city:'Town',country:'Country',status:'Still checking',qibla:45,path:'/universities/example/',warnings:['Times conflict; confirm before travelling.'],rooms:[{name:'Room A',location:'Building B',access:'Students only',hours:'Not stated',wudu:'Not stated',women:'Partition',extra:'Location may have changed.',source:'https://example.org/room',checked:'2026-10-13',provenance:'Official source, indirect copy'}]});
 for(const text of ['Still checking','Times conflict','Students only','Not stated','Location may have changed','https://example.org/room','2026-10-13','indirect copy','not a live compass']) assert.ok(note.includes(text),text);
});
