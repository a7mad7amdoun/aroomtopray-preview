import test from 'node:test';
import assert from 'node:assert/strict';
import { initRoomDoor, ROOM_PREVIEW_INTENT_DELAY } from '../src/scripts/room-door.js';
import { ROOM_CYCLE_DELAY } from '../src/lib/room-cycle.js';

function element(classes = []) {
  const tokens=new Set(classes), listeners=new Map(), attributes=new Map();
  return {
    dataset:{}, hidden:true, textContent:'', querySelector:()=>null,
    classList:{contains:name => tokens.has(name),toggle:(name,on) => on ? tokens.add(name) : tokens.delete(name)},
    setAttribute:(name,value) => attributes.set(name,value),
    getAttribute:name => attributes.get(name),
    toggleAttribute:(name,on) => on ? attributes.set(name,'') : attributes.delete(name),
    addEventListener(type,callback) { const list=listeners.get(type)||[];list.push(callback);listeners.set(type,list); },
    emit(type,values={}) {
      const event={target:this,button:0,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},...values};
      for(const callback of listeners.get(type)||[]) callback(event);
      return event;
    },
  };
}
function fixture(kind='home', route='/fr/', search='', {tour=false,reduced=false,saveData=false,six=false,photoImages={}}={}) {
  const room=element(),notices=element(),browser=element(),document=element(),sceneName=element(),sceneIcon=element();
  room.ownerDocument=document;
  document.hidden=false;
  const cycleControl=element(),cycleLabel=element(),cycleStatus=element(),media=element(),sceneCount=element();sceneCount.dataset={locale:'en',of:'of'};
  const navigation=element(),previous=element(),next=element();previous.dataset.homeSceneStep='-1';next.dataset.homeSceneStep='1';navigation.querySelectorAll=()=>[previous,next];
  cycleControl.dataset={startLabel:'Explorer les vues',pauseLabel:'Mettre en pause',resumeLabel:'Reprendre les vues',pausedMessage:'Paused',playingMessage:'Playing'};
  cycleControl.querySelector=()=>cycleLabel;
  room.contains=node=>node===cycleControl;
  media.matches=reduced;browser.matchMedia=()=>media;browser.navigator={connection:{saveData}};
  const timers=new Map();let serial=0;
  browser.setTimeout=(callback,delay)=>{assert.ok([ROOM_PREVIEW_INTENT_DELAY,ROOM_CYCLE_DELAY].includes(delay));timers.set(++serial,{callback,delay});return serial;};
  browser.clearTimeout=id=>timers.delete(id);
  const tick=()=>{assert.equal(timers.size,1);const [id,{callback}]=timers.entries().next().value;timers.delete(id);callback();};
  browser.location=new URL(`https://local.test${route}${search}`);
  const scene=kind==='home'?'airport':({airports:'airport',universities:'campus',hospitals:'hospital'})[kind];
  const outside=element([`outside-${scene}`]);
  room.dataset={roomSetting:kind,roomPresentation:kind==='home'?'home':'directory',roomPreview:scene};
  const links=[['airports','airport'],['universities','campus'],['hospitals','hospital']].map(([category,scene])=>{
    const link=element(),returnLabel=element();link.querySelector=()=>returnLabel;link.returnLabel=returnLabel;
    link.dataset={doorDestination:category,doorPreview:scene,sceneName:category,sceneIcon:scene==='hospital'?'care':scene,sceneLabel:`View outside: ${category}`,returnLabel:'Retrouver vos résultats'};
    link.setAttribute('href',`/fr/${category}/`);return link;
  });
  room.querySelector=selector=>({
    '.door-notices':notices,
    '[data-room-cycle]':tour?cycleControl:null,'[data-room-cycle-status]':cycleStatus,
    '[data-home-scene-controls]':navigation,
    '[data-home-scene-count]':sceneCount,
    '.door-outside':outside,'[data-room-scene-name]':sceneName,'[data-room-scene-icon]':sceneIcon,
  })[selector];
  const artNodes=six?['airport','campus','hospital','airport-2','campus-2','hospital-2'].map(id=>{const node=element();node.dataset.homeScene=id;node.dataset.sceneDescription=`Documentary photograph: ${id}`;node.querySelector=selector=>selector==='img'?photoImages[id]||null:null;return node;}):[];
  const photoCredits=artNodes.map(art=>{const node=element();node.dataset.homePhotoCredit=art.dataset.homeScene;node.textContent=`Photographer and licence: ${art.dataset.homeScene}`;return node;});
  room.querySelectorAll=selector=>({'[data-home-scene]':artNodes,'[data-home-photo-credit]':photoCredits,'[data-door-preview]':links,'[data-room-tour-interaction]':links})[selector]||[];
  initRoomDoor(room,browser);
  return {room,notices,links,outside,browser,document,sceneName,sceneIcon,timers,tick,cycleControl,cycleLabel,cycleStatus,media,artNodes,photoCredits,next,previous};
}

// Isolate direct notice interaction from automatic-tour behavior tested below.
const home=()=>fixture('home');

test('fixed glass initializes without an opening control, leaf state or delayed navigation',()=>{
 const f=home();
 assert.equal(f.room.dataset.doorState,undefined);assert.equal(f.room.dataset.doorArrival,undefined);
 assert.equal(f.room.dataset.doorMotion,undefined);assert.equal(f.room.dataset.doorReady,'true');
 assert.equal(f.notices.inert,undefined);assert.equal(f.notices.getAttribute('aria-hidden'),undefined);
 assert.equal(f.timers.size,0);
});
test('each category retains its own scene when other notices are focused or hovered',()=>{
 for(const [kind,scene]of [['airports','airport'],['universities','campus'],['hospitals','hospital']]){
  const f=fixture(kind);
  for(const link of f.links){link.emit('focus');link.emit('pointerenter');}
  assert.equal(f.room.dataset.roomPreview,scene);assert.equal(f.outside.classList.contains(`outside-${scene}`),true);
  assert.equal(f.room.dataset.doorState,undefined);assert.equal(f.timers.size,0);
 }
});
test('reinitializing keeps the chosen preview and binds one pause control',()=>{
 const f=fixture('home','/fr/','',{tour:true});f.links[1].emit('focus');
 initRoomDoor(f.room,f.browser);assert.equal(f.room.dataset.roomPreview,'campus');
 assert.equal(f.outside.classList.contains('outside-campus'),true);assert.equal(f.timers.size,1);
 f.cycleControl.emit('click');assert.equal(f.timers.size,0);assert.equal(f.room.dataset.roomCycle,'paused');
 f.cycleControl.emit('click');assert.equal(f.timers.size,1);assert.equal(f.room.dataset.roomCycle,'playing');
});
test('all notice links navigate immediately, including keyboard and modified activations',()=>{
  const f=home();
  for(const link of f.links) for(const options of [{},{detail:0},{ctrlKey:true},{metaKey:true},{shiftKey:true},{button:1}]) {
    assert.equal(link.emit('click',options).defaultPrevented,false);
    assert.equal(f.room.dataset.doorState,undefined);
  }
});
test('home preview changes the stationary outside scene; category previews keep their location',()=>{
  const f=home();f.links[1].emit('focus');
  assert.equal(f.outside.classList.contains('outside-campus'),true);
  assert.equal(f.outside.getAttribute('aria-label'),'View outside: universities');
  const g=fixture('hospitals');g.links[1].emit('pointerenter');
  assert.equal(g.outside.classList.contains('outside-hospital'),true);
});
test('back/forward preserves the chosen scene without redirecting or queuing an opening',()=>{
 const f=home(),url=f.browser.location.href;f.links[2].emit('focus');f.browser.emit('pagehide');f.browser.emit('pageshow',{persisted:true});
 assert.equal(f.room.dataset.roomPreview,'hospital');assert.equal(f.room.dataset.doorState,undefined);
 assert.equal(f.browser.location.href,url);assert.equal(f.timers.size,0);
});

test('current category notice retains the detail page’s safe browse context',()=>{
  const f=fixture('airports','/fr/airports/lhr/','?browse='+encodeURIComponent('q=London&country=GB&f=wudu&mode=map&airport=lhr'));
  assert.equal(f.links[0].getAttribute('href'),'/fr/airports/?q=London&country=GB&f=wudu&mode=map&airport=lhr');
  assert.equal(f.links[0].returnLabel.hidden,false);
  assert.equal(f.links[0].returnLabel.textContent,'Retrouver vos résultats');
  assert.equal(f.links[1].getAttribute('href'),'/fr/universities/');
});
test('changes to directory filters are picked up when a notice is activated',()=>{
  const f=fixture('airports','/fr/airports/','?q=London&country=GB');
  f.browser.location.search='?country=MA&mode=map';
  assert.equal(f.links[0].emit('click',{ctrlKey:true}).defaultPrevented,false);
  assert.equal(f.links[0].getAttribute('href'),'/fr/airports/?country=MA&mode=map');
  assert.equal(f.links[0].returnLabel.hidden,true);
});
test('directory and atlas document events proactively update the current destination only',()=>{
  const f=fixture('airports','/fr/airports/','?country=GB');
  // A second init must not capture the already enriched href as its base path.
  initRoomDoor(f.room,f.browser);
  f.browser.location.search='?q=London&country=GB&f=wudu&sort=name&mode=map&page=2';
  f.document.emit('directory:updated');
  assert.equal(f.links[0].getAttribute('href'),'/fr/airports/?q=London&country=GB&f=wudu&mode=map&sort=name&page=2');
  f.browser.location.search+='&airport=lhr';f.document.emit('atlas:selection');
  assert.equal(f.links[0].getAttribute('href'),'/fr/airports/?q=London&country=GB&f=wudu&mode=map&sort=name&page=2&airport=lhr');
  assert.equal(f.links[1].getAttribute('href'),'/fr/universities/');assert.equal(f.links[2].getAttribute('href'),'/fr/hospitals/');
  assert.equal(f.room.dataset.roomPreview,'airport');assert.equal(f.links[0].returnLabel.hidden,true);
  assert.equal(f.links[0].emit('click',{metaKey:true}).defaultPrevented,false);
});
test('history changes refresh the detail return link and label without changing the scene',()=>{
  const f=fixture('airports','/fr/airports/lhr/','?browse='+encodeURIComponent('country=GB&mode=map&airport=lhr'));
  f.browser.location.search='?browse='+encodeURIComponent('country=FR&mode=list&page=2');f.browser.emit('popstate');
  assert.equal(f.links[0].getAttribute('href'),'/fr/airports/?country=FR&mode=list&page=2');assert.equal(f.links[0].returnLabel.hidden,false);
  f.browser.location.search='';f.browser.emit('popstate');
  assert.equal(f.links[0].getAttribute('href'),'/fr/airports/');assert.equal(f.links[0].returnLabel.hidden,true);assert.equal(f.links[0].returnLabel.textContent,'');
  assert.equal(f.room.dataset.roomPreview,'airport');
});


test('home previews keep the visible caption and highlighted notice in sync',()=>{
 const f=home();
 f.links[1].emit('focus');
 assert.equal(f.sceneName.textContent,'universities');
 assert.equal(f.sceneIcon.getAttribute('href'),'#i-campus');
 assert.equal(f.room.dataset.roomPreview,'campus');
 assert.equal(f.links[1].getAttribute('data-previewed'),'');
 f.links[2].emit('pointerenter');f.tick();
 assert.equal(f.sceneName.textContent,'hospitals');
 assert.equal(f.sceneIcon.getAttribute('href'),'#i-care');
 assert.equal(f.links[1].getAttribute('data-previewed'),undefined);
 assert.equal(f.links[2].getAttribute('data-previewed'),'');
});

test('a deliberate hover previews a home notice behind fixed glass without navigating',()=>{
 const f=home();const href=f.links[1].getAttribute('href');
 f.links[1].emit('pointerenter',{pointerType:'mouse'});
 assert.equal(ROOM_PREVIEW_INTENT_DELAY,120);assert.equal(f.timers.size,1);
 assert.equal(f.outside.classList.contains('outside-airport'),true);
 assert.equal(f.room.dataset.roomPreview,'airport');
 f.tick();assert.equal(f.room.dataset.roomPreview,'campus');assert.equal(f.timers.size,0);
 assert.equal(f.room.dataset.doorState,undefined);assert.equal(f.links[1].getAttribute('href'),href);
});
test('crossing notices, touch, pointer activation and leaving the page do not queue scenery changes',()=>{
 for(const cancel of ['pointerleave','pointercancel','pointerdown','click','pagehide']){
  const f=home();f.links[1].emit('pointerenter');assert.equal(f.timers.size,1);
  const event=(cancel==='pagehide'?f.browser:f.links[1]).emit(cancel);
  assert.equal(f.timers.size,0);assert.equal(f.room.dataset.roomPreview,'airport');
  assert.equal(event.defaultPrevented,false);
 }
 const f=home();f.links[1].emit('pointerenter',{pointerType:'touch'});
 assert.equal(f.timers.size,0);assert.equal(f.room.dataset.roomPreview,'airport');
 f.links[1].emit('pointerenter');f.links[1].emit('pointerleave');f.links[2].emit('pointerenter');
 assert.equal(f.timers.size,1);f.tick();assert.equal(f.room.dataset.roomPreview,'hospital');
 f.browser.emit('pagehide');f.browser.emit('pageshow',{persisted:true});assert.equal(f.timers.size,0);
});
test('switching tabs cancels hover intent and never replays a stale scene on return',()=>{
 const f=home();f.links[1].emit('pointerenter');assert.equal(f.timers.size,1);
 f.document.hidden=true;f.document.emit('visibilitychange');
 assert.equal(f.timers.size,0);assert.equal(f.room.dataset.roomPreview,'airport');
 f.links[2].emit('pointerenter');assert.equal(f.timers.size,0);
 f.document.hidden=false;f.document.emit('visibilitychange');
 assert.equal(f.timers.size,0);assert.equal(f.room.dataset.roomPreview,'airport');
 f.links[2].emit('pointerenter');f.tick();assert.equal(f.room.dataset.roomPreview,'hospital');
});
test('an already queued hover callback cannot change scenery in a hidden document',()=>{
 const f=home();f.links[1].emit('pointerenter');assert.equal(f.timers.size,1);
 // A visibility update and an already queued timer may be delivered in either order.
 f.document.hidden=true;f.tick();
 assert.equal(f.room.dataset.roomPreview,'airport');assert.equal(f.timers.size,0);
});
test('keyboard focus previews immediately and cancels a pending pointer preview',()=>{
 const f=home();f.links[1].emit('pointerenter');assert.equal(f.timers.size,1);
 f.links[2].emit('focus');assert.equal(f.room.dataset.roomPreview,'hospital');assert.equal(f.timers.size,0);
 assert.equal(f.sceneName.textContent,'hospitals');assert.equal(f.sceneIcon.getAttribute('href'),'#i-care');
 assert.equal(f.links[2].emit('click',{detail:0}).defaultPrevented,false);
});
test('activating a notice during its intent delay never prevents or defers native navigation',()=>{
 for(const options of [{},{ctrlKey:true},{metaKey:true},{shiftKey:true},{button:1}]){
  const f=home();const link=f.links[1],href=link.getAttribute('href');
  link.emit('pointerenter');assert.equal(f.timers.size,1);
  assert.equal(link.emit('pointerdown',options).defaultPrevented,false);
  assert.equal(link.emit('click',options).defaultPrevented,false);
  assert.equal(f.timers.size,0);assert.equal(link.getAttribute('href'),href);
  assert.equal(f.room.dataset.doorState,undefined);assert.equal(f.room.dataset.roomPreview,'airport');
 }
});

test('homepage scenery starts automatically and advances all three views without changing the URL',()=>{
 const f=fixture('home','/fr/','?q=London',{tour:true}),url=f.browser.location.href;
 assert.equal(f.room.dataset.doorState,undefined);assert.equal(f.room.dataset.roomCycle,'playing');
 assert.equal(f.cycleLabel.textContent,'Mettre en pause');assert.equal(f.cycleStatus.textContent,'');
 assert.equal(f.timers.size,1);assert.equal(f.timers.values().next().value.delay,ROOM_CYCLE_DELAY);
 for(const [scene,label,icon]of [['campus','universities','campus'],['hospital','hospitals','care'],['airport','airports','airport']]){
  f.tick();assert.equal(f.room.dataset.roomPreview,scene);assert.equal(f.outside.classList.contains(`outside-${scene}`),true);
  assert.equal(f.sceneName.textContent,label);assert.equal(f.sceneIcon.getAttribute('href'),`#i-${icon}`);
  assert.equal(f.timers.size,1);assert.equal(f.cycleStatus.textContent,'');
 }
 assert.equal(f.browser.location.href,url);
});
test('pausing the homepage preserves its scene through restoration until explicitly resumed',()=>{
 const f=fixture('home','/fr/','',{tour:true});f.tick();
 f.cycleControl.emit('click');assert.equal(f.timers.size,0);assert.equal(f.cycleLabel.textContent,'Reprendre les vues');
 f.browser.emit('pagehide');f.browser.emit('pageshow',{persisted:true});
 assert.equal(f.timers.size,0);assert.equal(f.room.dataset.roomPreview,'campus');
 f.cycleControl.emit('click');assert.equal(f.timers.size,1);assert.equal(f.cycleLabel.textContent,'Mettre en pause');
 f.tick();assert.equal(f.room.dataset.roomPreview,'hospital');assert.equal(f.room.dataset.doorState,undefined);
});
test('reduced-motion and data-saving visitors opt into a fixed-glass tour explicitly',()=>{
 for(const options of [{reduced:true},{saveData:true}]){
  const f=fixture('home','/fr/','',{tour:true,...options});
  f.browser.emit('pageshow');f.document.emit('visibilitychange');
  assert.equal(f.timers.size,0);assert.equal(f.cycleLabel.textContent,'Explorer les vues');
  f.room.emit('focusin');f.cycleControl.emit('click');assert.equal(f.timers.size,1);
  f.tick();assert.equal(f.room.dataset.roomPreview,'campus');assert.equal(f.room.dataset.doorState,undefined);
  f.media.emit('change',{matches:true});assert.equal(f.timers.size,0);assert.equal(f.cycleLabel.textContent,'Reprendre les vues');
 }
});
test('intentional notice hover suspends the tour while leaving activation native',()=>{
 const f=fixture('home','/fr/','',{tour:true}),link=f.links[2],href=link.getAttribute('href');
 link.emit('pointerenter',{pointerType:'mouse'});
 assert.equal(f.timers.size,1);assert.equal(f.timers.values().next().value.delay,ROOM_PREVIEW_INTENT_DELAY);
 f.tick();assert.equal(f.room.dataset.roomPreview,'hospital');assert.equal(f.timers.size,0);
 assert.equal(link.emit('click',{metaKey:true}).defaultPrevented,false);assert.equal(link.getAttribute('href'),href);
 link.emit('pointerleave');assert.equal(f.timers.size,1);assert.equal(f.timers.values().next().value.delay,ROOM_CYCLE_DELAY);
});
test('header hover immediately previews category and restores the precise prior artwork on leave',()=>{
 const f=fixture('home','/fr/','?q=London',{tour:true,six:true}),url=f.browser.location.href;
 f.tick();f.tick();f.tick();assert.equal(f.room.dataset.roomScene,'airport-2');
 f.document.emit('room:destination-preview',{detail:{scene:'campus',source:'header'}});
 assert.equal(f.room.dataset.roomScene,'campus');assert.equal(f.timers.size,0);
 assert.deepEqual(f.artNodes.filter(node=>node.dataset.active==='true').map(node=>node.dataset.homeScene),['campus']);
 assert.deepEqual(f.photoCredits.filter(node=>!node.hidden).map(node=>node.dataset.homePhotoCredit),['campus']);
 assert.equal(f.outside.getAttribute('aria-label'),'Documentary photograph: campus');
 f.document.emit('room:destination-preview',{detail:{scene:'hospital',source:'header'}});
 assert.equal(f.room.dataset.roomPreview,'hospital');
 f.document.emit('room:destination-preview',{detail:{scene:null,source:'header'}});
 assert.equal(f.room.dataset.roomScene,'airport-2');assert.equal(f.timers.size,1);assert.equal(f.browser.location.href,url);
 assert.deepEqual(f.photoCredits.filter(node=>!node.hidden).map(node=>node.dataset.homePhotoCredit),['airport-2']);
 assert.equal(f.outside.getAttribute('aria-label'),'Documentary photograph: airport-2');
 f.tick();assert.equal(f.room.dataset.roomScene,'campus-2');
});
test('manual navigation keeps one matching attribution and accessible photo identity through all six views',()=>{
 const f=fixture('home','/fr/','',{tour:true,six:true});
 for(const id of ['airport','campus','hospital','airport-2','campus-2','hospital-2','airport']){
  assert.equal(f.room.dataset.roomScene,id);
  assert.deepEqual(f.artNodes.filter(node=>node.dataset.active==='true').map(node=>node.dataset.homeScene),[id]);
  assert.deepEqual(f.photoCredits.filter(node=>!node.hidden).map(node=>node.dataset.homePhotoCredit),[id]);
  assert.equal(f.outside.getAttribute('aria-label'),`Documentary photograph: ${id}`);
  f.next.emit('click');
 }
 assert.equal(f.timers.size,0,'Manual choice pauses the automatic tour');
});
test('header events cannot replace category photography or restart a paused home tour',()=>{
 const category=fixture('airports');category.document.emit('room:destination-preview',{detail:{scene:'hospital',source:'header'}});
 assert.equal(category.room.dataset.roomPreview,'airport');
 const f=fixture('home','/fr/','',{tour:true,six:true,reduced:true});
 f.document.emit('room:destination-preview',{detail:{scene:'hospital',source:'header'}});
 assert.equal(f.room.dataset.roomPreview,'hospital');assert.equal(f.timers.size,0);
 f.document.emit('room:destination-preview',{detail:{scene:null,source:'header'}});
 assert.equal(f.room.dataset.roomPreview,'airport');assert.equal(f.timers.size,0);
});
test('manual artwork navigation during a header preview is not undone on menu exit',()=>{
 const f=fixture('home','/fr/','',{tour:true,six:true});
 f.document.emit('room:destination-preview',{detail:{scene:'campus',source:'header'}});
 f.next.emit('click');assert.equal(f.room.dataset.roomScene,'hospital');assert.equal(f.timers.size,0);
 f.document.emit('room:destination-preview',{detail:{scene:null,source:'header'}});
 assert.equal(f.room.dataset.roomScene,'hospital');assert.equal(f.timers.size,0);
});
test('header preview cancels a queued notice preview and hidden tabs restore the original scene',()=>{
 const f=fixture('home','/fr/','',{tour:true,six:true});
 f.links[1].emit('pointerenter');
 f.document.emit('room:destination-preview',{detail:{scene:'hospital',source:'header'}});
 assert.equal(f.timers.size,0);assert.equal(f.room.dataset.roomScene,'hospital');
 f.document.hidden=true;f.document.emit('visibilitychange');assert.equal(f.room.dataset.roomScene,'airport');
 f.document.hidden=false;f.document.emit('visibilitychange');
 // The lower notice is still hovered, so it continues to hold the tour.
 f.links[1].emit('pointerleave');assert.equal(f.timers.size,1);
});

function deferredPhoto(){
 let resolve,reject,calls=0;
 const pending=new Promise((yes,no)=>{resolve=yes;reject=no;});
 return {complete:true,naturalWidth:1600,decode(){calls++;return pending;},resolve,reject,get calls(){return calls;}};
}
const settlePhotos=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};
const visiblePhoto=(f,id)=>{
 assert.equal(f.room.dataset.roomScene,id);
 assert.deepEqual(f.artNodes.filter(node=>node.dataset.active==='true').map(node=>node.dataset.homeScene),[id]);
 assert.deepEqual(f.photoCredits.filter(node=>!node.hidden).map(node=>node.dataset.homePhotoCredit),[id]);
 assert.equal(f.outside.getAttribute('aria-label'),`Documentary photograph: ${id}`);
};
test('rapid Next preserves the last decoded photo and advances intent despite out-of-order bitmap completion',async()=>{
 const campus=deferredPhoto(),hospital=deferredPhoto();
 const f=fixture('home','/fr/','',{tour:true,six:true,photoImages:{campus,hospital}});
 f.next.emit('click');f.next.emit('click');
 assert.equal(f.room.dataset.roomRequestedScene,'hospital');visiblePhoto(f,'airport');
 await settlePhotos();assert.equal(campus.calls,1);assert.equal(hospital.calls,1);
 assert.equal(campus.loading,'eager');
 hospital.resolve();await settlePhotos();visiblePhoto(f,'hospital');
 campus.resolve();await settlePhotos();visiblePhoto(f,'hospital');
 f.previous.emit('click');visiblePhoto(f,'campus');
 assert.equal(campus.calls,1,'A successfully decoded image is reused synchronously');
});
test('failed bitmap decoding preserves visible attribution and lets the next request recover',async()=>{
 const campus=deferredPhoto();
 const f=fixture('home','/fr/','',{tour:true,six:true,photoImages:{campus}});
 f.next.emit('click');await settlePhotos();campus.reject(new Error('Cannot decode'));await settlePhotos();
 visiblePhoto(f,'airport');assert.equal(f.room.dataset.roomRequestedScene,'airport');
 f.previous.emit('click');visiblePhoto(f,'hospital-2');
});
test('leaving a header preview invalidates its pending decode and restores pending manual intent',async()=>{
 const campus=deferredPhoto(),hospital=deferredPhoto();
 const f=fixture('home','/fr/','',{tour:true,six:true,photoImages:{campus,hospital}});
 f.next.emit('click');
 f.document.emit('room:destination-preview',{detail:{scene:'hospital',source:'header'}});
 f.document.emit('room:destination-preview',{detail:{scene:null,source:'header'}});
 assert.equal(f.room.dataset.roomRequestedScene,'campus');visiblePhoto(f,'airport');
 hospital.resolve();await settlePhotos();visiblePhoto(f,'airport');
 campus.resolve();await settlePhotos();visiblePhoto(f,'campus');
 assert.equal(campus.calls,1);
});
test('manual photo announcements wait for the matching decoded count and respect newer pause messages',async()=>{
 const campus=deferredPhoto(),hospital=deferredPhoto();
 const f=fixture('home','/fr/','',{tour:true,six:true,photoImages:{campus,hospital}});
 f.next.emit('click');assert.equal(f.cycleStatus.textContent,'');
 campus.resolve();await settlePhotos();
 assert.equal(f.cycleStatus.textContent,'2 of 6 · universities');
 f.next.emit('click');assert.equal(f.cycleStatus.textContent,'2 of 6 · universities');
 hospital.reject(new Error('Unavailable'));await settlePhotos();
 assert.equal(f.cycleStatus.textContent,'2 of 6 · universities');
 const other=deferredPhoto();
 const g=fixture('home','/fr/','',{tour:true,six:true,photoImages:{campus:other}});
 g.next.emit('click');g.cycleControl.emit('click');g.cycleControl.emit('click');
 assert.equal(g.cycleStatus.textContent,'Paused');
 other.resolve();await settlePhotos();visiblePhoto(g,'campus');
 assert.equal(g.cycleStatus.textContent,'Paused');
});
