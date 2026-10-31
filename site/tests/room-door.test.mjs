import test from 'node:test';
import assert from 'node:assert/strict';
import { initRoomDoor } from '../src/scripts/room-door.js';

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
function fixture(kind='home', route='/fr/', search='') {
  const room=element(),control=element(),label=element(),notices=element(),browser=element(),sceneName=element(),sceneIcon=element();
  browser.location=new URL(`https://local.test${route}${search}`);
  const scene=kind==='home'?'airport':({airports:'airport',universities:'campus',hospitals:'hospital'})[kind];
  const outside=element([`outside-${scene}`]);
  room.dataset={roomSetting:kind,doorState:kind==='home'?'closed':'open'};
  control.dataset={openLabel:'Ouvrir la porte',closeLabel:'Fermer la porte'};
  const links=[['airports','airport'],['universities','campus'],['hospitals','hospital']].map(([category,scene])=>{
    const link=element(),returnLabel=element();link.querySelector=()=>returnLabel;link.returnLabel=returnLabel;
    link.dataset={doorDestination:category,doorPreview:scene,sceneName:category,sceneIcon:scene==='hospital'?'care':scene,sceneLabel:`View outside: ${category}`,returnLabel:'Retrouver vos résultats'};
    link.setAttribute('href',`/fr/${category}/`);return link;
  });
  room.querySelector=selector=>({
    '[data-door-toggle]':control,'[data-door-toggle-label]':label,'.door-notices':notices,
    '.door-outside':outside,'[data-room-scene-name]':sceneName,'[data-room-scene-icon]':sceneIcon,
  })[selector];
  room.querySelectorAll=()=>links;
  initRoomDoor(room,browser);
  return {room,control,label,notices,links,outside,browser,sceneName,sceneIcon};
}

test('home starts closed with readable notices and a translated open control',()=>{
  const f=fixture();
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
  const f=fixture();f.control.emit('click');
  assert.equal(f.room.dataset.doorState,'open');assert.equal(f.label.textContent,'Fermer la porte');
  assert.equal(f.notices.inert,undefined);assert.equal(f.notices.getAttribute('aria-hidden'),undefined);
  f.control.emit('click');
  assert.equal(f.room.dataset.doorState,'closed');assert.equal(f.label.textContent,'Ouvrir la porte');
  assert.equal(f.notices.inert,undefined);assert.equal(f.notices.getAttribute('aria-hidden'),undefined);
});
test('reversing rapidly never queues navigation or forces a stale animation state',()=>{
  const f=fixture();
  for(let i=0;i<20;i++) f.control.emit('click');
  assert.equal(f.room.dataset.doorState,'closed');
  f.control.emit('click');assert.equal(f.room.dataset.doorState,'open');
});
test('all notice links navigate immediately, including keyboard and modified activations',()=>{
  const f=fixture();
  for(const link of f.links) for(const options of [{},{detail:0},{ctrlKey:true},{metaKey:true},{shiftKey:true},{button:1}]) {
    assert.equal(link.emit('click',options).defaultPrevented,false);
    assert.equal(f.room.dataset.doorState,'closed');
  }
});
test('home preview changes the stationary outside scene; category previews keep their location',()=>{
  const f=fixture();f.links[1].emit('focus');
  assert.equal(f.outside.classList.contains('outside-campus'),true);
  assert.equal(f.outside.getAttribute('aria-label'),'View outside: universities');
  const g=fixture('hospitals');g.control.emit('click');g.links[1].emit('pointerenter');
  assert.equal(g.outside.classList.contains('outside-hospital'),true);
});
test('back/forward restores the door state without a snap or redirect',()=>{
  const f=fixture();f.control.emit('click');f.browser.emit('pagehide');f.browser.emit('pageshow',{persisted:true});
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


test('home previews keep the visible caption and highlighted notice in sync',()=>{
 const f=fixture();
 f.links[1].emit('focus');
 assert.equal(f.sceneName.textContent,'universities');
 assert.equal(f.sceneIcon.getAttribute('href'),'#i-campus');
 assert.equal(f.room.dataset.roomPreview,'campus');
 assert.equal(f.links[1].getAttribute('data-previewed'),'');
 f.links[2].emit('pointerenter');
 assert.equal(f.sceneName.textContent,'hospitals');
 assert.equal(f.sceneIcon.getAttribute('href'),'#i-care');
 assert.equal(f.links[1].getAttribute('data-previewed'),undefined);
 assert.equal(f.links[2].getAttribute('data-previewed'),'');
});
