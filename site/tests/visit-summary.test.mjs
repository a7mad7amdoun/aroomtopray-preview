import test from 'node:test';
import assert from 'node:assert/strict';
import { sharedRoomValue, visitSummary } from '../src/lib/visit-summary.js';
import { getCopy } from '../src/lib/i18n.js';
import { VISIT_SUMMARY_COPY } from '../src/data/visit-summary-copy.js';

test('shared hours never promote one room, ignore missing data, or remove qualifications',()=>{
 assert.deepEqual(sharedRoomValue([],'hours'),{state:'unknown'});
 assert.deepEqual(sharedRoomValue([{hours:'Unknown'},{hours:'Not stated'},{}],'hours'),{state:'unknown'});
 assert.deepEqual(sharedRoomValue([{hours:'24 hours'},{}],'hours'),{state:'varies'});
 assert.deepEqual(sharedRoomValue([{hours:'24 hours'},{hours:'Weekdays only'}],'hours'),{state:'varies'});
 assert.deepEqual(sharedRoomValue([{hours:'By request; ask reception'},{hours:'By request; ask reception'}],'hours'),{state:'known',value:'By request; ask reception'});
});

test('airport security and additional conditions stay distinct from opening hours',()=>{
 const fields=visitSummary({spaces:[{side:'airside',hours:'24 hours',access:'Boarding pass required'}]},'airports');
 assert.deepEqual(fields.map(f=>[f.key,f.value]),[['side','After security'],['hours','24 hours'],['access','Boarding pass required']]);
 assert.equal(fields[2].lang,'en');assert.equal(fields[2].dir,'ltr');
 assert.equal(visitSummary({spaces:[{side:'both'}]},'airports').length,2);
});

test('mixed security and partially documented conditions explicitly require room-by-room reading',()=>{
 const fields=visitSummary({spaces:[{side:'airside',hours:'24 hours',access:'Staff only'},{side:'landside',hours:'24 hours'}]},'airports');
 assert.equal(fields[0].value,VISIT_SUMMARY_COPY.en.varies);
 assert.equal(fields[1].value,'24 hours');
 assert.equal(fields[2].value,VISIT_SUMMARY_COPY.en.varies);
});

test('campus and hospital source prose retains restrictions and language in all translations',()=>{
 for(const locale of ['en','fr','ar','es'])for(const kind of ['universities','hospitals']){
  const fields=visitSummary({spaces:[{access:'Staff only; ID card required',hours:'Not stated'}]},kind,locale);
  assert.equal(fields[0].label,getCopy(locale).common.access);
  assert.equal(fields[0].value,'Staff only; ID card required');assert.equal(fields[0].lang,'en');assert.equal(fields[0].dir,'ltr');
  assert.equal(fields[1].value,getCopy(locale).common.notStated);assert.equal(fields[1].lang,undefined);
 }
});

test('unchecked and held places never gain confirmed practical claims from a summary',()=>{
 for(const locale of ['en','fr','ar','es'])for(const state of [{status:'pending'},{hold:true}]){
  const fields=visitSummary({...state,spaces:[{side:'both',access:'Visitors welcome',hours:'24 hours'}]},'airports',locale);
  assert.ok(fields.every(f=>f.value===getCopy(locale).common.checking));
 }
});

test('localized labels and variations are complete; unknown security is never presented as public access',()=>{
 for(const locale of ['en','fr','ar','es']){
  const fields=visitSummary({spaces:[{side:'invented',hours:'24 hours'},{side:'invented',hours:'Weekdays only'}]},'airports',locale);
  assert.equal(fields[0].value,getCopy(locale).common.notStated);
  assert.equal(fields[1].value,VISIT_SUMMARY_COPY[locale].varies);
 }
});
