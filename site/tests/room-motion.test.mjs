import test from 'node:test';
import assert from 'node:assert/strict';
import {initRoomMotion} from '../src/scripts/room-motion.js';
const target=()=>{const listeners=new Map();return{addEventListener(type,fn){const list=listeners.get(type)||[];list.push(fn);listeners.set(type,list);},emit(type){for(const fn of listeners.get(type)||[])fn();}};};
function fixture(){
 const doc=target(),browser=target(),room={dataset:{roomPresentation:'home'}},values=new Map(),writes=[],frames=new Map();let serial=0,headerBottom=94,observer;
 const header={getBoundingClientRect:()=>({bottom:headerBottom})};
 doc.documentElement={style:{setProperty:(key,value)=>{values.set(key,value);writes.push([key,value]);}}};
 doc.querySelector=selector=>selector==='.room-environment'?room:selector==='.room-header'?header:null;
 browser.scrollY=0;
 browser.location=new URL('https://example.test/airports/?country=GB#room-details');
 browser.requestAnimationFrame=fn=>{frames.set(++serial,fn);return serial;};browser.cancelAnimationFrame=id=>frames.delete(id);
 browser.ResizeObserver=class{constructor(fn){observer=fn;}observe(element){assert.equal(element,header);}};
 browser.scrollTo=()=>assert.fail('Room alignment must not scroll the page');doc.activeElement={id:'search'};
 const controller=initRoomMotion(doc,browser);
 const flush=()=>{const callbacks=[...frames.values()];frames.clear();for(const fn of callbacks)fn();};
 return{doc,browser,room,values,writes,frames,controller,flush,header:value=>headerBottom=value,resizeHeader:()=>observer()};
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
