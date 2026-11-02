import test from 'node:test';
import assert from 'node:assert/strict';
import { initRoomFocus, ROOM_FOCUS_KEY } from '../src/scripts/room-focus.js';
function fixture({saved,blocked=false}={}) {
 let focus=null,scrolled=null;
 const storage=new Map(saved===undefined?[]:[[ROOM_FOCUS_KEY,String(saved)]]);
 const element=name=>({hidden:true,dataset:{},attributes:new Map(),listeners:{},setAttribute(k,v){this.attributes.set(k,v)},getAttribute(k){return this.attributes.get(k)},addEventListener(event,fn){this.listeners[event]=fn},click(){this.listeners.click()},focus(){focus=name},scrollIntoView(options){scrolled={name,options}}});
 const root=element('root'),enter=element('enter'),exit=element('exit'),switcher=element('switcher'),main=element('main'),room=element('room'),door=element('door');
 const browser=element('browser');
 Object.defineProperty(browser,'sessionStorage',{get(){if(blocked)throw new Error('Storage unavailable');return {getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)}}});
 const doc={documentElement:root,querySelector:selector=>({'[data-room-view-switch]':switcher,'[data-room-focus-enter]':enter,'[data-room-focus-exit]':exit,'#main':main,'#prayer-room':room,'[data-door-toggle]':door})[selector]};
 initRoomFocus(doc,browser);
 return {root,enter,exit,switcher,main,room,browser,storage,get focus(){return focus},get scrolled(){return scrolled}};
}
test('room is the default and both view choices are available without focus theft',()=>{
 const f=fixture();assert.equal(f.root.dataset.roomFocus,'false');assert.equal(f.switcher.hidden,false);assert.equal(f.room.hidden,false);assert.equal(f.exit.getAttribute('aria-pressed'),'true');assert.equal(f.enter.getAttribute('aria-pressed'),'false');assert.equal(f.focus,null);
});
test('guide hides the room and puts keyboard focus in the unchanged guide',()=>{
 const f=fixture();f.main.dataset.query='London';f.enter.click();assert.equal(f.root.dataset.roomFocus,'true');assert.equal(f.room.hidden,true);assert.equal(f.focus,'main');assert.equal(f.scrolled.name,'main');assert.equal(f.main.dataset.query,'London');assert.equal(f.enter.getAttribute('aria-pressed'),'true');assert.equal(f.exit.getAttribute('aria-pressed'),'false');assert.equal(f.storage.get(ROOM_FOCUS_KEY),'true');
});
test('room restores the doorway and saves the explicit room choice',()=>{
 const f=fixture({saved:true});f.exit.click();assert.equal(f.root.dataset.roomFocus,'false');assert.equal(f.room.hidden,false);assert.equal(f.focus,'door');assert.equal(f.scrolled.name,'room');assert.equal(f.scrolled.options.behavior,'instant');assert.equal(f.storage.get(ROOM_FOCUS_KEY),'false');
});
test('the current session preference is restored on another page without moving focus',()=>{
 for(const saved of [true,false]) {const f=fixture({saved});assert.equal(f.root.dataset.roomFocus,String(saved));assert.equal(f.room.hidden,saved);assert.equal(f.focus,null);assert.equal(f.switcher.hidden,false);}
});
test('back-forward cache uses the latest session choice and keeps controls synchronized',()=>{
 const f=fixture();f.storage.set(ROOM_FOCUS_KEY,'true');f.browser.listeners.pageshow();assert.equal(f.root.dataset.roomFocus,'true');assert.equal(f.enter.getAttribute('aria-pressed'),'true');assert.equal(f.room.hidden,true);assert.equal(f.focus,null);
});
test('blocked storage still allows both modes and page restoration',()=>{
 const f=fixture({blocked:true});f.enter.click();f.browser.listeners.pageshow();assert.equal(f.root.dataset.roomFocus,'true');assert.equal(f.room.hidden,true);f.exit.click();assert.equal(f.root.dataset.roomFocus,'false');assert.equal(f.room.hidden,false);
});
test('old v1 behavior does not control the new explicit experience switch',()=>{
 assert.equal(ROOM_FOCUS_KEY,'aroomtopray.focus.v2');
});
