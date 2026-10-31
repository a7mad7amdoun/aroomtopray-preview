import test from 'node:test';
import assert from 'node:assert/strict';
import { searchPlaces, searchIndexForKey } from '../src/lib/place-search.js';

test('search arrows enter from either end and wrap without taking over unrelated keys',()=>{
  assert.equal(searchIndexForKey('ArrowUp',-1,7),6);
  assert.equal(searchIndexForKey('ArrowDown',-1,7),0);
  assert.equal(searchIndexForKey('ArrowDown',6,7),0);
  assert.equal(searchIndexForKey('ArrowUp',0,7),6);
  assert.equal(searchIndexForKey('ArrowUp',-1,0),null);
  for(const key of ['Tab','Home','End','ArrowLeft','ArrowRight']) assert.equal(searchIndexForKey(key,2,7),null);
});

const entries = [
  { code: '', text: 'LHR University London', url: '/universities/lhr/' },
  { code: 'LHR', text: 'Heathrow London United Kingdom LHR', url: '/airports/lhr/' },
  { code: '', text: 'Université de Montréal Canada', url: '/universities/montreal/' },
  { code: '', text: 'Hôpital Montréal Canada', url: '/hospitals/montreal/' },
];
test('one search matches institutions and places without accents, and prioritizes exact airport codes', () => {
  assert.equal(searchPlaces(entries, 'lhr')[0].url, '/airports/lhr/');
  assert.equal(searchPlaces(entries, 'montreal canada').length, 2);
  assert.equal(searchPlaces(entries, 'universite montreal')[0].url, '/universities/montreal/');
  assert.equal(searchPlaces(entries, 'hopital')[0].url, '/hospitals/montreal/');
  assert.equal(searchPlaces(entries, 'Canada', 1).length, 1);
});
test('a cleared or unmatched query has no selectable stale result', () => {
  assert.equal(searchPlaces(entries, 'Heathrow').length, 1);
  for (const query of ['', '  ', 'not a listed place']) assert.deepEqual(searchPlaces(entries, query), []);
});
