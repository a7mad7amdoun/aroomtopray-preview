import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {COUNTRY_CODES,countryCode,countryFlag,countryFlagUrl,countryName,countrySearchText,readCountry,writeCountry} from '../src/lib/countries.js';
import {readDirectoryState,writeDirectoryState} from '../src/lib/directory-state.js';
import {readDirectoryMode} from '../src/lib/directory-presentation.js';
import {searchPlaces} from '../src/lib/place-search.js';

test('all 250 country and territory flags are self-hosted SVGs with no active content',()=>{
 assert.equal(COUNTRY_CODES.length,250);assert.equal(new Set(COUNTRY_CODES).size,250);
 for(const code of COUNTRY_CODES){
  const flag=readFileSync(new URL('../public'+countryFlagUrl(code),import.meta.url),'utf8');
  assert.match(flag,/<svg\b/);assert.doesNotMatch(flag,/<script\b|\bon\w+\s*=|<foreignObject\b|\bhref\s*=\s*["'](?:https?:|javascript:)/i);
  assert.equal(countryCode(countryName(code,'ar')),code);
 }
 for(const unsafe of ['../gb','<script>','https://example.com/gb.svg',null,{},'ZZ'])assert.equal(countryFlagUrl(unsafe),'');
});

test('place search recognizes country names in all four languages and common aliases',()=>{
 const entries=[{code:'CMN',url:'/airports/cmn/',text:'Casablanca CMN '+countrySearchText('MA')},{code:'IST',url:'/airports/ist/',text:'Istanbul IST '+countrySearchText('TR')},{code:'DXB',url:'/airports/dxb/',text:'Dubai DXB '+countrySearchText('AE')}];
 for(const query of ['Maroc','Morocco','المغرب','المَغْرِب','المغـرب','Marruecos'])assert.equal(searchPlaces(entries,query)[0].code,'CMN');
 for(const query of ['الإمارات','الامارات'])assert.equal(searchPlaces(entries,query)[0].code,'DXB');
 for(const query of ['Turkey','Türkiye','Turquie','تركيا','Turquía'])assert.equal(searchPlaces(entries,query)[0].code,'IST');
 assert.equal(countryFlagUrl('United Kingdom'),'/flags/gb.svg');
 assert.equal(countryCode('Émirats arabes unis'),'AE');
});

test('every listed place has a recognizable country marker and localized name',()=>{
 const countries=new Set();
 for(const file of ['airports','universities','universities-2','hospitals-uk','hospitals-na']) {
  const records=JSON.parse(readFileSync(new URL(`../src/data/${file}.json`,import.meta.url)));
  records.forEach(place=>countries.add(place.country));
 }
 for(const country of countries) {
  assert.match(countryCode(country),/^[A-Z]{2}$/,country);
  assert.equal([...countryFlag(country)].length,2,country);
  for(const locale of ['en','fr','ar','es'])assert.ok(countryName(country,locale).length>1,country);
 }
 assert.equal(countryCode('Türkiye'),'TR');
 assert.equal(countryCode('Bosnia & Herzegovina'),'BA');
 assert.equal(countryCode('Hong Kong SAR China'),'HK');
 assert.equal(countryFlag('Unlisted country'),'');
});

test('country links retain filtering and active view, while invalid values fall back safely',()=>{
 const url='?country=MA&q=Casablanca&f=wudu&mode=list';
 assert.equal(readCountry(url,['MA','FR']),'MA');
 assert.equal(readCountry('?country=unknown',['MA','FR']),'');
 const state=readDirectoryState(url,['All'],['wudu','women']);state.f.add('women');
 const next=writeCountry('FR',writeDirectoryState(state,url));
 assert.equal(readCountry(next,['MA','FR']),'FR');
 assert.equal(new URLSearchParams(next).get('q'),'Casablanca');
 assert.equal(new URLSearchParams(next).get('f'),'women,wudu');
 assert.equal(readDirectoryMode(next,true),'list');
 assert.equal(readDirectoryMode('?mode=guide',false),'guide');
 assert.equal(readDirectoryMode('?mode=guide&country=MA',true),'guide');
 assert.equal(new URLSearchParams(writeCountry('',next)).has('country'),false);
});
