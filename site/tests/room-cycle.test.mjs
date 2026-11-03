import test from 'node:test';
import assert from 'node:assert/strict';
import { initRoomCycle, ROOM_CYCLE_DELAY } from '../src/lib/room-cycle.js';

function target() {
 const listeners=new Map();
 return { dataset:{}, addEventListener(type,handler){const list=listeners.get(type)||[];list.push(handler);listeners.set(type,list);}, emit(type,values={}){for(const handler of listeners.get(type)||[])handler(values);} };
}
function fixture({reduced=false,saveData=false,presentation='home',scoped=false}={}) {
 const room=target(),control=target(),document=target(),browser=target(),media=target(),interaction=target(),scenery=target();
 const label={textContent:''},status={textContent:''},timers=new Map(),seen=[];
 let serial=0,observer;
 control.hidden=true;
 control.dataset={pauseLabel:'Pause views',resumeLabel:'Resume views',pausedMessage:'Paused',playingMessage:'Playing'};
 control.querySelector=()=>label;
 room.dataset={roomPresentation:presentation,roomPreview:'airport',doorState:'open'};
 room.ownerDocument=document;
 room.querySelector=selector=>selector==='[data-room-cycle]'?control:selector==='[data-room-cycle-status]'?status:scoped&&selector==='[data-room-tour-interaction]'?interaction:scoped&&selector==='[data-room-scenery]'?scenery:null;
 room.contains=node=>node===control;
 browser.matchMedia=()=>media;
 media.matches=reduced;
 browser.navigator={connection:{saveData}};
 browser.setTimeout=(callback,delay)=>{assert.equal(delay,ROOM_CYCLE_DELAY);timers.set(++serial,callback);return serial;};
 browser.clearTimeout=id=>timers.delete(id);
 browser.IntersectionObserver=class {constructor(callback){observer=callback;}observe(node){assert.equal(node,scoped?scenery:room);}};
 const links=['airport','campus','hospital'].map(scene=>({dataset:{doorPreview:scene}}));
 const cycle=initRoomCycle(room,browser,links,link=>{seen.push(link.dataset.doorPreview);room.dataset.roomPreview=link.dataset.doorPreview;});
 const tick=()=>{assert.equal(timers.size,1);const [id,callback]=timers.entries().next().value;timers.delete(id);callback();};
 return {room,control,interaction,scenery,document,browser,media,label,status,timers,seen,cycle,tick,visibility:visible=>observer([{isIntersecting:visible}])};
}
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
test('closing the door stops the tour and opening it starts a fresh delay',()=>{
 const f=fixture();f.room.dataset.doorState='closed';f.cycle.sync();assert.equal(f.timers.size,0);
 f.room.dataset.doorState='open';f.cycle.sync();f.cycle.sync();assert.equal(f.timers.size,1);
 f.tick();assert.equal(f.room.dataset.roomPreview,'campus');
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
