export const ROOM_CYCLE_DELAY = 14000;

// A background tour never changes a route, a form, keyboard focus or live status.
export function initRoomCycle(room, browser, links, preview) {
 const control=room.querySelector('[data-room-cycle]');
 if(!control || room.dataset.roomPresentation!=='home' || links.length<2) return;
 const label=control.querySelector('[data-room-cycle-label]');
 const status=room.querySelector('[data-room-cycle-status]');
 const doc=room.ownerDocument;
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
 const clear=()=>{if(timer!==null){browser.clearTimeout(timer);timer=null;}};
 const canRun=()=>!userPaused&&!hovered.size&&!focused&&visible&&!away&&!doc?.hidden;
 const schedule=()=>{
  clear();
  if(!canRun()) return;
  timer=browser.setTimeout(()=>{
   timer=null;
   if(!canRun()) return;
   const index=links.findIndex(link=>link.dataset.doorPreview===room.dataset.roomPreview);
   preview(links[(index+1)%links.length]);
   schedule();
  },ROOM_CYCLE_DELAY);
 };
 const updateControl=(announce=false)=>{
  control.dataset.paused=String(userPaused);
  if(label)label.textContent=userPaused?(hasStarted?control.dataset.resumeLabel:control.dataset.startLabel||control.dataset.resumeLabel):control.dataset.pauseLabel;
  if(announce&&status)status.textContent=userPaused?control.dataset.pausedMessage:control.dataset.playingMessage;
  room.dataset.roomCycle=userPaused?'paused':'playing';
  schedule();
 };
 control.hidden=false;
 control.addEventListener('click',()=>{
  userPaused=!userPaused;
  // Resuming is an explicit request, including while the button still has
  // keyboard focus or the pointer remains over it. Subsequent interaction
  // with the guide or destination notices can pause the tour again.
  if(!userPaused){hasStarted=true;hovered.clear();focused=false;}
  updateControl(true);
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
 updateControl();
 return {sync:schedule};
}
