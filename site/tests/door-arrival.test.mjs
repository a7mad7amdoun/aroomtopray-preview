import test from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {DOOR_ARRIVAL_KEY,DOOR_ARRIVAL_PREPAINT_SCRIPT,DOOR_JOURNEY_DURATION,DOOR_JOURNEY_ANIMATION,prepareDoorArrival,recordDoorArrival,consumeDoorArrival,initDoorArrival} from '../src/lib/door-arrival.js';

function fixture(path='/aroomtopray-preview/fr/') {
 const values=new Map(),frames=[],handlers=new Map(),states=[],timers=[],events=new Map(),roomEvents=new Map(),mediaEvents=new Map();
 const listen=(registry,type,callback)=>{const callbacks=registry.get(type)||[];callbacks.push(callback);registry.set(type,callbacks);};
 const dispatch=(registry,type,event={})=>{for(const callback of registry.get(type)||[])callback(event);};
 const media={matches:false,addEventListener:(type,callback)=>listen(mediaEvents,type,callback)};
 const browser={location:new URL('https://example.test'+path),sessionStorage:{getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)},matchMedia:()=>media,requestAnimationFrame:callback=>frames.push(callback),setTimeout:(callback,delay)=>timers.push({callback,delay})-1,clearTimeout:id=>{timers[id].cancelled=true;},addEventListener:(type,callback)=>listen(events,type,callback)};
 const event=(href='/aroomtopray-preview/fr/airports/',props={})=>({button:0,target:{closest:()=>({href,target:'',hasAttribute:()=>false})},...props});
 const room={dataset:{doorState:'open'},ownerDocument:{documentElement:{dataset:{}},addEventListener(){}},querySelector:()=>({addEventListener:(name,handler)=>handlers.set(name,handler)}),addEventListener:(type,callback)=>listen(roomEvents,type,callback)};
 const open=value=>{states.push(value);room.dataset.doorState=value?'open':'closed'};
 const emit=(type,event={})=>dispatch(events,type,event);
 const prepare=()=>prepareDoorArrival(browser,room.ownerDocument);
 const start=()=>{values.set(DOOR_ARRIVAL_KEY,JSON.stringify({path:browser.location.pathname,at:Date.now()}));prepare();initDoorArrival(room,browser,open);};
 const flush=()=>{while(frames.length)frames.shift()();};
 const emitRoom=(type,event)=>dispatch(roomEvents,type,event);
 const reduce=matches=>{media.matches=matches;dispatch(mediaEvents,'change',{matches});};
 return {browser,values,event,room,frames,handlers,states,open,timers,events,emit,prepare,start,flush,emitRoom,reduce,root:room.ownerDocument.documentElement};
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

test('arrival depth starts with the open door, is bounded, and never changes reading context',()=>{
 const f=fixture('/aroomtopray-preview/fr/airports/?country=GB#guide-content');
 const href=f.browser.location.href,focus={id:'q-dir'};
 f.browser.scrollY=420;
 f.browser.scrollTo=()=>assert.fail('Arrival must not scroll the page');
 f.room.ownerDocument.activeElement=focus;
 f.start();
 assert.equal(f.room.dataset.doorJourney,undefined);
 f.frames.shift()();assert.equal(f.room.dataset.doorJourney,undefined);
 f.frames.shift()();assert.equal(f.room.dataset.doorJourney,'entering');
 assert.equal(f.room.dataset.doorState,'open');assert.deepEqual(f.states,[false,true]);
 assert.equal(DOOR_JOURNEY_DURATION,1500);
 const timer=f.timers.find(timer=>timer.delay===DOOR_JOURNEY_DURATION);
 assert.ok(timer);timer.callback();
 assert.equal(f.room.dataset.doorJourney,undefined);
 assert.equal(timer.cancelled,true);
 assert.equal(f.browser.location.href,href);assert.equal(f.browser.scrollY,420);
 assert.equal(f.room.ownerDocument.activeElement,focus);
 assert.deepEqual(f.states,[false,true]);
});

test('only the named scene animation completes the arrival depth treatment',()=>{
 const f=fixture('/universities/');f.start();f.flush();
 const scene={classList:{contains:name=>name==='door-scene'}};
 f.emitRoom('animationend',{animationName:'other-animation',target:scene});
 assert.equal(f.room.dataset.doorJourney,'entering');
 f.emitRoom('animationend',{animationName:DOOR_JOURNEY_ANIMATION,target:{classList:{contains:()=>false}}});
 assert.equal(f.room.dataset.doorJourney,'entering');
 f.emitRoom('animationend',{animationName:DOOR_JOURNEY_ANIMATION,target:scene});
 assert.equal(f.room.dataset.doorJourney,undefined);
 assert.equal(f.timers.find(timer=>timer.delay===DOOR_JOURNEY_DURATION).cancelled,true);
 assert.deepEqual(f.states,[false,true]);
});

test('manual door interaction cancels depth immediately without forcing its state',()=>{
 for(const afterOpening of [false,true]){
  const f=fixture('/hospitals/');f.start();if(afterOpening)f.flush();
  f.handlers.get('click')();f.flush();
  assert.equal(f.room.dataset.doorJourney,undefined);
  assert.equal(f.room.dataset.doorArrival,undefined);
  assert.deepEqual(f.states,afterOpening?[false,true]:[false]);
  for(const timer of f.timers.filter(timer=>timer.delay===DOOR_JOURNEY_DURATION))assert.equal(timer.cancelled,true);
 }
});

test('leaving or restoring during depth cannot retain or replay the decorative marker',()=>{
 for(const event of ['pagehide','pageshow']){
  const f=fixture('/hospitals/');f.start();f.flush();
  f.emit(event,{persisted:true});
  assert.equal(f.room.dataset.doorJourney,undefined);
  assert.equal(f.timers.find(timer=>timer.delay===DOOR_JOURNEY_DURATION).cancelled,true);
  f.emit('pageshow',{persisted:true});f.flush();
  assert.equal(f.room.dataset.doorJourney,undefined);
  assert.equal(f.room.dataset.doorArrival,undefined);
  assert.deepEqual(f.states,[false,true]);
 }
});

test('restoration during preparation settles open even without a preceding pagehide event',()=>{
 const f=fixture('/airports/');f.start();f.frames.shift()();
 f.emit('pageshow',{persisted:true});f.flush();
 assert.deepEqual(f.states,[false,true]);assert.equal(f.room.dataset.doorArrival,undefined);
 assert.equal(f.room.dataset.doorJourney,undefined);
 assert.equal(f.timers.some(timer=>timer.delay===DOOR_JOURNEY_DURATION),false);
});

test('ordinary initial pageshow does not truncate the first arrival animation',()=>{
 const f=fixture('/airports/');f.start();f.flush();
 f.emit('pageshow',{persisted:false});
 assert.equal(f.room.dataset.doorJourney,'entering');assert.deepEqual(f.states,[false,true]);
});

test('enabling reduced motion cancels preparation or depth without replay on preference restoration',()=>{
 for(const afterOpening of [false,true]){
  const f=fixture('/aroomtopray-preview/ar/universities/');f.start();if(afterOpening)f.flush();
  f.reduce(true);f.flush();
  assert.equal(f.room.dataset.doorJourney,undefined);
  assert.equal(f.room.dataset.doorArrival,undefined);
  assert.equal(f.room.dataset.doorState,'open');assert.deepEqual(f.states,[false,true]);
  for(const timer of f.timers.filter(timer=>timer.delay===DOOR_JOURNEY_DURATION))assert.equal(timer.cancelled,true);
  f.reduce(false);f.emit('pageshow',{persisted:true});f.flush();
  assert.equal(f.room.dataset.doorJourney,undefined);assert.deepEqual(f.states,[false,true]);
 }
});

test('bookmarks and unsupported arrivals have no depth marker or journey timer',()=>{
 for(const setup of [()=>{},f=>{f.reduce(true);},f=>{f.browser.navigator={connection:{saveData:true}};},f=>{f.browser.sessionStorage.getItem=()=>{throw Error('blocked');};}]){
  const f=fixture('/airports/');setup(f);
  initDoorArrival(f.room,f.browser,f.open);
  assert.equal(f.room.dataset.doorJourney,undefined);assert.equal(f.timers.length,0);
  assert.equal(f.frames.length,0);assert.deepEqual(f.states,[]);
 }
});
