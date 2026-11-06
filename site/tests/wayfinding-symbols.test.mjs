import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SYMBOLS, SYMBOL_ALIASES, symbolName, symbolMarkup, BRAND_MARK } from '../src/data/wayfinding-symbols.js';
const src=new URL('../src/',import.meta.url);
const originalSpriteNames='arrow close grid filter airport globe list book key help save copy print pin gate clock water screen qibla search check campus care info door-closed door-open sun moon focus photo source security community'.split(' ');
const originalStandaloneNames='screen airport campus care room pin qibla help book water photo food search list globe check info save'.split(' ');
test('every public symbol from both original renderers is explicitly supported',()=>{
  for(const name of new Set([...originalSpriteNames,...originalStandaloneNames])) {
    assert.ok(Object.hasOwn(SYMBOLS,name),name);
    assert.equal(symbolName(name),name);
    assert.match(symbolMarkup(name),/<path /);
  }
});
test('all static sprite references in source resolve without fallback',()=>{
  let count=0;
  function walk(directory){for(const entry of readdirSync(directory,{withFileTypes:true})){
    const path=join(directory,entry.name);
    if(entry.isDirectory())walk(path);
    else if(/\.(astro|js|ts)$/.test(path)){
      const code=readFileSync(path,'utf8');
      for(const [,name] of code.matchAll(/(?:href=["']|href:\s*["'])#i-([a-z-]+)["']/g)){
        assert.ok(name==='mark'||Object.hasOwn(SYMBOLS,name),`${path}: i-${name}`); count++;
      }
    }
  }}
  walk(fileURLToPath(src));assert.ok(count>25,'source reference scan must inspect actual uses');
});
test('semantic aliases map to a real canonical glyph and unknown names retain room fallback',()=>{
  for(const [alias,name] of Object.entries(SYMBOL_ALIASES)){
    assert.ok(Object.hasOwn(SYMBOLS,name),alias);
    assert.equal(symbolMarkup(alias),symbolMarkup(name));
  }
  assert.equal(symbolMarkup('unrecognized'),symbolMarkup('room'));
});
test('both renderers share registry and preserve public dimensions and accessibility',()=>{
  const sprite=readFileSync(new URL('../src/components/Icons.astro',import.meta.url),'utf8');
  const standalone=readFileSync(new URL('../src/components/WayfindingSymbol.astro',import.meta.url),'utf8');
  for(const code of [sprite,standalone]){assert.match(code,/wayfinding-symbols\.js/);assert.match(code,/aria-hidden="true"/);assert.match(code,/focusable="false"/);}
  assert.match(sprite,/viewBox="0 0 24 24"/);assert.match(sprite,/viewBox="0 0 40 40"/);
  assert.match(standalone,/viewBox="0 0 48 48"/);assert.match(standalone,/transform="scale\(2\)"/);
});
test('brand geometry remains exact; pictograms contain only currentColor paths',()=>{
  assert.equal(BRAND_MARK,'<path fill-rule="evenodd" fill="currentColor" d="M9 31V18.5C9 12.5 13.5 8.6 20 5c6.5 3.6 11 7.5 11 13.5V31ZM20 11.5l6 7h-4V28h-4v-9.5h-4Z"/><rect x="5" y="32.5" width="30" height="3" rx="1.5" fill="currentColor"/>');
  for(const name of Object.keys(SYMBOLS)){
    const markup=symbolMarkup(name);assert.doesNotMatch(markup,/<(?:script|image|use)|#[0-9a-f]{3,8}/i);
    assert.match(markup,/currentColor/);assert.ok(SYMBOLS[name].solid||SYMBOLS[name].line);
  }
});
