import test from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {DOOR_ARRIVAL_KEY,DOOR_ARRIVAL_PREPAINT_SCRIPT,prepareDoorArrival,recordDoorArrival,consumeDoorArrival,initDoorArrival} from '../src/lib/door-arrival.js';

function fixture(path='/aroomtopray-preview/fr/') {
 const values=new Map(),frames=[],handlers=new Map(),states=[],timers=[],events=new Map();
 const browser={location:new URL('https://example.test'+path),sessionStorage:{getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)},matchMedia:()=>({matches:false}),requestAnimationFrame:callback=>frames.push(callback),setTimeout:(callback,delay)=>timers.push({callback,delay}),addEventListener(type,callback){const callbacks=events.get(type)||[];callbacks.push(callback);events.set(type,callbacks);}};
 const event=(href='/aroomtopray-preview/fr/airports/',props={})=>({button:0,target:{closest:()=>({href,target:'',hasAttribute:()=>false})},...props});
 const room={dataset:{doorState:'open'},ownerDocument:{documentElement:{dataset:{}},addEventListener(){}},querySelector:()=>({addEventListener:(name,handler)=>handlers.set(name,handler)})};
 const open=value=>{states.push(value);room.dataset.doorState=value?'open':'closed'};
 const emit=(type,event={})=>{for(const callback of events.get(type)||[])callback(event);};
 const prepare=()=>prepareDoorArrival(browser,room.ownerDocument);
 return {browser,values,event,room,frames,handlers,states,open,timers,events,emit,prepare,root:room.ownerDocument.documentElement};
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
 assert.equal(f.prepare(),true);assert.equal(f.root.dataset.doorArrival,'preparing');
 initDoorArrival(f.room,f.browser,f.open);assert.deepEqual(f.states,[false]);assert.equal(f.room.dataset.doorArrival,'preparing');
 assert.equal(f.root.dataset.doorArrival,undefined);
 f.frames.shift()();f.frames.shift()();assert.deepEqual(f.states,[false,true]);assert.equal(f.room.dataset.doorArrival,undefined);
});
test('reduced motion and a user door interaction suppress automatic opening',()=>{
 for(const preference of ['motion','data']) {
  const f=fixture('/airports/');f.values.set(DOOR_ARRIVAL_KEY,JSON.stringify({path:'/airports/',at:Date.now()}));f.prepare();
  if(preference==='motion')f.browser.matchMedia=()=>({matches:true});else f.browser.navigator={connection:{saveData:true}};
  initDoorArrival(f.room,f.browser,f.open);assert.deepEqual(f.states,[]);assert.equal(f.frames.length,0);assert.equal(f.root.dataset.doorArrival,undefined);
 }
 const g=fixture('/airports/');g.values.set(DOOR_ARRIVAL_KEY,JSON.stringify({path:'/airports/',at:Date.now()}));g.prepare();initDoorArrival(g.room,g.browser,g.open);g.handlers.get('click')();while(g.frames.length)g.frames.shift()();assert.deepEqual(g.states,[false]);assert.equal(g.room.dataset.doorArrival,undefined);
});
test('leaving during arrival settles the door once and cannot replay queued frames on restoration',()=>{
 const f=fixture('/airports/');
 f.values.set(DOOR_ARRIVAL_KEY,JSON.stringify({path:'/airports/',at:Date.now()}));
 f.prepare();
 initDoorArrival(f.room,f.browser,f.open);f.frames.shift()();
 f.emit('pagehide');assert.deepEqual(f.states,[false,true]);
 f.emit('pageshow',{persisted:true});f.frames.shift()();
 assert.deepEqual(f.states,[false,true]);assert.equal(f.room.dataset.doorArrival,undefined);
});
test('late modules never close a server-rendered open door without a before-paint preparation',()=>{
 const f=fixture('/airports/');f.values.set(DOOR_ARRIVAL_KEY,JSON.stringify({path:'/airports/',at:Date.now()}));
 initDoorArrival(f.room,f.browser,f.open);assert.deepEqual(f.states,[]);assert.equal(f.frames.length,0);assert.equal(f.values.size,0);assert.equal(f.room.dataset.doorState,'open');
});
test('the actual inline script marks only a valid arrival and expires if the module fails',()=>{
 const f=fixture('/aroomtopray-preview/ar/hospitals/');f.values.set(DOOR_ARRIVAL_KEY,JSON.stringify({path:f.browser.location.pathname,at:Date.now()}));
 runInNewContext(DOOR_ARRIVAL_PREPAINT_SCRIPT,{window:f.browser,document:f.room.ownerDocument});
 assert.equal(f.root.dataset.doorArrival,'preparing');assert.equal(f.values.size,1);assert.equal(f.timers[0].delay,4000);
 f.timers[0].callback();assert.equal(f.root.dataset.doorArrival,undefined);
 initDoorArrival(f.room,f.browser,f.open);assert.deepEqual(f.states,[]);assert.equal(f.room.dataset.doorState,'open');
});
test('prepaint rejects malformed, stale, wrong-path, reduced-motion and data-saving arrivals',()=>{
 for(const raw of [undefined,'null','broken','{}',JSON.stringify({path:'/hospitals/',at:Date.now()}),JSON.stringify({path:'/airports/',at:Date.now()-20000}),JSON.stringify({path:'/airports/',at:Date.now()+20000})]) {
  const f=fixture('/airports/');f.values.set(DOOR_ARRIVAL_KEY,raw);assert.equal(f.prepare(),false);assert.equal(f.root.dataset.doorArrival,undefined);assert.equal(f.timers.length,0);
 }
 for(const setup of [f=>{f.browser.matchMedia=()=>({matches:true});},f=>{f.browser.navigator={connection:{saveData:true}};},f=>{f.browser.sessionStorage.getItem=()=>{throw Error('blocked');};}]) {
  const f=fixture('/airports/');f.values.set(DOOR_ARRIVAL_KEY,JSON.stringify({path:'/airports/',at:Date.now()}));setup(f);assert.equal(f.prepare(),false);assert.equal(f.root.dataset.doorArrival,undefined);
 }
});
test('before-paint preparation cannot be retained in the back-forward cache',()=>{
 for(const event of ['pagehide','pageshow']) {
  const f=fixture('/airports/');f.values.set(DOOR_ARRIVAL_KEY,JSON.stringify({path:'/airports/',at:Date.now()}));f.prepare();
  if(event==='pageshow'){f.emit('pageshow',{persisted:false});assert.equal(f.root.dataset.doorArrival,'preparing');}
  f.emit(event,{persisted:true});assert.equal(f.root.dataset.doorArrival,undefined);
 }
});
