import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as reading from '../src/lib/reading-preference.js';
import * as theme from '../src/lib/theme-preference.js';
import { READING_COPY } from '../src/data/reading-copy.js';

const appearance = fs.readFileSync(new URL('../src/scripts/appearance.js', import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
function fixture({locale='en', stored='standard', blocked=false}={}) {
 const items=new Map([[reading.READING_KEY,stored]]), attrs=new Map(), listeners={}, classes=new Set();
 const storage={ getItem:key=>items.get(key),setItem(key,value){if(blocked)throw Error('blocked');items.set(key,value);},removeItem(key){if(blocked)throw Error('blocked');items.delete(key);} };
 const select={value:'standard',addEventListener:(type,fn)=>listeners[type]=fn};
 const status={textContent:'',classList:{toggle(name,enabled){if(enabled)classes.add(name);else classes.delete(name);}}};
 const control={dataset:{readingSaved:READING_COPY[locale].saved,readingUnsaved:READING_COPY[locale].unsaved},querySelector:s=>s==='[data-reading-switch]'?select:s==='[data-appearance-status]'?status:null};
 const root={setAttribute:(key,val)=>attrs.set(key,val),removeAttribute:key=>attrs.delete(key)};
 const events={};
 vm.runInNewContext(appearance,{...reading,...theme,document:{documentElement:root,querySelectorAll:s=>s==='[data-appearance-controls]'?[control]:[],querySelector:()=>null},window:{localStorage:storage,matchMedia:()=>({matches:false,addEventListener(){}}),dispatchEvent(){},addEventListener:(type,fn)=>events[type]=fn},getComputedStyle:()=>({getPropertyValue:()=>''}),CustomEvent:class{},URL});
 return {items,attrs,select,status,classes,change(value){select.value=value;listeners.change({currentTarget:select});},external(value){value===null?items.clear():items.set(reading.READING_KEY,value);events.storage({key:value===null?null:reading.READING_KEY});}};
}

test('reading preferences reject unknown values and remain usable with unavailable storage',()=>{
 for(const value of [null,undefined,'','large-ish','<script>'])assert.equal(reading.normalizeReading(value),'standard');
 assert.equal(reading.readReading(undefined),'standard');
 assert.equal(reading.saveReading(undefined,'large'),false);
 const blocked={getItem(){throw Error('blocked');}};
 assert.equal(reading.readReading(blocked),'standard');
});

test('menu reading control restores, saves, resets and synchronizes across tabs in every language',()=>{
 for(const locale of ['en','fr','ar','es']){
  const page=fixture({locale,stored:'large'});
  assert.equal(page.attrs.get('data-reading'),'large');assert.equal(page.select.value,'large');
  page.change('standard');assert.equal(page.attrs.has('data-reading'),false);assert.equal(page.items.has(reading.READING_KEY),false);
  page.change('large');assert.equal(page.items.get(reading.READING_KEY),'large');assert.equal(page.status.textContent,READING_COPY[locale].saved);assert.ok(page.classes.has('sr'));
  page.external('invalid');assert.equal(page.select.value,'standard');assert.equal(page.attrs.has('data-reading'),false);
  page.external('large');assert.equal(page.attrs.get('data-reading'),'large');
  page.external(null);assert.equal(page.select.value,'standard');assert.equal(page.attrs.has('data-reading'),false);
 }
});

test('blocked persistence changes this page and reports the limitation in the selected language',()=>{
 for(const locale of ['en','fr','ar','es']){
  const page=fixture({locale,blocked:true});page.change('large');
  assert.equal(page.attrs.get('data-reading'),'large');assert.equal(page.status.textContent,READING_COPY[locale].unsaved);
  assert.ok(page.classes.has('is-warning'));assert.equal(page.classes.has('sr'),false);
  page.change('standard');assert.equal(page.attrs.has('data-reading'),false);
 }
});
