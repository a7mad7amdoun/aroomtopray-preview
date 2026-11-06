import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { initRoomCycle, ROOM_CYCLE_DELAY } from '../src/lib/room-cycle.js';
import { HOME_SCENES } from '../src/data/home-views.js';

function target() {
 const listeners=new Map();
 return { dataset:{}, addEventListener(type,handler){const list=listeners.get(type)||[];list.push(handler);listeners.set(type,list);}, emit(type,values={}){for(const handler of listeners.get(type)||[])handler(values);} };
}
function fixture({reduced=false,saveData=false,presentation='home',scoped=false,multipleRegions=false,withStage=false,six=false}={}) {
 const room=target(),control=target(),document=target(),browser=target(),media=target(),interaction=target(),secondInteraction=target(),scenery=target(),stage=target();
 const label={textContent:''},status={textContent:''},timers=new Map(),seen=[];
 const navigation=target(),previous=target(),next=target(),count={dataset:{locale:'en',of:'of'},textContent:''};
 previous.dataset.homeSceneStep='-1';next.dataset.homeSceneStep='1';navigation.querySelectorAll=()=>[previous,next];
 let serial=0,observer,observed;
 control.hidden=true;
 control.dataset={startLabel:'Explore views',pauseLabel:'Pause views',resumeLabel:'Resume views',pausedMessage:'Paused',playingMessage:'Playing'};
 control.querySelector=()=>label;
 room.dataset={roomPresentation:presentation,roomPreview:'airport'};
 room.ownerDocument=document;
 room.querySelector=selector=>selector==='[data-home-scene-controls]'?navigation:selector==='[data-home-scene-count]'?count:selector==='[data-room-cycle]'?control:selector==='[data-room-cycle-status]'?status:scoped&&selector==='[data-room-tour-interaction]'?interaction:scoped&&selector==='[data-room-scenery]'?scenery:withStage&&selector==='.room-stage'?stage:null;
 if(multipleRegions)room.querySelectorAll=selector=>selector==='[data-room-tour-interaction]'?[interaction,secondInteraction]:[];
 room.contains=node=>node===control;
 browser.matchMedia=()=>media;
 media.matches=reduced;
 browser.navigator={connection:{saveData}};
 browser.setTimeout=(callback,delay)=>{assert.equal(delay,ROOM_CYCLE_DELAY);timers.set(++serial,callback);return serial;};
 browser.clearTimeout=id=>timers.delete(id);
 browser.IntersectionObserver=class {constructor(callback){observer=callback;}observe(node){observed=node;assert.equal(node,scoped?scenery:withStage?stage:room);}};
 const links=['airport','campus','hospital'].map(scene=>({dataset:{doorPreview:scene}}));
 const sceneItems=six?['airport','campus','hospital','airport-2','campus-2','hospital-2'].map(id=>({dataset:{homeScene:id,doorPreview:id.replace(/-2$/,'')}})):links;
 const cycle=initRoomCycle(room,browser,links,link=>{seen.push(link.dataset.homeScene||link.dataset.doorPreview);room.dataset.roomPreview=link.dataset.doorPreview;room.dataset.roomScene=link.dataset.homeScene||link.dataset.doorPreview;},sceneItems);
 const tick=()=>{assert.equal(timers.size,1);const [id,callback]=timers.entries().next().value;timers.delete(id);callback();};
 return {room,control,navigation,previous,next,count,interaction,secondInteraction,scenery,stage,observed,document,browser,media,label,status,timers,seen,cycle,tick,start:()=>control.emit('click'),visibility:visible=>observer([{target:observed,isIntersecting:visible}]),intersections:entries=>observer(entries)};
}
test('the homepage starts a slow tour without a door state or a live announcement',()=>{
 const f=fixture();
 assert.equal(f.control.disabled,false);
 assert.equal(f.control.dataset.ready,'true');
 assert.equal(f.room.dataset.doorState,undefined);
 assert.equal(f.timers.size,1);assert.deepEqual(f.seen,[]);
 assert.equal(f.label.textContent,'Pause views');assert.equal(f.status.textContent,'');
 assert.equal(f.control.dataset.paused,'false');assert.equal(f.room.dataset.roomCycle,'playing');
 f.tick();assert.deepEqual(f.seen,['campus']);assert.equal(f.status.textContent,'');
});
test('motion and data preferences start still and restoration never opts visitors in',()=>{
 for(const options of [{reduced:true},{saveData:true}]){
  const f=fixture(options);
  assert.equal(f.timers.size,0);assert.deepEqual(f.seen,[]);
  assert.equal(f.label.textContent,'Explore views');assert.equal(f.status.textContent,'');
  assert.equal(f.control.dataset.paused,'true');assert.equal(f.room.dataset.roomCycle,'paused');
  f.room.emit('pointerleave');f.visibility(true);f.browser.emit('pageshow');f.document.emit('visibilitychange');
  assert.equal(f.timers.size,0);assert.equal(f.label.textContent,'Explore views');
  f.start();assert.equal(f.timers.size,1);assert.equal(f.label.textContent,'Pause views');
  f.tick();assert.deepEqual(f.seen,['campus']);
 }
});
test('the initial Explore label becomes Resume only after a tour has been started',()=>{
 const f=fixture({reduced:true});
 f.media.emit('change',{matches:true});f.media.emit('change',{matches:false});
 assert.equal(f.label.textContent,'Explore views');assert.equal(f.timers.size,0);
 f.start();f.control.emit('click');
 assert.equal(f.label.textContent,'Resume views');assert.equal(f.status.textContent,'Paused');
 f.browser.emit('pageshow');assert.equal(f.label.textContent,'Resume views');assert.equal(f.timers.size,0);
 f.control.emit('click');assert.equal(f.label.textContent,'Pause views');assert.equal(f.timers.size,1);
});
test('homepage slowly cycles all three views with only one pending timer and no live announcements',()=>{
 const f=fixture();assert.equal(f.control.hidden,false);assert.equal(ROOM_CYCLE_DELAY,14000);
 for(let i=0;i<6;i++){f.tick();assert.equal(f.timers.size,1);}
 assert.deepEqual(f.seen,['campus','hospital','airport','campus','hospital','airport']);
 assert.equal(f.status.textContent,'');assert.equal(f.label.textContent,'Pause views');
});
test('explicit pause survives visibility, hover and page restoration until resumed',()=>{
 const f=fixture();f.control.emit('click');assert.equal(f.timers.size,0);assert.equal(f.label.textContent,'Resume views');assert.equal(f.status.textContent,'Paused');
 f.room.emit('pointerleave');f.visibility(true);f.browser.emit('pagehide');f.browser.emit('pageshow');
 assert.equal(f.timers.size,0);assert.equal(f.room.dataset.roomCycle,'paused');
 f.control.emit('click');assert.equal(f.timers.size,1);assert.equal(f.status.textContent,'Playing');
});
test('explicit resume starts while its button retains focus and pointer hover',()=>{
 const f=fixture({scoped:true});
 f.interaction.emit('pointerenter');f.room.emit('focusin');
 f.control.emit('click');assert.equal(f.timers.size,0);
 f.control.emit('click');assert.equal(f.label.textContent,'Pause views');assert.equal(f.timers.size,1);
 f.tick();assert.deepEqual(f.seen,['campus']);
 // Returning to another control still protects the visitor's interaction.
 f.room.emit('focusin');assert.equal(f.timers.size,0);
 f.room.emit('focusout',{relatedTarget:null});assert.equal(f.timers.size,1);
 f.interaction.emit('pointerleave');f.interaction.emit('pointerenter');assert.equal(f.timers.size,0);
});
test('reduced-motion visitors can explicitly resume from the focused control',()=>{
 const f=fixture({reduced:true,scoped:true});
 f.room.emit('focusin');f.interaction.emit('pointerenter');
 f.control.emit('click');assert.equal(f.timers.size,1);f.tick();assert.deepEqual(f.seen,['campus']);
 f.media.emit('change',{matches:true});assert.equal(f.timers.size,0);
});
test('reduced-motion and data-saving preferences require explicit opt-in',()=>{
 for(const options of [{reduced:true},{saveData:true}]){
  const f=fixture(options);assert.equal(f.timers.size,0);assert.equal(f.control.dataset.paused,'true');
  f.control.emit('click');assert.equal(f.timers.size,1);
 }
});
test('enabling reduced motion immediately stops a running tour',()=>{
 const f=fixture();f.media.emit('change',{matches:true});assert.equal(f.timers.size,0);
 f.media.emit('change',{matches:false});assert.equal(f.timers.size,0);
});
test('hover and keyboard interaction pause the tour without losing the current scene',()=>{
 const f=fixture();f.tick();f.room.emit('pointerenter');assert.equal(f.timers.size,0);
 f.room.emit('focusin');f.room.emit('pointerleave');assert.equal(f.timers.size,0);
 f.room.emit('focusout',{relatedTarget:f.control});assert.equal(f.timers.size,0);
 f.room.emit('focusout',{relatedTarget:null});assert.equal(f.timers.size,1);f.tick();assert.equal(f.room.dataset.roomPreview,'hospital');
});
test('hidden documents, offscreen rooms and background pages never advance',()=>{
 const f=fixture();f.document.hidden=true;f.document.emit('visibilitychange');assert.equal(f.timers.size,0);
 f.document.hidden=false;f.document.emit('visibilitychange');assert.equal(f.timers.size,1);
 f.visibility(false);assert.equal(f.timers.size,0);f.visibility(true);assert.equal(f.timers.size,1);
 f.browser.emit('pagehide');assert.equal(f.timers.size,0);f.browser.emit('pageshow');assert.equal(f.timers.size,1);
 assert.deepEqual(f.seen,[]);
});
test('repeated synchronization resets one full delay without depending on a door',()=>{
 const f=fixture();
 f.cycle.sync();f.cycle.sync();assert.equal(f.timers.size,1);
 f.tick();assert.equal(f.room.dataset.roomPreview,'campus');
 assert.equal(f.room.dataset.doorState,undefined);
});
test('category and support pages do not initialize automatic cycling',()=>{
 for(const presentation of ['directory','detail','support']){const f=fixture({presentation});assert.equal(f.cycle,undefined);assert.equal(f.timers.size,0);assert.equal(f.control.hidden,true);}
});

test('persistent room keeps cycling over the guide but pauses for destination interaction and hidden scenery',()=>{
 const f=fixture({scoped:true});
 f.room.emit('pointerenter');assert.equal(f.timers.size,1);f.tick();
 f.interaction.emit('pointerenter');assert.equal(f.timers.size,0);
 f.interaction.emit('pointerleave');assert.equal(f.timers.size,1);
 f.room.emit('focusin');assert.equal(f.timers.size,0);
 f.room.emit('focusout',{relatedTarget:null});assert.equal(f.timers.size,1);
 f.visibility(false);assert.equal(f.timers.size,0);f.visibility(true);assert.equal(f.timers.size,1);
 assert.deepEqual(f.seen,['campus']);
});

test('the hero controls and destination notices independently pause the same tour',()=>{
 const f=fixture({scoped:true,multipleRegions:true});
 f.room.emit('pointerenter');assert.equal(f.timers.size,1);
 for(const region of [f.interaction,f.secondInteraction]){
  region.emit('pointerenter');assert.equal(f.timers.size,0);
  assert.equal(f.room.dataset.roomCycle,'playing');assert.deepEqual(f.seen,[]);
  region.emit('pointerleave');assert.equal(f.timers.size,1);
 }
 // Leaving one region must not restart a tour while another is still hovered.
 f.interaction.emit('pointerenter');f.secondInteraction.emit('pointerenter');
 f.interaction.emit('pointerleave');assert.equal(f.timers.size,0);
 f.secondInteraction.emit('pointerleave');assert.equal(f.timers.size,1);
 f.tick();assert.deepEqual(f.seen,['campus']);
});

test('explicit resume clears interaction pauses while subsequent focus and hover still protect the visitor',()=>{
 const f=fixture({scoped:true,multipleRegions:true});
 f.interaction.emit('pointerenter');f.secondInteraction.emit('pointerenter');f.room.emit('focusin');
 f.control.emit('click');assert.equal(f.timers.size,0);
 f.control.emit('click');assert.equal(f.timers.size,1);
 f.tick();assert.deepEqual(f.seen,['campus']);
 f.secondInteraction.emit('pointerenter');assert.equal(f.timers.size,0);
 f.room.emit('focusin');f.secondInteraction.emit('pointerleave');assert.equal(f.timers.size,0);
 f.room.emit('focusout',{relatedTarget:null});assert.equal(f.timers.size,1);
});

test('the artwork governs the tour even while a long mobile introduction remains on screen',()=>{
 const f=fixture({scoped:true,multipleRegions:true,withStage:true});
 assert.equal(f.observed,f.scenery);assert.notEqual(f.observed,f.stage);
 f.tick();assert.deepEqual(f.seen,['campus']);
 f.visibility(false);assert.equal(f.timers.size,0);
 f.browser.emit('pageshow');f.document.emit('visibilitychange');assert.equal(f.timers.size,0);
 // A batched delivery must use the artwork's most recent visibility state.
 f.intersections([{target:f.scenery,isIntersecting:true},{target:f.scenery,isIntersecting:false}]);
 assert.equal(f.timers.size,0);
 f.visibility(true);assert.equal(f.timers.size,1);
 f.tick();assert.deepEqual(f.seen,['campus','hospital']);
 f.control.emit('click');f.visibility(false);f.visibility(true);
 assert.equal(f.timers.size,0);assert.equal(f.label.textContent,'Resume views');
});

test('layouts without a scenery element fall back to the visible introduction',()=>{
 const f=fixture({withStage:true});assert.equal(f.observed,f.stage);
 assert.equal(f.timers.size,1);
 f.visibility(false);assert.equal(f.timers.size,0);
 f.visibility(true);assert.equal(f.timers.size,1);
 f.tick();assert.deepEqual(f.seen,['campus']);
});
test('six artworks cycle individually while preserving their category identity',()=>{
 const f=fixture({six:true});
 for(let i=0;i<6;i++)f.tick();
 assert.deepEqual(f.seen,['campus','hospital','airport-2','campus-2','hospital-2','airport']);
 assert.equal(f.room.dataset.roomPreview,'airport');assert.equal(f.room.dataset.roomScene,'airport');
 assert.equal(f.status.textContent,'');assert.equal(f.timers.size,1);
});
test('external menu preview suspends the tour without overriding a manual pause',()=>{
 const f=fixture({six:true});f.cycle.setExternalPaused('header',true);assert.equal(f.timers.size,0);
 f.visibility(true);f.browser.emit('pageshow');assert.equal(f.timers.size,0);
 f.cycle.setExternalPaused('header',false);assert.equal(f.timers.size,1);
 f.control.emit('click');f.cycle.setExternalPaused('header',true);f.cycle.setExternalPaused('header',false);
 assert.equal(f.timers.size,0);assert.equal(f.room.dataset.roomCycle,'paused');
});
test('home photography manifest has exactly two distinct credited photographs for each category',()=>{
 assert.equal(HOME_SCENES.length,6);assert.equal(new Set(HOME_SCENES.map(scene=>scene.id)).size,6);
 for(const category of ['airport','campus','hospital']){
  const scenes=HOME_SCENES.filter(scene=>scene.category===category);
  assert.equal(scenes.length,2);assert.equal(scenes[0].id,category);
  assert.notEqual(scenes[0].photo.id,scenes[1].photo.id);
  for(const scene of scenes)for(const image of scene.photo.images){
   assert.ok(scene.photo.author && scene.photo.sourceUrl && scene.photo.license.url);
   assert.ok(existsSync(new URL(`../public${image.src}`,import.meta.url)),`Missing real photograph: ${image.src}`);
  }
 }
});
test('manual scene controls initialize accurate count, wrap both ways and pause playback',()=>{
 const f=fixture({six:true});assert.equal(f.count.textContent,'1 of 6');assert.equal(f.room.dataset.roomScene,'airport');
 f.previous.emit('click');assert.equal(f.count.textContent,'6 of 6');assert.equal(f.room.dataset.roomScene,'hospital-2');
 assert.equal(f.timers.size,0);assert.equal(f.label.textContent,'Resume views');assert.match(f.status.textContent,/6 of 6/);
 f.next.emit('click');assert.equal(f.count.textContent,'1 of 6');assert.equal(f.room.dataset.roomScene,'airport');
 f.next.emit('click');assert.equal(f.count.textContent,'2 of 6');
 f.browser.emit('pageshow');f.visibility(true);assert.equal(f.timers.size,0);
 f.control.emit('click');f.tick();assert.equal(f.count.textContent,'3 of 6');
});
test('manual scene navigation remains available for reduced-motion and save-data visitors',()=>{
 for(const preferences of [{reduced:true},{saveData:true}]){
  const f=fixture({six:true,...preferences});assert.equal(f.timers.size,0);assert.equal(f.navigation.hidden,false);
  f.next.emit('click');assert.equal(f.room.dataset.roomScene,'campus');assert.equal(f.count.textContent,'2 of 6');assert.equal(f.timers.size,0);
  f.media.emit('change',{matches:false});assert.equal(f.timers.size,0);
 }
});
test('a canceled tour callback cannot advance after a fresh visibility delay starts',()=>{
 const f=fixture({six:true}),stale=[...f.timers.values()][0];
 f.visibility(false);f.visibility(true);stale();
 assert.deepEqual(f.seen,[]);assert.equal(f.timers.size,1);
 f.tick();assert.deepEqual(f.seen,['campus']);
});
