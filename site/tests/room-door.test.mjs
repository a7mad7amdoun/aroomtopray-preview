import test from 'node:test';
import assert from 'node:assert/strict';
import { initRoomDoor, ROOM_PREVIEW_INTENT_DELAY } from '../src/scripts/room-door.js';
import { ROOM_CYCLE_DELAY } from '../src/lib/room-cycle.js';

function element(classes = []) {
  const tokens=new Set(classes), listeners=new Map(), attributes=new Map();
  return {
    dataset:{}, hidden:true, querySelector:()=>null,
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
function fixture(kind='home', route='/fr/', search='', doorState='open', {tour=false,reduced=false}={}) {
  const room=element(),control=element(),label=element(),notices=element(),browser=element(),document=element(),sceneName=element(),sceneIcon=element();
  room.ownerDocument=document;
  document.hidden=false;
  const cycleControl=element(),cycleLabel=element(),cycleStatus=element(),media=element();
  cycleControl.dataset={startLabel:'Explorer les vues',pauseLabel:'Mettre en pause',resumeLabel:'Reprendre les vues',pausedMessage:'Paused',playingMessage:'Playing'};
  cycleControl.querySelector=()=>cycleLabel;
  room.contains=node=>node===control||node===cycleControl;
  media.matches=reduced;browser.matchMedia=()=>media;
  const timers=new Map();let serial=0;
  browser.setTimeout=(callback,delay)=>{assert.ok([ROOM_PREVIEW_INTENT_DELAY,ROOM_CYCLE_DELAY].includes(delay));timers.set(++serial,{callback,delay});return serial;};
  browser.clearTimeout=id=>timers.delete(id);
  const tick=()=>{assert.equal(timers.size,1);const [id,{callback}]=timers.entries().next().value;timers.delete(id);callback();};
  browser.location=new URL(`https://local.test${route}${search}`);
  const scene=kind==='home'?'airport':({airports:'airport',universities:'campus',hospitals:'hospital'})[kind];
  const outside=element([`outside-${scene}`]);
  room.dataset={roomSetting:kind,roomPresentation:kind==='home'?'home':'directory',roomPreview:scene,doorState};
  control.dataset={openLabel:'Ouvrir la porte',closeLabel:'Fermer la porte'};
  const links=[['airports','airport'],['universities','campus'],['hospitals','hospital']].map(([category,scene])=>{
    const link=element(),returnLabel=element();link.querySelector=()=>returnLabel;link.returnLabel=returnLabel;
    link.dataset={doorDestination:category,doorPreview:scene,sceneName:category,sceneIcon:scene==='hospital'?'care':scene,sceneLabel:`View outside: ${category}`,returnLabel:'Retrouver vos résultats'};
    link.setAttribute('href',`/fr/${category}/`);return link;
  });
  room.querySelector=selector=>({
    '[data-door-toggle]':control,'[data-door-toggle-label]':label,'.door-notices':notices,
    '[data-room-cycle]':tour?cycleControl:null,'[data-room-cycle-status]':cycleStatus,
    '.door-outside':outside,'[data-room-scene-name]':sceneName,'[data-room-scene-icon]':sceneIcon,
  })[selector];
  room.querySelectorAll=()=>links;
  initRoomDoor(room,browser);
  return {room,control,label,notices,links,outside,browser,document,sceneName,sceneIcon,timers,tick,cycleControl,cycleLabel,cycleStatus,media};
}

const closedHome=()=>fixture('home','/fr/','','closed');

test('a closed homepage keeps readable notices and a translated open control',()=>{
  const f=closedHome();
  assert.equal(f.room.dataset.doorState,'closed');assert.equal(f.control.hidden,false);
  assert.equal(f.control.getAttribute('aria-expanded'),'false');
  assert.equal(f.label.textContent,'Ouvrir la porte');assert.equal(f.notices.inert,undefined);
});
test('all three category doors start open without replaying a load animation',()=>{
  for(const kind of ['airports','universities','hospitals']) {
    const f=fixture(kind);assert.equal(f.room.dataset.doorState,'open');
    assert.equal(f.control.getAttribute('aria-expanded'),'true');assert.equal(f.notices.inert,undefined);
    assert.equal(f.room.dataset.doorMotion,undefined);
  }
});
test('opening and closing updates the label while fixed notices remain accessible',()=>{
  const f=closedHome();f.control.emit('click');
  assert.equal(f.room.dataset.doorState,'open');assert.equal(f.label.textContent,'Fermer la porte');
  assert.equal(f.notices.inert,undefined);assert.equal(f.notices.getAttribute('aria-hidden'),undefined);
  f.control.emit('click');
  assert.equal(f.room.dataset.doorState,'closed');assert.equal(f.label.textContent,'Ouvrir la porte');
  assert.equal(f.notices.inert,undefined);assert.equal(f.notices.getAttribute('aria-hidden'),undefined);
});
test('reversing rapidly never queues navigation or forces a stale animation state',()=>{
  const f=closedHome();
  for(let i=0;i<20;i++) f.control.emit('click');
  assert.equal(f.room.dataset.doorState,'closed');
  f.control.emit('click');assert.equal(f.room.dataset.doorState,'open');
});
test('reinitializing preserves the chosen preview and binds only one reversible toggle',()=>{
  const f=closedHome();f.links[1].emit('focus');f.control.emit('click');
  initRoomDoor(f.room,f.browser);
  assert.equal(f.room.dataset.doorState,'open');assert.equal(f.room.dataset.roomPreview,'campus');
  f.control.emit('click');assert.equal(f.room.dataset.doorState,'closed');assert.equal(f.label.textContent,'Ouvrir la porte');
  f.control.emit('click');assert.equal(f.room.dataset.doorState,'open');assert.equal(f.label.textContent,'Fermer la porte');
  assert.equal(f.outside.classList.contains('outside-campus'),true);
});
test('all notice links navigate immediately, including keyboard and modified activations',()=>{
  const f=closedHome();
  for(const link of f.links) for(const options of [{},{detail:0},{ctrlKey:true},{metaKey:true},{shiftKey:true},{button:1}]) {
    assert.equal(link.emit('click',options).defaultPrevented,false);
    assert.equal(f.room.dataset.doorState,'closed');
  }
});
test('home preview changes the stationary outside scene; category previews keep their location',()=>{
  const f=closedHome();f.links[1].emit('focus');
  assert.equal(f.outside.classList.contains('outside-campus'),true);
  assert.equal(f.outside.getAttribute('aria-label'),'View outside: universities');
  const g=fixture('hospitals');g.control.emit('click');g.links[1].emit('pointerenter');
  assert.equal(g.outside.classList.contains('outside-hospital'),true);
});
test('back/forward restores the door state without a snap or redirect',()=>{
  const f=closedHome();f.control.emit('click');f.browser.emit('pagehide');f.browser.emit('pageshow',{persisted:true});
  assert.equal(f.room.dataset.doorState,'open');assert.equal(f.control.getAttribute('aria-expanded'),'true');
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
  assert.equal(f.room.dataset.doorState,'open');assert.equal(f.links[0].returnLabel.hidden,true);
  assert.equal(f.links[0].emit('click',{metaKey:true}).defaultPrevented,false);
});
test('history changes refresh the detail return link and label without changing the door',()=>{
  const f=fixture('airports','/fr/airports/lhr/','?browse='+encodeURIComponent('country=GB&mode=map&airport=lhr'));
  f.control.emit('click');
  f.browser.location.search='?browse='+encodeURIComponent('country=FR&mode=list&page=2');f.browser.emit('popstate');
  assert.equal(f.links[0].getAttribute('href'),'/fr/airports/?country=FR&mode=list&page=2');assert.equal(f.links[0].returnLabel.hidden,false);
  f.browser.location.search='';f.browser.emit('popstate');
  assert.equal(f.links[0].getAttribute('href'),'/fr/airports/');assert.equal(f.links[0].returnLabel.hidden,true);assert.equal(f.links[0].returnLabel.textContent,'');
  assert.equal(f.room.dataset.doorState,'closed');assert.equal(f.control.getAttribute('aria-expanded'),'false');
});


test('home previews keep the visible caption and highlighted notice in sync',()=>{
 const f=closedHome();
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

test('a deliberate hover previews a home notice without moving the door or navigating',()=>{
 const f=closedHome();const href=f.links[1].getAttribute('href');
 f.links[1].emit('pointerenter',{pointerType:'mouse'});
 assert.equal(ROOM_PREVIEW_INTENT_DELAY,180);assert.equal(f.timers.size,1);
 assert.equal(f.outside.classList.contains('outside-airport'),true);
 assert.equal(f.room.dataset.roomPreview,'airport');
 f.tick();assert.equal(f.room.dataset.roomPreview,'campus');assert.equal(f.timers.size,0);
 assert.equal(f.room.dataset.doorState,'closed');assert.equal(f.links[1].getAttribute('href'),href);
});
test('crossing notices, touch, pointer activation and leaving the page do not queue scenery changes',()=>{
 for(const cancel of ['pointerleave','pointerdown','click','pagehide']){
  const f=closedHome();f.links[1].emit('pointerenter');assert.equal(f.timers.size,1);
  const event=(cancel==='pagehide'?f.browser:f.links[1]).emit(cancel);
  assert.equal(f.timers.size,0);assert.equal(f.room.dataset.roomPreview,'airport');
  assert.equal(event.defaultPrevented,false);
 }
 const f=closedHome();f.links[1].emit('pointerenter',{pointerType:'touch'});
 assert.equal(f.timers.size,0);assert.equal(f.room.dataset.roomPreview,'airport');
 f.links[1].emit('pointerenter');f.links[1].emit('pointerleave');f.links[2].emit('pointerenter');
 assert.equal(f.timers.size,1);f.tick();assert.equal(f.room.dataset.roomPreview,'hospital');
 f.browser.emit('pagehide');f.browser.emit('pageshow',{persisted:true});assert.equal(f.timers.size,0);
});
test('keyboard focus previews immediately and cancels a pending pointer preview',()=>{
 const f=closedHome();f.links[1].emit('pointerenter');assert.equal(f.timers.size,1);
 f.links[2].emit('focus');assert.equal(f.room.dataset.roomPreview,'hospital');assert.equal(f.timers.size,0);
 assert.equal(f.sceneName.textContent,'hospitals');assert.equal(f.sceneIcon.getAttribute('href'),'#i-care');
 assert.equal(f.links[2].emit('click',{detail:0}).defaultPrevented,false);
});
test('activating a notice during its intent delay never prevents or defers native navigation',()=>{
 for(const options of [{},{ctrlKey:true},{metaKey:true},{shiftKey:true},{button:1}]){
  const f=closedHome();const link=f.links[1],href=link.getAttribute('href');
  link.emit('pointerenter');assert.equal(f.timers.size,1);
  assert.equal(link.emit('pointerdown',options).defaultPrevented,false);
  assert.equal(link.emit('click',options).defaultPrevented,false);
  assert.equal(f.timers.size,0);assert.equal(link.getAttribute('href'),href);
  assert.equal(f.room.dataset.doorState,'closed');assert.equal(f.room.dataset.roomPreview,'airport');
 }
});

test('the current open homepage stays still at initialization and exposes a translated close control',()=>{
 const f=fixture();
 assert.equal(f.room.dataset.doorState,'open');assert.equal(f.control.getAttribute('aria-expanded'),'true');
 assert.equal(f.label.textContent,'Fermer la porte');assert.equal(f.timers.size,0);
 assert.equal(f.room.dataset.doorArrival,undefined);assert.equal(f.room.dataset.doorMotion,undefined);
 assert.equal(f.outside.classList.contains('outside-airport'),true);
});
test('using the door control cancels a pending notice preview immediately',()=>{
 for(const interaction of ['pointerdown','focus','click']){
  const f=fixture();f.links[1].emit('pointerenter');assert.equal(f.timers.size,1);
  f.control.emit(interaction);assert.equal(f.timers.size,0);
  assert.equal(f.outside.classList.contains('outside-airport'),true);
  assert.equal(f.room.dataset.doorState,interaction==='click'?'closed':'open');
 }
});

test('Explore views opens a manually closed homepage and starts one tour timer with matching controls',()=>{
 const f=fixture('home','/fr/','','open',{tour:true});
 f.control.emit('click');assert.equal(f.room.dataset.doorState,'closed');assert.equal(f.timers.size,0);
 assert.equal(f.cycleLabel.textContent,'Explorer les vues');
 f.cycleControl.emit('click');
 assert.equal(f.room.dataset.doorState,'open');assert.equal(f.control.getAttribute('aria-expanded'),'true');
 assert.equal(f.label.textContent,'Fermer la porte');assert.equal(f.cycleLabel.textContent,'Mettre en pause');
 assert.equal(f.cycleStatus.textContent,'Playing');assert.equal(f.timers.size,1);
 assert.equal(f.timers.values().next().value.delay,ROOM_CYCLE_DELAY);
 f.tick();assert.equal(f.room.dataset.roomPreview,'campus');assert.equal(f.timers.size,1);
});
test('Resume views reopens a paused closed door, while closing or restoring it never restarts the tour',()=>{
 const f=fixture('home','/fr/','','open',{tour:true});
 f.cycleControl.emit('click');f.control.emit('click');assert.equal(f.timers.size,0);
 f.browser.emit('pageshow',{persisted:true});assert.equal(f.room.dataset.doorState,'closed');assert.equal(f.timers.size,0);
 f.cycleControl.emit('click');assert.equal(f.cycleLabel.textContent,'Reprendre les vues');assert.equal(f.room.dataset.doorState,'closed');
 f.cycleControl.emit('click');assert.equal(f.room.dataset.doorState,'open');assert.equal(f.timers.size,1);
 assert.equal(f.control.getAttribute('aria-expanded'),'true');assert.equal(f.label.textContent,'Fermer la porte');
});
test('reduced-motion visitors keep a closed door until explicitly exploring its views',()=>{
 const f=fixture('home','/fr/','','closed',{tour:true,reduced:true});
 f.browser.emit('pageshow');f.document.emit('visibilitychange');
 assert.equal(f.room.dataset.doorState,'closed');assert.equal(f.timers.size,0);
 f.room.emit('focusin');f.cycleControl.emit('click');
 assert.equal(f.room.dataset.doorState,'open');assert.equal(f.control.getAttribute('aria-expanded'),'true');
 assert.equal(f.label.textContent,'Fermer la porte');assert.equal(f.timers.size,1);
 assert.equal(f.room.dataset.doorArrival,undefined);
 f.media.emit('change',{matches:true});assert.equal(f.timers.size,0);assert.equal(f.cycleLabel.textContent,'Reprendre les vues');
});
