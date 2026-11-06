export const ROOM_CYCLE_DELAY = 14000;
export function updateRoomSceneCount(room,sceneItems) {
 const count=room.querySelector('[data-home-scene-count]');
 if(!count)return;
 const index=sceneItems.findIndex(item=>(item.dataset.homeScene||item.dataset.doorPreview)===(room.dataset.roomScene||room.dataset.roomPreview));
 const number=new Intl.NumberFormat(count.dataset.locale||'en');
 count.textContent=`${number.format(Math.max(0,index)+1)} ${count.dataset.of} ${number.format(sceneItems.length)}`;
}

// A background tour never changes a route, a form, keyboard focus or live status.
export function initRoomCycle(room, browser, links, preview, sceneItems=links, {onManual=()=>{}}={}) {
 const control=room.querySelector('[data-room-cycle]');
 if(!control || room.dataset.roomPresentation!=='home' || links.length<2) return;
 const label=control.querySelector('[data-room-cycle-label]');
 const status=room.querySelector('[data-room-cycle-status]');
 const doc=room.ownerDocument;
 const sceneId=item=>item.dataset.homeScene||item.dataset.doorPreview;
 if(!sceneItems.some(item=>sceneId(item)===room.dataset.roomScene))room.dataset.roomScene=sceneItems.find(item=>sceneId(item)===room.dataset.roomPreview)?room.dataset.roomPreview:sceneId(sceneItems[0]);
 const navigation=room.querySelector('[data-home-scene-controls]');
 if(navigation)navigation.hidden=false;
 // The environment now wraps the whole page. Hovering ordinary guide text
 // must not permanently pause a background tour. Only room controls do.
 const interactions=[...(room.querySelectorAll?.('[data-room-tour-interaction]')||[])];
 if(!interactions.length)interactions.push(room.querySelector('[data-room-tour-interaction]')||room);
 // The homepage scenery is in document flow. Observe the artwork itself: a
 // long mobile introduction can remain visible after its views have left.
 const scenery=room.querySelector('[data-room-scenery]')||room.querySelector('.room-stage')||room;
 const media=browser.matchMedia?.('(prefers-reduced-motion: reduce)');
 // The homepage changes slowly without changing the guide. Motion and data
 // preferences keep it still until an explicit request; a pause survives restore.
 let userPaused=Boolean(media?.matches || browser.navigator?.connection?.saveData);
 let hasStarted=!userPaused;
 const hovered=new Set();
 let focused=false,visible=true,away=false,timer=null;
 let generation=0,announcementGeneration=0;
 const clear=()=>{generation++;if(timer!==null){browser.clearTimeout(timer);timer=null;}};
 const externalPauses=new Set();
 const canRun=()=>!userPaused&&!externalPauses.size&&!hovered.size&&!focused&&visible&&!away&&!doc?.hidden;
 const schedule=()=>{
  clear();
  if(!canRun()) return;
  const scheduledGeneration=generation;
  timer=browser.setTimeout(()=>{
   if(scheduledGeneration!==generation)return;
   timer=null;
   if(!canRun()) return;
   const current=room.dataset.roomRequestedScene||room.dataset.roomScene||room.dataset.roomPreview;
   const index=sceneItems.findIndex(link=>(link.dataset.homeScene||link.dataset.doorPreview)===current);
   preview(sceneItems[(index+1)%sceneItems.length]);
   updateRoomSceneCount(room,sceneItems);
   schedule();
  },ROOM_CYCLE_DELAY);
 };
 const updateControl=(announce=false)=>{
  if(announce)announcementGeneration++;
  control.dataset.paused=String(userPaused);
  if(label)label.textContent=userPaused?(hasStarted?control.dataset.resumeLabel:control.dataset.startLabel||control.dataset.resumeLabel):control.dataset.pauseLabel;
  if(announce&&status)status.textContent=userPaused?control.dataset.pausedMessage:control.dataset.playingMessage;
  room.dataset.roomCycle=userPaused?'paused':'playing';
  schedule();
 };
 control.hidden=false;
 control.disabled=false;
 control.dataset.ready='true';
 control.addEventListener('click',()=>{
  userPaused=!userPaused;
  // Resuming is an explicit request, including while the button still has
  // keyboard focus or the pointer remains over it. Subsequent interaction
  // with the guide or destination notices can pause the tour again.
  if(!userPaused){hasStarted=true;hovered.clear();focused=false;}
  updateControl(true);
 });
 for(const button of navigation?.querySelectorAll('[data-home-scene-step]')||[])button.addEventListener('click',()=>{
  const index=sceneItems.findIndex(item=>sceneId(item)===(room.dataset.roomRequestedScene||room.dataset.roomScene));
  const next=(Math.max(0,index)+Number(button.dataset.homeSceneStep)+sceneItems.length)%sceneItems.length;
  const announcement=++announcementGeneration;
  userPaused=true;hasStarted=true;const applied=preview(sceneItems[next]);updateControl();updateRoomSceneCount(room,sceneItems);
  onManual(sceneItems[next]);
  const announceApplied=success=>{
   if(success===false||announcement!==announcementGeneration||room.dataset.roomScene!==sceneId(sceneItems[next])||(room.dataset.roomRequestedScene&&room.dataset.roomRequestedScene!==sceneId(sceneItems[next])))return;
   const count=room.querySelector('[data-home-scene-count]');
   if(status)status.textContent=`${count?.textContent||''}${count?' · ':''}${sceneItems[next].dataset.sceneName||sceneItems[next].dataset.doorPreview}`;
  };
  if(applied?.then)applied.then(announceApplied);else announceApplied(applied);
 });
 for(const interaction of interactions){
  interaction.addEventListener('pointerenter',()=>{hovered.add(interaction);clear();});
  interaction.addEventListener('pointerleave',()=>{hovered.delete(interaction);schedule();});
 }
 room.addEventListener('focusin',()=>{focused=true;clear();});
 room.addEventListener('focusout',event=>{focused=room.contains(event.relatedTarget);schedule();});
 doc?.addEventListener('visibilitychange',schedule);
 browser.addEventListener('pagehide',()=>{away=true;clear();});
 browser.addEventListener('pageshow',()=>{away=false;schedule();});
 media?.addEventListener?.('change',event=>{if(event.matches)userPaused=true;updateControl();});
 if(browser.IntersectionObserver){
  const observer=new browser.IntersectionObserver(entries=>{visible=entries.at(-1)?.isIntersecting!==false;schedule();},{threshold:0.05});
  observer.observe(scenery);
 }
 updateControl();updateRoomSceneCount(room,sceneItems);
 return {sync:schedule,setExternalPaused:(source,paused)=>{if(paused)externalPauses.add(source);else externalPauses.delete(source);schedule();}};
}
