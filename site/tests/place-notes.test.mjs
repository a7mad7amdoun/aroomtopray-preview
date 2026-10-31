import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
register('./json-hook.mjs', import.meta.url);
const { placeNotes } = await import('../src/lib/place-notes.js');
const { byCode } = await import('../src/lib/airports.js');
const { bySlug: universities } = await import('../src/lib/universities.js');
const { hospitals: hospitalList } = await import('../src/lib/hospitals.js');
const hospitals = Object.fromEntries(hospitalList.map(h => [h.slug, h]));
test('Houston export keeps all room-specific facilities and source dates',()=>{
 const p=placeNotes(byCode.iah,'Airport');
 assert.equal(p.rooms.length,3);assert.equal(p.rooms[0].location,'Terminal D, near Gate D15');
 assert.equal(p.rooms[0].women,'Partition');assert.equal(p.rooms[1].women,'Not stated');
 assert.equal(p.rooms[0].checked,'2026-10-13');assert.equal(p.rooms[0].provenance,'Official airport page');
});
test('unchecked airports and held hospitals stay visibly unconfirmed',()=>{
 const pending=placeNotes(byCode.aga,'Airport');assert.equal(pending.status,'Not checked yet');assert.equal(pending.wudu,'Not checked yet');assert.ok(pending.warnings.length);
 const held=placeNotes(hospitals['heartlands-hospital'],'Hospital');assert.equal(held.status,'Still checking');assert.ok(held.warnings.some(w=>w.includes('Still checking')));
});
test('conflicting university directions and hospital relocation cautions survive export',()=>{
 const campus=placeNotes(universities.ucla,'University');assert.ok(campus.warnings.some(w=>w.includes('Published details differ')));
 assert.ok(campus.rooms.some(r=>r.extra.includes('unconfirmed')));
 const hospital=placeNotes(hospitals['royal-london-hospital'],'Hospital');assert.ok(hospital.rooms[0].extra.includes('current location is unconfirmed'));
});
