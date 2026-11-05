import test from 'node:test';
import assert from 'node:assert/strict';
import {initRoomMotion} from '../src/scripts/room-motion.js';
const target=()=>{const listeners=new Map();return{listeners,addEventListener(type,fn){const list=listeners.get(type)||[];list.push(fn);listeners.set(type,list);},emit(type,values={}){for(const fn of listeners.get(type)||[])fn(values);}};};
function fixture({presentation='home',withStage=false,withScenery=false,withIntersectionObserver=true,reducedMotion=false}={}){
 const doc=target(),browser=target(),room={dataset:{roomPresentation:presentation}},values=new Map(),writes=[],frames=new Map(),intersections=[],media=target();let serial=0,headerBottom=94,stageBottom=900,sceneryTop=94,sceneryHeight=600,observer,stageResizeObserver,stageReads=0,sceneryReads=0,roomWrites=0;
 const header={getBoundingClientRect:()=>({bottom:headerBottom})};
 const stage={getBoundingClientRect:()=>{stageReads++;return{bottom:stageBottom};}};
 const scenery={getBoundingClientRect:()=>{sceneryReads++;return{top:sceneryTop,height:sceneryHeight};}};
 room.querySelector=selector=>withStage&&selector==='.room-stage'?stage:withScenery&&selector==='[data-room-scenery]'?scenery:null;
 room.style={setProperty:(key,value)=>{roomWrites++;values.set(key,value);writes.push([key,value]);}};
 scenery.style={setProperty:(key,value)=>{values.set(key,value);writes.push([key,value]);}};
 doc.documentElement={style:{setProperty:(key,value)=>{values.set(key,value);writes.push([key,value]);}}};
 doc.querySelector=selector=>selector==='.room-environment'?room:selector==='.room-header'?header:null;
 browser.scrollY=0;
 browser.visualViewport=target();
 browser.innerHeight=800;
 browser.location=new URL('https://example.test/airports/?country=GB#room-details');
 browser.requestAnimationFrame=fn=>{frames.set(++serial,fn);return serial;};browser.cancelAnimationFrame=id=>frames.delete(id);
 browser.ResizeObserver=class{constructor(fn){this.callback=fn;}observe(element){if(element===header)observer=this.callback;else if(element===stage)stageResizeObserver=this.callback;else assert.fail("Unexpected resize target");}};
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
 media.matches=reducedMotion;browser.matchMedia=()=>media;
 browser.scrollTo=()=>assert.fail('Room alignment must not scroll the page');doc.activeElement={id:'search'};
 const controller=initRoomMotion(doc,browser);
 const flush=()=>{const callbacks=[...frames.values()];frames.clear();for(const fn of callbacks)fn();};
 return{doc,browser,room,roomWrites:()=>roomWrites,values,writes,frames,controller,flush,intersections,media,scenery:(top,height=600)=>{sceneryTop=top;sceneryHeight=height;},sceneryReads:()=>sceneryReads,stage:value=>stageBottom=value,stageReads:()=>stageReads,header:value=>headerBottom=value,resizeHeader:()=>observer(),resizeStage:()=>stageResizeObserver()};
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


test('the room panorama fades progressively as it passes the header without changing guide context',()=>{
 const f=fixture({withScenery:true,withStage:true}),url=f.browser.location.href,focus=f.doc.activeElement;
 assert.equal(f.values.get('--room-visibility'),'1');
 f.scenery(194);f.browser.emit('scroll');f.flush();assert.equal(f.values.get('--room-visibility'),'1');
 f.scenery(94-225);f.browser.scrollY=225;f.browser.emit('scroll');f.flush();assert.equal(f.values.get('--room-visibility'),'0.58');
 f.scenery(94-450);f.browser.scrollY=450;f.browser.emit('scroll');f.flush();assert.equal(f.values.get('--room-visibility'),'0.16');
 f.scenery(-2000);f.browser.emit('scroll');f.flush();assert.equal(f.values.get('--room-visibility'),'0.16');
 f.scenery(94);f.browser.scrollY=0;f.browser.emit('scroll');f.flush();assert.equal(f.values.get('--room-visibility'),'1');
 assert.equal(f.browser.location.href,url);assert.equal(f.doc.activeElement,focus);
 assert.equal(f.room.dataset.roomReading,'false');
 assert.deepEqual([...f.values.keys()],['--room-header-height','--room-visibility']);
});

test('panorama geometry is read once per queued frame and rounded unchanged opacity is not rewritten',()=>{
 const f=fixture({withScenery:true}),initialReads=f.sceneryReads(),initialWrites=f.writes.length;
 f.scenery(-131);for(let i=0;i<25;i++)f.browser.emit('scroll');
 assert.equal(f.sceneryReads(),initialReads);assert.equal(f.frames.size,1);f.flush();
 assert.equal(f.sceneryReads(),initialReads+1);assert.equal(f.writes.length,initialWrites+1);
 f.scenery(-131.01);f.browser.emit('scroll');f.flush();assert.equal(f.writes.length,initialWrites+1);
 f.scenery(-132);f.browser.emit('scroll');f.flush();assert.equal(f.writes.length,initialWrites+2);
});

test('panorama restoration measures its current position and hidden pages do no fade work',()=>{
 const f=fixture({withScenery:true});
 f.scenery(-131);f.browser.emit('scroll');f.browser.emit('pagehide');
 const reads=f.sceneryReads();f.browser.emit('scroll');f.flush();assert.equal(f.sceneryReads(),reads);assert.equal(f.values.get('--room-visibility'),'1');
 f.browser.emit('pageshow');f.flush();assert.equal(f.values.get('--room-visibility'),'0.58');
 f.doc.hidden=true;f.doc.emit('visibilitychange');f.scenery(-1000);f.browser.emit('scroll');f.flush();assert.equal(f.sceneryReads(),reads+1);
 f.doc.hidden=false;f.doc.emit('visibilitychange');f.flush();assert.equal(f.values.get('--room-visibility'),'0.16');
});

test('reduced-motion keeps the panorama opaque and responds immediately to preference changes',()=>{
 const f=fixture({withScenery:true,reducedMotion:true});
 assert.equal(f.values.get('--room-visibility'),'1');assert.equal(f.sceneryReads(),0);
 f.scenery(-131);f.browser.emit('scroll');f.flush();assert.equal(f.values.get('--room-visibility'),'1');assert.equal(f.sceneryReads(),0);
 f.media.matches=false;f.media.emit('change',{matches:false});f.flush();assert.equal(f.values.get('--room-visibility'),'0.58');
 f.media.matches=true;f.media.emit('change',{matches:true});f.flush();assert.equal(f.values.get('--room-visibility'),'1');
});

test('invalid panorama measurements return an opaque room rather than an invalid style',()=>{
 const f=fixture({withScenery:true});
 for(const [top,height]of [[NaN,600],[0,NaN],[0,0],[0,-30],[Infinity,600]]){
  f.scenery(top,height);f.browser.emit('scroll');f.flush();assert.equal(f.values.get('--room-visibility'),'1');
 }
 f.scenery(-131,600);f.controller.refresh();f.flush();assert.equal(f.values.get('--room-visibility'),'0.58');
});

test('header resizing adjusts the fade boundary while room controls retain their existing state',()=>{
 const f=fixture({withScenery:true}),dataset={...f.room.dataset};
 f.scenery(94);f.header(144);f.resizeHeader();f.flush();assert.equal(f.values.get('--room-visibility'),'0.971');
 assert.deepEqual(f.room.dataset,dataset);assert.equal(f.browser.scrollY,0);
});

test('the architectural fade eases at each boundary and retraces the same opacity when scrolling back',()=>{
 const f=fixture({withScenery:true});
 const samples=[[0,1],[.01,1],[.1,.976],[.25,.869],[.5,.58],[.75,.291],[.9,.184],[.99,.16],[1,.16]];
 for(const [progress,expected] of [...samples,...samples.toReversed()]){
  f.scenery(94-450*progress);f.browser.emit('scroll');f.flush();
  assert.equal(Number(f.values.get('--room-visibility')),expected);
  assert.equal(f.frames.size,0);
 }
 // There is no time-based settling after scroll stops or changes direction.
 const writes=f.writes.length;f.flush();assert.equal(f.writes.length,writes);
});


test('content reflow refreshes the reading boundary without a window resize',()=>{
 const f=fixture({withStage:true});
 f.stage(20);f.resizeStage();f.resizeStage();
 assert.equal(f.frames.size,1);f.flush();
 assert.equal(f.room.dataset.roomReading,'true');
 f.stage(900);f.resizeStage();f.flush();
 assert.equal(f.room.dataset.roomReading,'false');
});
test('a visual viewport resize refreshes the room boundary and stays suspended in the background',()=>{
 const f=fixture({withStage:true});
 f.stage(20);f.browser.visualViewport.emit('resize');f.flush();
 assert.equal(f.room.dataset.roomReading,'true');
 f.doc.hidden=true;f.doc.emit('visibilitychange');
 f.browser.visualViewport.emit('resize');f.resizeStage();
 assert.equal(f.frames.size,0);
});


test('category scroll separates the architectural fade from the retained glass and reverses exactly',()=>{
 const f=fixture({presentation:'directory',withScenery:true,withStage:true});
 const url=f.browser.location.href,focus=f.doc.activeElement;
 assert.equal(f.values.get('--room-approach'),'0');
 assert.equal(f.values.get('--room-wall-visibility'),'1');
 assert.equal(f.values.get('--room-glass-visibility'),'1');
 f.scenery(94-225);f.browser.scrollY=225;f.browser.emit('scroll');f.flush();
 assert.equal(f.values.get('--room-approach'),'0.5');
 assert.equal(f.values.get('--room-wall-visibility'),'0.5');
 assert.equal(f.values.get('--room-glass-visibility'),'0.925');
 assert.equal(f.roomWrites(),0,'Scroll variables must not invalidate the entire directory subtree');
 f.scenery(-2000);f.browser.scrollY=2000;f.browser.emit('scroll');f.flush();
 assert.equal(f.values.get('--room-approach'),'1');
 assert.equal(f.values.get('--room-wall-visibility'),'0');
 assert.equal(f.values.get('--room-glass-visibility'),'0.85');
 const writes=f.writes.length;f.browser.emit('scroll');f.flush();assert.equal(f.writes.length,writes);
 f.scenery(94-225);f.browser.scrollY=225;f.browser.emit('scroll');f.flush();
 assert.equal(f.values.get('--room-approach'),'0.5');
 assert.equal(f.values.get('--room-wall-visibility'),'0.5');
 assert.equal(f.browser.location.href,url);assert.equal(f.doc.activeElement,focus);
});
test('category reduced motion and invalid geometry restore an opaque unscaled room',()=>{
 const f=fixture({presentation:'directory',withScenery:true});
 f.scenery(-500);f.browser.emit('scroll');f.flush();
 f.media.matches=true;f.media.emit('change');f.flush();
 for(const [name,value]of [['--room-approach','0'],['--room-wall-visibility','1'],['--room-glass-visibility','1']])assert.equal(f.values.get(name),value);
 f.media.matches=false;f.scenery(NaN,0);f.media.emit('change');f.flush();
 assert.equal(f.values.get('--room-approach'),'0');assert.equal(f.values.get('--room-wall-visibility'),'1');
});
test('the split-room properties are not applied to homepage, detail or supporting scenes',()=>{
 for(const presentation of ['home','detail','support']){
  const f=fixture({presentation,withScenery:true});f.scenery(-500);f.browser.emit('scroll');f.flush();
  assert.equal(f.values.has('--room-approach'),false);
  assert.equal(f.values.has('--room-wall-visibility'),false);
  assert.equal(f.values.has('--room-glass-visibility'),false);
 }
});
