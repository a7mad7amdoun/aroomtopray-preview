import test from 'node:test';
import assert from 'node:assert/strict';
import { exploreMapPoints, mapCountries, mapWindowPoints, resolveMapSearch, nearestMapTarget, wheelMapTransform, focusMapTransform, expandMapGroup, mapMarkerLabel, mapSelectionQuery, mapResultFocus } from '../src/lib/map-explorer.js';

const points = [
  { code: 'gru', iata: 'GRU', fullName: 'São Paulo Guarulhos Airport', name: 'Guarulhos', city: 'São Paulo', country: 'Brasil', countryCode: 'BR', status: 'pending', x: 20, y: 30 },
  { code: 'lhr', iata: 'LHR', fullName: 'London Heathrow Airport', name: 'Heathrow', city: 'London', country: 'United Kingdom', countryCode: 'GB', status: 'room', x: 80, y: 50 },
  { code: 'ltn', iata: 'LTN', fullName: 'London Luton Airport', name: 'Luton', city: 'London', country: 'United Kingdom', countryCode: 'GB', status: 'none', x: 100, y: 100 },
  { code: 'rak', iata: 'RAK', fullName: 'مطار مَرَّاكُش', name: 'المنارة', city: 'مراكش', country: 'المغرب', countryCode: 'MA', status: 'pending', x: 140, y: 60 },
];
const codes = values => values.map(point => point.code);

test('selection changes clear only stale room context and retain directory filters', () => {
  const input='mode=map&country=GB&f=wudu,women&q=London&airport=lhr&room=2';
  const same=new URLSearchParams(mapSelectionQuery('lhr',input));
  assert.equal(same.get('room'),'2');
  const changed=new URLSearchParams(mapSelectionQuery('ltn',input));
  assert.equal(changed.get('airport'),'ltn');assert.equal(changed.has('room'),false);
  const cleared=new URLSearchParams(mapSelectionQuery('',input));
  assert.equal(cleared.has('airport'),false);assert.equal(cleared.has('room'),false);
  for(const key of ['mode','country','f','q'])assert.equal(cleared.get(key),new URLSearchParams(input).get(key));
  assert.equal(new URLSearchParams(mapSelectionQuery('', '?room=3')).has('room'),false);
  const university=new URLSearchParams(mapSelectionQuery('warwick','country=GB&mode=map&place=bristol','place'));
  assert.equal(university.get('place'),'warwick');assert.equal(university.get('country'),'GB');
});

test('result refresh keeps focus on a surviving place or the nearest remaining row', () => {
  const before=['a','b','c','d'];
  assert.equal(mapResultFocus(before,['d','c','b','a'],'c'),'c');
  assert.equal(mapResultFocus(before,['a','d'],'b'),'d');
  assert.equal(mapResultFocus(before,['a','b'],'d'),'b');
  assert.equal(mapResultFocus(before,[],'b'),null);
  assert.equal(mapResultFocus(before,['a','b'],null),null);
  assert.equal(mapResultFocus(before,['a','b'],'outside-list'),null);
  assert.equal(mapResultFocus(before,[...before,'e','f'],'d'),'d');
});

test('wheel zoom preserves the world coordinate under the pointer and normalizes wheel units', () => {
  const current={x:-500,y:-300,k:3},pointer={x:430,y:260};
  const next=wheelMapTransform(current,-40,0,pointer,1200,640);
  assert.ok(next.k>current.k && next.k<current.k*1.1);
  assert.ok(Math.abs((pointer.x-next.x)/next.k-(pointer.x-current.x)/current.k)<1e-9);
  assert.ok(Math.abs((pointer.y-next.y)/next.k-(pointer.y-current.y)/current.k)<1e-9);
  assert.deepEqual(wheelMapTransform(current,-2.5,1,pointer,1200,640),next);
  assert.deepEqual(wheelMapTransform(current,-40/640,2,pointer,1200,640),next);
  const restored=wheelMapTransform(next,40,0,pointer,1200,640);
  assert.ok(Math.abs(restored.k-current.k)<1e-9);
  assert.ok(Math.abs(restored.x-current.x)<1e-9);
  assert.deepEqual(wheelMapTransform(current,NaN,0,pointer,1200,640),current);
  assert.ok(wheelMapTransform(current,-100000,0,pointer,1200,640).k<=current.k*Math.exp(.24));
});

test('choosing a visible place preserves deliberate zoom and does not recenter unnecessarily', () => {
  const current={x:-2000,y:-1000,k:5};
  assert.deepEqual(focusMapTransform({x:500,y:260},current,1200,640),current);
  const distant=focusMapTransform({x:800,y:300},current,1200,640);
  assert.equal(distant.k,5);
  assert.equal(800*distant.k+distant.x,600);
  assert.equal(300*distant.k+distant.y,320);
  assert.equal(focusMapTransform({x:500,y:300},{x:0,y:0,k:1},1200,640).k,2.2);
  assert.deepEqual(focusMapTransform({x:NaN,y:0},current,1200,640),current);
});

test('cluster exploration never zooms out or jumps directly from overview to maximum zoom', () => {
  const group=[{x:500,y:300},{x:501,y:301}];
  const first=expandMapGroup(group,{x:0,y:0,k:1},1200,640);
  assert.equal(first.k,1.6);
  const close=expandMapGroup(group,{x:-1800,y:-1000,k:5},1200,640);
  assert.equal(close.k,7);
  const detailed=expandMapGroup(group,{x:-1400,y:-880,k:4},1200,640);
  assert.equal(detailed.k,6.4);
  assert.equal(expandMapGroup(group,detailed,1200,640).k,7);
  const broad=expandMapGroup([{x:100,y:100},{x:1100,y:540}],{x:-1400,y:-880,k:4},1200,640);
  assert.equal(broad.k,4,'a broad group must never force the camera to zoom out');
  const max=expandMapGroup([{x:500,y:300},{x:500,y:300}],{x:-2900,y:-1780,k:7},1200,640);
  assert.equal(max.k,7);
  assert.deepEqual(expandMapGroup([],{x:0,y:0,k:1},1200,640),{x:0,y:0,k:1});
});

test('marker badges use airport codes or institution names, never country codes as identity', () => {
  assert.equal(mapMarkerLabel({iata:'lhr',name:'Heathrow'},'airports'),'LHR');
  assert.equal(mapMarkerLabel({iata:'GB',name:'UCL'},'universities'),'UCL');
  assert.equal(mapMarkerLabel({iata:'GB',name:'St Thomas Hospital'},'hospitals'),'STH');
  assert.equal(mapMarkerLabel({fullName:'جامعة محمد الخامس'},'universities'),'جما');
  assert.equal(mapMarkerLabel({},'hospitals'),'');
});

test('Enter never treats a shared institution country badge as a unique destination', () => {
  const institutions = [
    { code: 'warwick', iata: 'GB', fullName: 'University of Warwick', name: 'Warwick' },
    { code: 'bristol', iata: 'GB', fullName: 'University of Bristol', name: 'Bristol' },
  ];
  assert.equal(resolveMapSearch(institutions, 'GB', 'universities'), null);
  assert.equal(resolveMapSearch(institutions, 'GB', 'hospitals'), null);
  assert.equal(resolveMapSearch(institutions, 'WARWICK', 'universities'), institutions[0]);
  assert.equal(resolveMapSearch(points, 'LHR'), points[1]);
  assert.equal(resolveMapSearch(points, 'sao paulo guarulhos airport'), points[0]);
  assert.equal(resolveMapSearch([institutions[1]], 'Bris', 'universities'), institutions[1]);
  assert.equal(resolveMapSearch([institutions[1]], '  ', 'universities'), null);
  assert.equal(resolveMapSearch([{ name: 'Shared' }, { name: 'Shared' }], 'shared'), null);
});

test('overlapping marker hit areas select the nearest visual target at every zoom', () => {
  const targets = [{ code: 'left', x: 100, y: 100 }, { code: 'right', x: 120, y: 100 }];
  assert.equal(nearestMapTarget(targets, { x: 102, y: 100 }, { x: 0, y: 0, k: 1 }), targets[0]);
  assert.equal(nearestMapTarget([...targets].reverse(), { x: 102, y: 100 }, { x: 0, y: 0, k: 1 }), targets[0]);
  assert.equal(nearestMapTarget(targets, { x: 209, y: 200 }, { x: -100, y: -100, k: 3 }, .5), targets[0]);
  const cluster = { key: 'nearby', x: 118, y: 100 };
  assert.equal(nearestMapTarget([targets[0], cluster], { x: 118, y: 100 }, { x: 0, y: 0, k: 1 }), cluster);
  assert.equal(nearestMapTarget(targets, { x: 200, y: 200 }, { x: 0, y: 0, k: 1 }), null);
  assert.equal(nearestMapTarget(targets, { x: 122, y: 100 }, { x: 0, y: 0, k: 1 }, 1, 1), null);
  assert.equal(nearestMapTarget(targets, { x: NaN, y: 100 }, { x: 0, y: 0, k: 1 }), null);
});

test('search intersects all query words, exact country and allowed directory records', () => {
  assert.deepEqual(codes(exploreMapPoints(points, { query: '  LONDON airport ', country: 'GB', allowedCodes: new Set(['lhr', 'rak']) })), ['lhr']);
  assert.deepEqual(codes(exploreMapPoints(points, { query: 'London Luton' })), ['ltn']);
  assert.deepEqual(exploreMapPoints(points, { country: 'G' }), []);
  assert.deepEqual(exploreMapPoints(points, { country: 'BR', allowedCodes: ['lhr'] }), []);
  assert.deepEqual(exploreMapPoints(points, { allowedCodes: [] }), []);
  assert.deepEqual(exploreMapPoints(points, { query: 'unknown city' }), []);
});

test('search handles accents, composed characters, punctuation, codes and Arabic marks', () => {
  for (const query of ['sao paulo', 'SÃO PAULO', 'Sa\u0303o Paulo', 'GRU', 'Guarulhos Brasil', 'sao-paulo']) {
    assert.deepEqual(codes(exploreMapPoints(points, { query })), ['gru'], query);
  }
  for (const query of ['مراكش', 'مَرَّاكُش', 'مـراكش', 'المنارة المغرب']) {
    assert.deepEqual(codes(exploreMapPoints(points, { query })), ['rak'], query);
  }
  assert.deepEqual(codes(exploreMapPoints([{ code: 'university-of-warwick' }], { query: 'warwick' })), ['university-of-warwick']);
  assert.deepEqual(exploreMapPoints(points, { query: '  ---  ' }), points);
});

test('discovery preserves original order, object identity and uncertain facility status', () => {
  const before = JSON.stringify(points);
  const result = exploreMapPoints(points, { allowedCodes: ['rak', 'gru'] });
  assert.deepEqual(codes(result), ['gru', 'rak']);
  assert.equal(result[0], points[0]);
  assert.equal(result[0].status, 'pending');
  assert.equal(JSON.stringify(points), before);
  assert.notEqual(exploreMapPoints(points), points);
});

test('country options count the supplied records and sort their displayed localized names', () => {
  const result = mapCountries(points, 'en');
  assert.deepEqual(result.find(country => country.code === 'GB'), { code: 'GB', name: 'United Kingdom', count: 2 });
  assert.equal(result.length, 3);
  assert.deepEqual(mapCountries(exploreMapPoints(points, { query: 'heathrow' })), [{ code: 'GB', name: 'United Kingdom', count: 1 }]);
  assert.deepEqual(mapCountries([], 'ar'), []);
  const localized = [{ countryCode: 'SE', country: 'Öland' }, { countryCode: 'AX', country: 'Åland' }, { countryCode: 'ZZ', country: 'Zulu' }, { country: 'No code' }];
  assert.deepEqual(mapCountries(localized, 'sv').map(country => country.code), ['ZZ', 'AX', 'SE']);
});

test('viewport includes exact boundaries and applies translation after scale', () => {
  assert.deepEqual(codes(mapWindowPoints(points, { x: 0, y: 0, k: 1 }, 100, 100)), ['gru', 'lhr', 'ltn']);
  assert.deepEqual(codes(mapWindowPoints(points, { x: -40, y: -60, k: 2 }, 120, 100)), ['gru', 'lhr']);
  assert.deepEqual(codes(mapWindowPoints(points, { x: -160, y: -100, k: 2 }, 120, 100)), ['lhr', 'ltn', 'rak']);
  assert.deepEqual(mapWindowPoints([{ x: -0.01, y: 0 }, { x: 100.01, y: 0 }, { x: 0, y: -0.01 }, { x: 0, y: 100.01 }], {}, 100, 100), []);
});

test('viewport rejects invalid geometry and preserves records without mutation', () => {
  assert.deepEqual(mapWindowPoints([{ x: NaN, y: 0 }, { x: 0, y: Infinity }, { x: null, y: 0 }], {}, 100, 100), []);
  for (const transform of [{ k: 0 }, { k: -1 }, { k: Infinity }, { x: NaN }, { y: null }]) {
    assert.deepEqual(mapWindowPoints(points, transform, 100, 100), []);
  }
  assert.deepEqual(mapWindowPoints(points, {}, 0, 100), []);
  assert.deepEqual(mapWindowPoints(points, {}, 100, NaN), []);
  assert.equal(mapWindowPoints(points, null, 100, 100)[0], points[0]);
});
