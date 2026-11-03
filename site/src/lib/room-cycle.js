export const ROOM_CYCLE_DELAY = 14000;

// A background tour never changes a route, a form, keyboard focus or live status.
export function initRoomCycle(room, browser, links, preview) {
 const control=room.querySelector('[data-room-cycle]');
 if(!control || room.dataset.roomPresentation!=='home' || links.length<2) return;
 const label=control.querySelector('[data-room-cycle-label]');
 const status=room.querySelector('[data-room-cycle-status]');
 const doc=room.ownerDocument;
 const media=browser.matchMedia?.('(prefers-reduced-motion: reduce)');
 let userPaused=Boolean(media?.matches || browser.navigator?.connection?.saveData);
 let hovered=false,focused=false,visible=true,away=false,timer=null;
 const clear=()=>{if(timer!==null){browser.clearTimeout(timer);timer=null;}};
 const canRun=()=>!userPaused&&!hovered&&!focused&&visible&&!away&&!doc?.hidden&&room.dataset.doorState==='open';
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
  if(label)label.textContent=userPaused?control.dataset.resumeLabel:control.dataset.pauseLabel;
  if(announce&&status)status.textContent=userPaused?control.dataset.pausedMessage:control.dataset.playingMessage;
  room.dataset.roomCycle=userPaused?'paused':'playing';
  schedule();
 };
 control.hidden=false;
 control.addEventListener('click',()=>{userPaused=!userPaused;updateControl(true);});
 room.addEventListener('pointerenter',()=>{hovered=true;clear();});
 room.addEventListener('pointerleave',()=>{hovered=false;schedule();});
 room.addEventListener('focusin',()=>{focused=true;clear();});
 room.addEventListener('focusout',event=>{focused=room.contains(event.relatedTarget);schedule();});
 doc?.addEventListener('visibilitychange',schedule);
 browser.addEventListener('pagehide',()=>{away=true;clear();});
 browser.addEventListener('pageshow',()=>{away=false;schedule();});
 media?.addEventListener?.('change',event=>{if(event.matches)userPaused=true;updateControl();});
 if(browser.IntersectionObserver){
  const observer=new browser.IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting!==false;schedule();},{threshold:0.05});
  observer.observe(room);
 }
 updateControl();
 return {sync:schedule};
}
