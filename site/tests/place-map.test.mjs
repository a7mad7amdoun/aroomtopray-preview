import test from 'node:test';
import assert from 'node:assert/strict';
import { validMapLocation, mapStatus, sourceKind, safeSourceUrl, mapLinks, mapCoverage, fitMapPoints, clusterMapPoints } from '../src/lib/place-map.js';
import { readMapSelection, writeMapSelection } from '../src/lib/airport-map-state.js';
import { withBrowseContext, returnToDirectory } from '../src/lib/directory-context.js';
import { mapCopy } from '../src/data/atlas-copy.js';
import { roomMapResource, roomMapAdvisory } from '../src/data/place-map-resources.js';

test('geography refuses invalid coordinates and street-map links never invent an entrance',()=>{
 const place={name:'St Thomas’ Hospital & Chapel',city:'London',country:'United Kingdom',lat:51.4991,lon:-.1189};
 assert.ok(validMapLocation(place));
 for(const point of [{lat:null,lon:0},{lat:NaN,lon:0},{lat:0,lon:Infinity},{lat:91,lon:0},{lat:0,lon:181}])assert.equal(mapLinks(point),null);
 const links=mapLinks(place),google=new URL(links.google),osm=new URL(links.osm),embed=new URL(links.embed);
 assert.equal(google.searchParams.get('api'),'1');
 assert.equal(google.searchParams.get('query'),'St Thomas’ Hospital & Chapel, London, United Kingdom');
 assert.equal(google.pathname,'/maps/search/');
 assert.equal(osm.searchParams.get('mlat'),String(place.lat));
 assert.equal(embed.searchParams.get('marker'),`${place.lat},${place.lon}`);
 const [west,south,east,north]=embed.searchParams.get('bbox').split(',').map(Number);
 assert.ok(west<place.lon&&east>place.lon&&south<place.lat&&north>place.lat);
 assert.equal(mapLinks({...place,lat:85,lon:180}).embed.includes('NaN'),false);
});
test('held institutions and indirect sources cannot become verified by the map',()=>{
 assert.equal(mapStatus({status:'planned'},'airports'),'planned');
 assert.equal(mapStatus({hold:true,spaces:[{}]},'hospitals'),'pending');
 assert.equal(mapStatus({spaces:[{}]},'universities'),'room');
 assert.equal(mapStatus({spaces:[]},'universities'),'none');
 assert.equal(sourceKind(true),'official');
 for(const value of ['archive','snippet','indirect'])assert.equal(sourceKind(value),'indirect');
 for(const value of [false,'true','official-read',null])assert.equal(sourceKind(value),'external');
 for(const url of ['javascript:alert(1)','data:text/html,test','https://user:password@example.org','/relative'])assert.equal(safeSourceUrl(url),'');
 assert.equal(safeSourceUrl('https://example.org/prayer?room=A%26B'),'https://example.org/prayer?room=A%26B');
});
test('coverage uses unique countries and listing counts, not physical room estimates',()=>{
 const points=[{countryCode:'GB',roomDetails:[{},{}]},{countryCode:'GB',roomDetails:[]},{countryCode:'US',roomDetails:[{}]}];
 assert.deepEqual(mapCoverage(points),{places:3,countries:2,rooms:3});
 assert.deepEqual(mapCoverage([]),{places:0,countries:0,rooms:0});
});
test('clustering retains every record and makes the selected record independently clickable',()=>{
 const points=[{code:'a',x:100,y:100},{code:'b',x:101,y:101},{code:'c',x:800,y:450}];
 const groups=clusterMapPoints(points,1);
 assert.deepEqual(groups.map(g=>g.members.length).sort(),[1,2]);
 assert.deepEqual(groups.flatMap(g=>g.members.map(p=>p.code)).sort(),['a','b','c']);
 const selected=clusterMapPoints(points,1,'a');
 assert.equal(selected.length,3);
 assert.equal(selected.find(g=>g.key==='selected:a').members[0].code,'a');
 assert.equal(clusterMapPoints([],1).length,0);
 const coincident=clusterMapPoints([{code:'one',x:1,y:1},{code:'two',x:1,y:1}],7);
 assert.equal(coincident[0].members.length,2,'coincident locations remain accessible through their group list');
});
test('fit-results safely frames sparse, empty and dense result sets',()=>{
 assert.deepEqual(fitMapPoints([],1200,640),{x:0,y:0,k:1});
 const points=[{x:300,y:220},{x:500,y:320}],t=fitMapPoints(points,1200,640);
 for(const p of points){const x=p.x*t.k+t.x,y=p.y*t.k+t.y;assert.ok(x>=0&&x<=1200&&y>=0&&y<=640);}
 assert.ok(t.k>1&&t.k<=7);
 const one=fitMapPoints([{x:500,y:300}],1200,640);assert.equal(one.k,7);
 assert.deepEqual(fitMapPoints([{x:NaN,y:1}],1200,640),{x:0,y:0,k:1});
});
test('all category selections survive guide round trips without losing filters',()=>{
 for(const kind of ['universities','hospitals']){
 const code='example-university-with-a-long-name',key='place';
 const query=writeMapSelection(code,'?country=GB&f=wudu&mode=map',key);
 const detail=new URL(withBrowseContext(`/fr/${kind}/${code}/`,query),'https://local.test');
 const returned=new URL(returnToDirectory(`/ar/${kind}/`,detail.search),'https://local.test');
 assert.equal(readMapSelection(returned.search,new Set([code]),key),code);
 assert.equal(returned.searchParams.get('country'),'GB');
 assert.equal(returned.searchParams.get('f'),'wudu');
 assert.equal(returned.searchParams.get('mode'),'map');
 assert.equal(writeMapSelection('',query,key),'country=GB&f=wudu&mode=map');
 }
 assert.equal(readMapSelection('?place=//evil.test',new Set(['safe']),'place'),'');
});
test('all locales provide the same map controls and category-specific identity',()=>{
 for(const locale of ['en','fr','ar','es'])for(const kind of ['airports','universities','hospitals']){
 const copy=mapCopy(locale,kind);
 for(const key of ['title','eyebrow','fit','official','indirect','external','roomSelect','access','hours','local','loadMap','mapNote','places','countries','roomCount','floorMap','terminalMap','hoursConflict','resourceChecked'])assert.equal(typeof copy[key],'string',`${locale}/${kind}/${key}`);
 assert.notEqual(copy.title,mapCopy(locale,kind==='airports'?'universities':'airports').title);
 }
});
test('indoor resources match the exact terminal or floor and retain their provenance',()=>{
 const urls=new Set();
 for(const terminal of [2,3,4,5]){
  const map=roomMapResource('lhr',`T${terminal} multi-faith prayer rooms`);
  assert.equal(map.type,'terminalMap');assert.equal(map.name,`Terminal ${terminal}`);
  assert.equal(new URL(map.url).host,'maps.heathrow.com');urls.add(map.url);
  assert.ok(map.source.startsWith('https://www.heathrow.com/'));assert.equal(map.checked,'2026-11-02');
 }
 assert.equal(urls.size,4);
 const ground=roomMapResource('st-thomas-hospital','Multi faith prayer room'),first=roomMapResource('st-thomas-hospital',"St Thomas' Chapel");
 assert.notEqual(ground.url,first.url);assert.match(ground.name,/Ground floor/);assert.match(first.name,/1st floor/);
 assert.equal(roomMapResource('lhr','Unknown room'),null);
 assert.equal(roomMapResource('other-hospital',"St Thomas' Chapel"),null);
 const advisory=roomMapAdvisory('st-thomas-hospital',"St Thomas' Chapel");
 assert.equal(advisory.key,'hoursConflict');assert.equal(advisory.sources.length,2);
 assert.equal(roomMapAdvisory('st-thomas-hospital','Multi faith prayer room'),null);
});
