import test from 'node:test';
import assert from 'node:assert/strict';
import {initRoomMotion} from '../src/scripts/room-motion.js';
const target=()=>{const listeners=new Map();return{listeners,addEventListener(type,fn){const list=listeners.get(type)||[];list.push(fn);listeners.set(type,list);},emit(type){for(const fn of listeners.get(type)||[])fn();}};};
function fixture({withStage=false,withIntersectionObserver=true,reducedMotion=false}={}){
 const doc=target(),browser=target(),room={dataset:{roomPresentation:'home'}},values=new Map(),writes=[],frames=new Map(),intersections=[];let serial=0,headerBottom=94,stageBottom=900,observer,stageReads=0;
 const header={getBoundingClientRect:()=>({bottom:headerBottom})};
 const stage={getBoundingClientRect:()=>{stageReads++;return{bottom:stageBottom};}};
 room.querySelector=selector=>withStage&&selector==='.room-stage'?stage:null;
 doc.documentElement={style:{setProperty:(key,value)=>{values.set(key,value);writes.push([key,value]);}}};
 doc.querySelector=selector=>selector==='.room-environment'?room:selector==='.room-header'?header:null;
 browser.scrollY=0;
 browser.innerHeight=800;
 browser.location=new URL('https://example.test/airports/?country=GB#room-details');
 browser.requestAnimationFrame=fn=>{frames.set(++serial,fn);return serial;};browser.cancelAnimationFrame=id=>frames.delete(id);
 browser.ResizeObserver=class{constructor(fn){observer=fn;}observe(element){assert.equal(element,header);}};
 if(withIntersectionObserver)browser.IntersectionObserver=class{
  constructor(callback,options){this.callback=callback;this.options=options;this.disconnected=false;intersections.push(this);}
  observe(element){assert.equal(element,stage);}
  disconnect(){this.disconnected=true;}
  emit(bottom=stageBottom){this.callback([{target:stage,boundingClientRect:{bottom}}]);}
  update(bottom=stageBottom,height=250){
   const rootTop=-parseFloat(this.options.rootMargin);
   const isIntersecting=bottom>=rootTop&&bottom-height<=browser.innerHeight;
   // At threshold 0, edge adjacency changes isIntersecting but not the ratio
   // threshold index. Remaining inside or outside produces no new delivery.
   if(isIntersecting!==this.previousIntersection){this.previousIntersection=isIntersecting;this.callback([{target:stage,boundingClientRect:{bottom},isIntersecting}]);}
  }
 };
 browser.matchMedia=()=>({matches:reducedMotion});
 browser.scrollTo=()=>assert.fail('Room alignment must not scroll the page');doc.activeElement={id:'search'};
 const controller=initRoomMotion(doc,browser);
 const flush=()=>{const callbacks=[...frames.values()];frames.clear();for(const fn of callbacks)fn();};
 return{doc,browser,room,values,writes,frames,controller,flush,intersections,stage:value=>stageBottom=value,stageReads:()=>stageReads,header:value=>headerBottom=value,resizeHeader:()=>observer()};
}
test('scrolling coalesces header measurements without moving the room or changing user context',()=>{
 const f=fixture(),url=f.browser.location.href,focus=f.doc.activeElement,dataset={...f.room.dataset};f.browser.scrollY=400;
 for(let i=0;i<25;i++)f.browser.emit('scroll');assert.equal(f.frames.size,1);f.flush();
 assert.deepEqual(f.room.dataset,dataset);assert.deepEqual([...f.values.keys()],['--room-header-height']);
 assert.equal(f.browser.location.href,url);assert.equal(f.doc.activeElement,focus);assert.equal(f.browser.scrollY,400);
});
test('wrapping header, viewport resize and explicit refresh keep the doorway below the header',()=>{
 const f=fixture();assert.equal(f.values.get('--room-header-height'),'94px');
 f.header(148.2);f.resizeHeader();f.flush();assert.equal(f.values.get('--room-header-height'),'149px');
 f.header(120);f.browser.emit('resize');f.flush();assert.equal(f.values.get('--room-header-height'),'120px');
 f.header(96);f.controller.refresh();f.flush();assert.equal(f.values.get('--room-header-height'),'96px');
});
test('map, search, tab and tour events cannot reposition the architectural camera',()=>{
 const f=fixture(),dataset={...f.room.dataset};
 for(const event of ['guide:change','directory:updated','atlas:selection'])f.doc.emit(event);
 assert.equal(f.frames.size,0);assert.deepEqual(f.room.dataset,dataset);
});
test('pagehide cancels queued work and restored pages measure the current header once',()=>{
 const f=fixture();f.header(150);f.browser.emit('resize');f.browser.emit('pagehide');assert.equal(f.frames.size,0);
 f.browser.emit('scroll');assert.equal(f.frames.size,0);f.browser.emit('pageshow');assert.equal(f.frames.size,1);f.flush();assert.equal(f.values.get('--room-header-height'),'150px');
});
test('initialization is idempotent and hidden documents do no work',()=>{
 const f=fixture();assert.equal(initRoomMotion(f.doc,f.browser),undefined);f.doc.hidden=true;f.header(150);f.browser.emit('scroll');assert.equal(f.frames.size,0);
 assert.equal(f.values.get('--room-header-height'),'94px');f.doc.hidden=false;f.doc.emit('visibilitychange');f.flush();assert.equal(f.values.get('--room-header-height'),'150px');
});
test('invalid or negative measurements cannot corrupt the room layout',()=>{
 const f=fixture();f.header(NaN);f.controller.refresh();f.flush();assert.equal(f.values.get('--room-header-height'),'94px');
 f.header(-10);f.controller.refresh();f.flush();assert.equal(f.values.get('--room-header-height'),'0px');
});

test('ordinary scrolling does not repeatedly invalidate styles when header height is unchanged',()=>{
 const f=fixture();assert.equal(f.writes.length,1);
 for(let i=0;i<30;i++){f.browser.scrollY=i*20;f.browser.emit('scroll');f.flush();}
 assert.equal(f.writes.length,1);
 f.header(120);f.browser.emit('scroll');f.flush();assert.equal(f.writes.length,2);
 f.resizeHeader();f.flush();assert.equal(f.writes.length,2);
});

test('the room recedes only after the introduction clears the header and returns at the same boundary',()=>{
 const f=fixture({withStage:true}),url=f.browser.location.href,focus=f.doc.activeElement;
 assert.equal(f.room.dataset.roomReading,'false');
 assert.deepEqual(f.intersections[0].options,{rootMargin:'-94px 0px 0px 0px',threshold:0});
 f.intersections[0].emit(95);assert.equal(f.room.dataset.roomReading,'false');
 f.intersections[0].emit(94);assert.equal(f.room.dataset.roomReading,'false');
 f.intersections[0].emit(93);assert.equal(f.room.dataset.roomReading,'true');
 f.intersections[0].emit(-200);assert.equal(f.room.dataset.roomReading,'true');
 f.intersections[0].emit(95);assert.equal(f.room.dataset.roomReading,'false');
 // An introduction below the viewport is also non-intersecting; it is not past.
 f.intersections[0].emit(1400);assert.equal(f.room.dataset.roomReading,'false');
 assert.equal(f.browser.location.href,url);assert.equal(f.doc.activeElement,focus);
 assert.equal(f.browser.listeners.has('click'),false);assert.equal(f.doc.listeners.has('click'),false);
});

test('ordinary scroll leaves stage geometry to IntersectionObserver',()=>{
 const f=fixture({withStage:true});assert.equal(f.stageReads(),1);
 for(let i=0;i<30;i++){f.browser.emit('scroll');f.flush();}
 assert.equal(f.stageReads(),1);assert.equal(f.intersections.length,1);
});

test('header resizing updates the observed boundary and ignores stale observer deliveries',()=>{
 const f=fixture({withStage:true}),old=f.intersections[0];
 f.stage(120);f.header(150);f.resizeHeader();f.flush();
 assert.equal(f.room.dataset.roomReading,'true');assert.equal(old.disconnected,true);
 assert.equal(f.intersections[1].options.rootMargin,'-150px 0px 0px 0px');
 old.emit(900);assert.equal(f.room.dataset.roomReading,'true');
 f.header(94);f.browser.emit('resize');f.flush();assert.equal(f.room.dataset.roomReading,'false');
});

test('restoring the page or its visibility refreshes the room boundary without waiting for a scroll',()=>{
 const f=fixture({withStage:true});f.intersections[0].emit(20);
 f.browser.emit('pagehide');assert.equal(f.intersections[0].disconnected,true);
 f.stage(600);f.intersections[0].emit(600);assert.equal(f.room.dataset.roomReading,'true');
 f.browser.emit('pageshow');f.flush();assert.equal(f.room.dataset.roomReading,'false');
 f.doc.hidden=true;f.doc.emit('visibilitychange');assert.equal(f.intersections[1].disconnected,true);
 f.stage(20);f.intersections[1].emit(20);assert.equal(f.room.dataset.roomReading,'false');
 f.doc.hidden=false;f.doc.emit('visibilitychange');f.flush();assert.equal(f.room.dataset.roomReading,'true');
});

test('browsers without IntersectionObserver use the existing coalesced passive measurement',()=>{
 const f=fixture({withStage:true,withIntersectionObserver:false});
 f.stage(20);for(let i=0;i<25;i++)f.browser.emit('scroll');assert.equal(f.frames.size,1);f.flush();
 assert.equal(f.room.dataset.roomReading,'true');assert.equal(f.stageReads(),2);
 f.stage(500);f.browser.emit('scroll');f.flush();assert.equal(f.room.dataset.roomReading,'false');
 f.stage(NaN);f.controller.refresh();f.flush();assert.equal(f.room.dataset.roomReading,'false');
});

test('reduced-motion visitors keep the same useful room boundary with no scripted animation',()=>{
 const f=fixture({withStage:true,reducedMotion:true});f.intersections[0].emit(0);
 assert.equal(f.room.dataset.roomReading,'true');assert.equal(f.frames.size,0);
 f.intersections[0].emit(900);assert.equal(f.room.dataset.roomReading,'false');
 assert.equal(f.browser.scrollY,0);
});

test('a threshold-zero observer restores at edge adjacency even when no later entry is delivered',()=>{
 const f=fixture({withStage:true}),observer=f.intersections[0];
 observer.update(95);assert.equal(f.room.dataset.roomReading,'false');
 observer.update(94);assert.equal(f.room.dataset.roomReading,'false');
 observer.update(93);assert.equal(f.room.dataset.roomReading,'true');
 observer.update(94);assert.equal(f.room.dataset.roomReading,'false');
 observer.update(300);assert.equal(f.room.dataset.roomReading,'false');
});

test('a native anchor jump cannot leave a short stage missed on both sides of the viewport',()=>{
 const f=fixture({withStage:true}),old=f.intersections[0];
 f.stage(1000);old.update(1000,80);assert.equal(f.room.dataset.roomReading,'false');
 f.stage(-100);f.browser.scrollY=1100;old.update(-100,80);
 f.browser.emit('scroll');f.flush();assert.equal(f.room.dataset.roomReading,'true');assert.equal(old.disconnected,true);
 // Any pending entry from before the jump belongs to the retired observer.
 old.emit(1000);assert.equal(f.room.dataset.roomReading,'true');
 f.stage(1000);f.browser.scrollY=0;f.browser.emit('scroll');f.flush();assert.equal(f.room.dataset.roomReading,'false');
});

test('viewport resizing resamples a short stage even when the header height stays the same',()=>{
 const f=fixture({withStage:true});f.intersections[0].update(1000,80);
 f.stage(20);f.browser.emit('resize');f.flush();assert.equal(f.room.dataset.roomReading,'true');
 f.stage(300);f.controller.refresh();f.flush();assert.equal(f.room.dataset.roomReading,'false');
});

test('batched observer deliveries use the most recent stage entry',()=>{
 const f=fixture({withStage:true});
 f.intersections[0].callback([
  {target:{},boundingClientRect:{bottom:-10}},
  {target:f.room.querySelector('.room-stage'),boundingClientRect:{bottom:93}},
  {target:f.room.querySelector('.room-stage'),boundingClientRect:{bottom:94}},
 ]);
 assert.equal(f.room.dataset.roomReading,'false');
});
