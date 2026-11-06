import test from 'node:test';
import assert from 'node:assert/strict';
import {initRoomGallery} from '../src/scripts/room-gallery.js';
import {ROOM_GALLERIES} from '../src/data/room-gallery.js';
import {existsSync} from 'node:fs';
const element=(dataset={})=>({dataset,attributes:{},listeners:{},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,fn){this.listeners[k]=fn;},emit(k,event={}){this.listeners[k]?.(event);},contains(){return false;}});
function setup({reduced=false}={}) {
 const root=element(),controls=element(),pause=element({playLabel:'Play',pauseLabel:'Pause'}),count=element({locale:'en',of:'of'}),announce=element(),next=element({roomPhotoStep:'1'}),previous=element({roomPhotoStep:'-1'});
 const slides=[0,1,2].map(i=>({...element(),alt:`Photo ${i}`})),credits=[element(),element(),element()];
 controls.querySelector=s=>({'[data-room-photo-pause]':pause,'[data-room-photo-count]':count,'[data-room-photo-announcement]':announce}[s]);
 controls.querySelectorAll=()=>[previous,next];
 const host={querySelector:s=>s==='[data-room-gallery-controls]'?controls:null,querySelectorAll:()=>credits};
 root.closest=()=>host;root.querySelectorAll=()=>slides;
 const browser=element(),doc=element(),media=element(),timers=new Map();let id=0,intersection;
 media.matches=reduced;browser.matchMedia=()=>media;
 browser.setTimeout=fn=>{timers.set(++id,fn);return id;};browser.clearTimeout=id=>timers.delete(id);
 browser.IntersectionObserver=class{constructor(fn){intersection=fn;}observe(){}};
 const controller=initRoomGallery(root,browser,doc);
 return{root,controls,pause,count,announce,next,previous,slides,credits,browser,doc,media,timers,controller,visible:value=>intersection([{isIntersecting:value}]),tick:()=>{const [key,fn]=timers.entries().next().value;timers.delete(key);fn();}};
}
test('gallery advances only while visible and pairs every slide with its credit',()=>{
 const f=setup();assert.equal(f.count.textContent,'1 of 3');assert.equal(f.timers.size,0);
 f.visible(true);assert.equal(f.timers.size,1);f.tick();
 assert.equal(f.slides[1].dataset.active,'true');assert.equal(f.slides[0].attributes['aria-hidden'],'true');
 assert.deepEqual(f.credits.map(c=>c.hidden),[true,false,true]);assert.equal(f.count.textContent,'2 of 3');
 assert.equal(f.announce.textContent,undefined,'Autoplay must not repeatedly announce');
 f.visible(false);assert.equal(f.timers.size,0);
});
test('manual navigation wraps, announces and pauses automatic movement',()=>{
 const f=setup();f.visible(true);f.previous.emit('click');assert.equal(f.count.textContent,'3 of 3');
 assert.match(f.announce.textContent,/Photo 2/);assert.equal(f.timers.size,0);
 f.next.emit('click');assert.equal(f.count.textContent,'1 of 3');
 f.pause.emit('click');assert.equal(f.timers.size,1);
});
test('reduced motion preserves manual browsing without an autoplay control',()=>{
 const f=setup({reduced:true});f.visible(true);assert.equal(f.timers.size,0);assert.equal(f.pause.hidden,true);
 f.next.emit('click');assert.equal(f.count.textContent,'2 of 3');assert.equal(f.timers.size,0);
 f.media.matches=false;f.media.emit('change');assert.equal(f.pause.hidden,false);assert.equal(f.timers.size,0,'Manual pause survives preference changes');
});
test('background tabs, page exit, keyboard focus and hover suspend playback',()=>{
 const f=setup();f.visible(true);f.controls.emit('focusin');assert.equal(f.timers.size,0);
 f.controls.emit('focusout');assert.equal(f.timers.size,1);
 f.controls.emit('pointerenter');assert.equal(f.timers.size,0);f.controls.emit('pointerleave');assert.equal(f.timers.size,1);
 f.doc.hidden=true;f.doc.emit('visibilitychange');assert.equal(f.timers.size,0);
 f.doc.hidden=false;f.doc.emit('visibilitychange');assert.equal(f.timers.size,1);
 f.browser.emit('pagehide');assert.equal(f.timers.size,0);f.browser.emit('pageshow');assert.equal(f.timers.size,1);
 assert.equal(initRoomGallery(f.root,f.browser,f.doc),undefined);
});
test('all categories have three locally available attributed photographs shared across themes',()=>{
 assert.deepEqual(Object.keys(ROOM_GALLERIES).sort(),['airport','campus','hospital']);
 for(const photos of Object.values(ROOM_GALLERIES)){
  assert.equal(photos.length,3);
  for(const photo of photos){
   assert.ok(photo.title&&photo.author&&photo.date&&photo.license);
   assert.equal(new URL(photo.source).protocol,'https:');
   assert.equal(new URL(photo.licenseUrl).protocol,'https:');
   assert.ok(!photo.darkBase&&!photo.lightBase,'One photograph, not a synthetic night counterpart');
   for(const width of photo.widths)assert.ok(existsSync(new URL(`../public${photo.base}-${width}.webp`,import.meta.url)),`${photo.base}-${width}`);
  }
 }
});
test('an already queued timer cannot advance a photograph after the document becomes hidden',()=>{
 const f=setup();f.visible(true);const queued=[...f.timers.values()][0];
 f.doc.hidden=true;f.doc.emit('visibilitychange');queued();
 assert.equal(f.count.textContent,'1 of 3');assert.equal(f.timers.size,0);
});
test('explicit play works with retained keyboard focus and later interaction pauses again',()=>{
 const f=setup();f.visible(true);f.next.emit('click');f.controls.emit('focusin');
 f.pause.emit('click');assert.equal(f.timers.size,1);f.tick();assert.equal(f.count.textContent,'3 of 3');
 f.controls.emit('focusin');assert.equal(f.timers.size,0);
});
test('turning reduced motion off does not silently restart playback or remove focused controls',()=>{
 const f=setup();f.visible(true);f.doc.activeElement=f.pause;
 f.media.matches=true;f.media.emit('change');assert.equal(f.timers.size,0);
 assert.equal(f.pause.hidden,false);assert.equal(f.pause.disabled,true);
 f.media.matches=false;f.media.emit('change');assert.equal(f.timers.size,0);assert.equal(f.pause.disabled,false);
 f.pause.emit('click');assert.equal(f.timers.size,1);
});
test('a canceled gallery callback cannot shorten the fresh delay after returning to the page',()=>{
 const f=setup();f.visible(true);const stale=[...f.timers.values()][0];
 f.doc.hidden=true;f.doc.emit('visibilitychange');f.doc.hidden=false;f.doc.emit('visibilitychange');
 stale();assert.equal(f.count.textContent,'1 of 3');assert.equal(f.timers.size,1);
 f.tick();assert.equal(f.count.textContent,'2 of 3');
});
