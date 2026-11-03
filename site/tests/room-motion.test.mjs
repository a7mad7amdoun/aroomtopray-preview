import test from 'node:test';
import assert from 'node:assert/strict';
import {roomPosture,initRoomMotion} from '../src/scripts/room-motion.js';
const target=()=>{const listeners=new Map();return{addEventListener(type,fn){const list=listeners.get(type)||[];list.push(fn);listeners.set(type,list);},emit(type){for(const fn of listeners.get(type)||[])fn();}};};
function fixture({reduced=false,saveData=false}={}){
 const doc=target(),browser=target(),media=target(),room={dataset:{roomPresentation:'home'}},values=new Map(),frames=new Map();let serial=0,guideTop=900,headerBottom=94,mode='list',observer;
 doc.documentElement={style:{setProperty:(key,value)=>values.set(key,value)}};
 doc.querySelector=selector=>selector==='.room-environment'?room:selector==='#guide-content'?{getBoundingClientRect:()=>({top:guideTop})}:selector==='.room-header'?{getBoundingClientRect:()=>({bottom:headerBottom})}:selector.startsWith('[data-directory-mode]')?{dataset:{directoryMode:mode}}:null;
 browser.scrollY=0;browser.matchMedia=()=>media;media.matches=reduced;browser.navigator={connection:{saveData}};
 browser.location=new URL('https://example.test/airports/?country=GB#room-details');
 browser.requestAnimationFrame=fn=>{frames.set(++serial,fn);return serial;};browser.cancelAnimationFrame=id=>frames.delete(id);
 browser.MutationObserver=class{constructor(fn){observer=fn;}observe(){}};
 browser.scrollTo=()=>assert.fail('Room motion must not scroll the page');doc.activeElement={id:'search'};
 const controller=initRoomMotion(doc,browser);
 const flush=()=>{const callbacks=[...frames.values()];frames.clear();for(const fn of callbacks)fn();};
 return{doc,browser,media,room,values,frames,controller,flush,guide:value=>guideTop=value,header:value=>headerBottom=value,mode:value=>mode=value,mutate:()=>observer()};
}
test('architecture yields for reading, a map, and practical detail pages',()=>{
 assert.equal(roomPosture(),'arrival');assert.equal(roomPosture({scrollY:181}),'reading');assert.equal(roomPosture({guideTop:150,headerBottom:100}),'reading');assert.equal(roomPosture({view:'map'}),'reading');assert.equal(roomPosture({presentation:'detail'}),'reading');
});
test('scroll work is coalesced and changes only the background state',()=>{
 const f=fixture(),url=f.browser.location.href,focus=f.doc.activeElement;f.browser.scrollY=400;
 for(let i=0;i<25;i++)f.browser.emit('scroll');assert.equal(f.frames.size,1);f.flush();
 assert.equal(f.room.dataset.roomPosture,'reading');assert.equal(f.browser.location.href,url);assert.equal(f.doc.activeElement,focus);assert.equal(f.browser.scrollY,400);
});
test('reduced motion and save-data disable architectural movement',()=>{
 for(const options of [{reduced:true},{saveData:true}]){const f=fixture(options);f.browser.scrollY=900;f.mode('map');f.browser.emit('scroll');f.flush();assert.equal(f.room.dataset.roomMotion,'off');assert.equal(f.room.dataset.roomPosture,'arrival');assert.equal(f.room.dataset.roomView,'list');}
});
test('the existing pause control freezes the room until resumed',()=>{
 const f=fixture();f.room.dataset.roomCycle='paused';f.mutate();f.flush();f.browser.scrollY=500;f.browser.emit('scroll');f.flush();assert.equal(f.room.dataset.roomPosture,'arrival');assert.equal(f.room.dataset.roomMotion,'paused');
 f.room.dataset.roomCycle='playing';f.mutate();f.flush();assert.equal(f.room.dataset.roomPosture,'reading');
});
test('header measurement follows wrapping and map selection follows existing events',()=>{
 const f=fixture();assert.equal(f.values.get('--room-header-height'),'94px');f.header(148);f.mode('map');f.doc.emit('directory:updated');f.flush();assert.equal(f.values.get('--room-header-height'),'148px');assert.equal(f.room.dataset.roomView,'map');f.mode('guide');f.doc.emit('directory:updated');f.flush();assert.equal(f.room.dataset.roomView,'guide');
});
test('pagehide cancels pending work and restored pages recalculate once',()=>{
 const f=fixture();f.browser.scrollY=500;f.browser.emit('scroll');f.browser.emit('pagehide');assert.equal(f.frames.size,0);f.browser.emit('scroll');assert.equal(f.frames.size,0);f.browser.emit('pageshow');f.flush();assert.equal(f.room.dataset.roomPosture,'reading');
});
test('preference changes take effect without navigation or lost focus',()=>{
 const f=fixture();f.browser.scrollY=500;f.browser.emit('scroll');f.flush();f.media.matches=true;f.media.emit('change');f.flush();assert.equal(f.room.dataset.roomMotion,'off');assert.equal(f.room.dataset.roomPosture,'arrival');assert.equal(f.doc.activeElement.id,'search');
});
test('initialization is idempotent and hidden documents do no work',()=>{
 const f=fixture();assert.equal(initRoomMotion(f.doc,f.browser),undefined);f.doc.hidden=true;f.browser.scrollY=500;f.browser.emit('scroll');f.flush();assert.equal(f.room.dataset.roomPosture,'arrival');f.doc.hidden=false;f.doc.emit('visibilitychange');f.flush();assert.equal(f.room.dataset.roomPosture,'reading');
});
