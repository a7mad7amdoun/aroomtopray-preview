import test from 'node:test';
import assert from 'node:assert/strict';
import {relatedPlaceGuides} from '../src/lib/related-place-guides.js';
const place={url:'/airports/lhr/',country:'United Kingdom',city:'London'};
const airport=(code,extra={})=>({url:`/airports/${code}/`,name:code,country:'United Kingdom',city:'Manchester',status:'room',spaces:[{}],...extra});
test('related guides exclude self, duplicate, wrong-country, unchecked and non-category destinations',()=>{
 const entries=[airport('lhr'),airport('ams',{country:'Netherlands'}),airport('pending',{status:'pending'}),airport('planned',{status:'planned'}),airport('empty',{spaces:[]}),airport('held',{hold:true}),airport('wrong',{url:'/hospitals/test/'}),airport('bad',{url:'https://other.test/airports/x/'}),airport('man'),airport('man')];
 assert.deepEqual(relatedPlaceGuides(place,entries,'airports').map(p=>p.url),['/airports/man/']);
});
test('same city is preferred without changing source order or claiming proximity',()=>{
 const entries=[airport('aaa'),airport('bbb'),airport('zzz',{city:'London'})];
 assert.deepEqual(relatedPlaceGuides(place,entries,'airports').map(p=>p.name),['zzz','aaa']);
 assert.deepEqual(entries.map(p=>p.name),['aaa','bbb','zzz']);
});
test('missing country and unsupported category never produce unrelated suggestions',()=>{
 assert.deepEqual(relatedPlaceGuides({...place,country:null},[airport('man')],'airports'),[]);
 assert.deepEqual(relatedPlaceGuides(place,[airport('man')],'other'),[]);
});
test('campus and hospital records do not require airport status',()=>{
 const candidate=airport('x',{url:'/universities/test/',status:undefined});
 assert.equal(relatedPlaceGuides({...place,url:'/universities/source/'},[candidate],'universities').length,1);
});
