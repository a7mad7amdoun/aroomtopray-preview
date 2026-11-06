import test from 'node:test';
import assert from 'node:assert/strict';
import {hasLocalizedRoute,languageTarget,navigationPath} from '../src/lib/localized-routes.js';
test('language switching preserves supported deep links and query state without double prefixes',()=>{
 assert.equal(languageTarget('/ar/airports/lhr/?f=wudu#room-1','fr'),'/fr/airports/lhr/?f=wudu#room-1');
 assert.equal(languageTarget('/es/visit/','en'),'/visit/');
 assert.equal(hasLocalizedRoute('/fr/hospitals/kings-college-hospital/'),true);
});
test('English-only tools remain reachable and language picker never invents unsupported routes',()=>{
 assert.equal(navigationPath('/planner/','ar'),'/planner/');
 assert.equal(languageTarget('/planner/','ar'),'/ar/');
 assert.equal(hasLocalizedRoute('/airports/lhr/extra/'),false);
 assert.equal(hasLocalizedRoute('/saved/'),false);
});
test('photo journals preserve category and language across all four locales',()=>{
 for(const kind of ['airports','universities','hospitals']){
  for(const locale of ['en','fr','ar','es']){
   const expected=`${locale==='en'?'':`/${locale}`}/explore/${kind}/`;
   assert.equal(hasLocalizedRoute(expected),true);
   assert.equal(languageTarget(`/fr/explore/${kind}/`,locale),expected);
   assert.equal(navigationPath(`/explore/${kind}/`,locale),expected);
  }
 }
 assert.equal(hasLocalizedRoute('/explore/unknown/'),false);
 assert.equal(hasLocalizedRoute('/explore/airports/lhr/'),false);
 assert.equal(languageTarget('/explore/unknown/','ar'),'/ar/');
});
