import test from 'node:test';
import assert from 'node:assert/strict';
import { initRoomFocus, ROOM_FOCUS_KEY } from '../src/scripts/room-focus.js';

function fixture({saved=false,blocked=false}={}) {
 let focus=null,scrolled=null;
 const storage=new Map(saved?[[ROOM_FOCUS_KEY,'true']]:[]);
 const element=name=>({hidden:true,dataset:{},listeners:{},addEventListener(event,fn){this.listeners[event]=fn},click(){this.listeners.click()},focus(){focus=name},scrollIntoView(options){scrolled={name,options}}});
 const root=element('root'),enter=element('enter'),exit=element('exit'),toolbar=element('toolbar'),main=element('main'),room=element('room'),door=element('door');
 if(saved)root.dataset.roomFocus='true';
 const browser=element('browser');
 Object.defineProperty(browser,'sessionStorage',{get(){if(blocked)throw new Error('Storage unavailable');return {getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)}}});
 const doc={documentElement:root,querySelector:selector=>({'[data-room-focus-enter]':enter,'[data-room-focus-exit]':exit,'[data-room-focus-toolbar]':toolbar,'#main':main,'#prayer-room':room,'[data-door-toggle]':door})[selector]};
 initRoomFocus(doc,browser);
 return {root,enter,exit,toolbar,browser,storage,get focus(){return focus},get scrolled(){return scrolled}};
}

test('focus mode is optional and does not take keyboard focus on load',()=>{
 const f=fixture();assert.equal(f.root.dataset.roomFocus,'false');assert.equal(f.enter.hidden,false);assert.equal(f.toolbar.hidden,true);assert.equal(f.focus,null);
});
test('enter and restore keep keyboard focus in the visible interface',()=>{
 const f=fixture();f.enter.click();assert.equal(f.root.dataset.roomFocus,'true');assert.equal(f.toolbar.hidden,false);assert.equal(f.focus,'exit');assert.equal(f.storage.has(ROOM_FOCUS_KEY),false);
 f.exit.click();assert.equal(f.root.dataset.roomFocus,'false');assert.equal(f.toolbar.hidden,true);assert.equal(f.focus,'door');assert.equal(f.scrolled.name,'room');assert.equal(f.scrolled.options.block,'start');assert.equal(f.storage.has(ROOM_FOCUS_KEY),false);assert.equal(f.scrolled.options.behavior,'instant');
});
test('a stale saved preference cannot hide the room on a fresh page',()=>{
 const f=fixture({saved:true});assert.equal(f.root.dataset.roomFocus,'false');assert.equal(f.toolbar.hidden,true);assert.equal(f.focus,null);assert.equal(f.storage.has(ROOM_FOCUS_KEY),false);
 assert.equal(f.exit.hidden,false);
 f.browser.listeners.pageshow();assert.equal(f.root.dataset.roomFocus,'false');
});
test('back-forward restoration keeps an explicit focus choice on that page',()=>{
 const f=fixture();f.enter.click();f.browser.listeners.pageshow();assert.equal(f.root.dataset.roomFocus,'true');assert.equal(f.toolbar.hidden,false);
});
test('the header control brings the visible doorway into view without hiding it',()=>{
 const f=fixture();f.exit.click();assert.equal(f.root.dataset.roomFocus,'false');assert.equal(f.focus,'door');assert.equal(f.scrolled.name,'room');
});
test('both controls still work when storage is blocked',()=>{
 const f=fixture({blocked:true});f.enter.click();f.browser.listeners.pageshow();assert.equal(f.root.dataset.roomFocus,'true');assert.equal(f.toolbar.hidden,false);
 f.exit.click();assert.equal(f.root.dataset.roomFocus,'false');
});
