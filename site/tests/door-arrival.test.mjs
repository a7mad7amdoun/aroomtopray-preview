import test from 'node:test';
import assert from 'node:assert/strict';
import {DOOR_ARRIVAL_KEY,recordDoorArrival,consumeDoorArrival,initDoorArrival} from '../src/lib/door-arrival.js';

function fixture(path='/aroomtopray-preview/fr/') {
 const values=new Map(),frames=[],handlers=new Map(),states=[];
 const browser={location:new URL('https://example.test'+path),sessionStorage:{getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)},matchMedia:()=>({matches:false}),requestAnimationFrame:callback=>frames.push(callback)};
 const event=(href='/aroomtopray-preview/fr/airports/',props={})=>({button:0,target:{closest:()=>({href,target:'',hasAttribute:()=>false})},...props});
 const room={dataset:{doorState:'open'},ownerDocument:{addEventListener(){}},querySelector:()=>({addEventListener:(name,handler)=>handlers.set(name,handler)})};
 const open=value=>{states.push(value);room.dataset.doorState=value?'open':'closed'};
 return {browser,values,event,room,frames,handlers,states,open};
}
test('native localized destination clicks store only a short-lived path, without query or personal data',()=>{
 const f=fixture();assert.equal(recordDoorArrival(f.event('/aroomtopray-preview/fr/airports/?q=London'),f.browser,1000),true);
 assert.deepEqual(JSON.parse(f.values.get(DOOR_ARRIVAL_KEY)),{path:'/aroomtopray-preview/fr/airports/',at:1000});
});
test('modified, external, same-page, download and new-tab clicks never request arrival motion',()=>{
 const f=fixture();
 for(const props of [{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{button:1},{defaultPrevented:true}])assert.equal(recordDoorArrival(f.event(undefined,props),f.browser),false);
 for(const href of ['https://elsewhere.test/airports/','/aroomtopray-preview/fr/','/aroomtopray-preview/fr/airports/lhr/'])assert.equal(recordDoorArrival(f.event(href),f.browser),false);
 for(const props of [{target:'_blank',hasAttribute:()=>false},{target:'',hasAttribute:()=>true}])assert.equal(recordDoorArrival(f.event(undefined,{target:{closest:()=>({href:'/airports/',...props})}}),f.browser),false);
 assert.equal(f.values.size,0);
});
test('intent is consumed once and rejects wrong destinations, expired/future timestamps and malformed storage',()=>{
 const f=fixture('/aroomtopray-preview/fr/airports/');
 for(const value of ['broken',JSON.stringify({path:'/hospitals/',at:900}),JSON.stringify({path:f.browser.location.pathname,at:-20000}),JSON.stringify({path:f.browser.location.pathname,at:2000})]){f.values.set(DOOR_ARRIVAL_KEY,value);assert.equal(consumeDoorArrival(f.browser,1000),false);assert.equal(f.values.size,0);}
 f.values.set(DOOR_ARRIVAL_KEY,JSON.stringify({path:f.browser.location.pathname,at:900}));assert.equal(consumeDoorArrival(f.browser,1000),true);assert.equal(consumeDoorArrival(f.browser,1000),false);
});
test('blocked storage cannot interfere with navigation or door state',()=>{
 const f=fixture();f.browser.sessionStorage={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')},removeItem(){throw Error('blocked')}};
 assert.equal(recordDoorArrival(f.event(),f.browser),false);assert.equal(consumeDoorArrival(f.browser),false);
 initDoorArrival(f.room,f.browser,f.open);assert.deepEqual(f.states,[]);
});
test('arrival opens once after layout without delaying native navigation',()=>{
 const f=fixture('/airports/');f.values.set(DOOR_ARRIVAL_KEY,JSON.stringify({path:'/airports/',at:Date.now()}));
 initDoorArrival(f.room,f.browser,f.open);assert.deepEqual(f.states,[false]);assert.equal(f.room.dataset.doorArrival,'preparing');
 f.frames.shift()();f.frames.shift()();assert.deepEqual(f.states,[false,true]);assert.equal(f.room.dataset.doorArrival,undefined);
});
test('reduced motion and a user door interaction suppress automatic opening',()=>{
 const f=fixture('/airports/');f.values.set(DOOR_ARRIVAL_KEY,JSON.stringify({path:'/airports/',at:Date.now()}));f.browser.matchMedia=()=>({matches:true});
 initDoorArrival(f.room,f.browser,f.open);assert.deepEqual(f.states,[]);assert.equal(f.frames.length,0);
 const g=fixture('/airports/');g.values.set(DOOR_ARRIVAL_KEY,JSON.stringify({path:'/airports/',at:Date.now()}));initDoorArrival(g.room,g.browser,g.open);g.handlers.get('click')();while(g.frames.length)g.frames.shift()();assert.deepEqual(g.states,[false]);
});
test('leaving during arrival settles the door once and cannot replay queued frames on restoration',()=>{
 const f=fixture('/airports/'),events=new Map();
 f.browser.addEventListener=(type,handler)=>events.set(type,handler);
 f.values.set(DOOR_ARRIVAL_KEY,JSON.stringify({path:'/airports/',at:Date.now()}));
 initDoorArrival(f.room,f.browser,f.open);f.frames.shift()();
 events.get('pagehide')();assert.deepEqual(f.states,[false,true]);
 events.get('pageshow')();f.frames.shift()();
 assert.deepEqual(f.states,[false,true]);assert.equal(f.room.dataset.doorArrival,undefined);
});
