export const DOOR_ARRIVAL_KEY='aroomtopray.door-arrival.v1';
const MAX_AGE=15000;

// Navigation remains native. Only a short-lived visual intention crosses pages.
export function recordDoorArrival(event,browser,now=Date.now()) {
 if(event.defaultPrevented || event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
 const link=event.target?.closest?.('a[href]');
 if(!link || link.hasAttribute('download') || (link.target && link.target!=='_self')) return false;
 try {
  const next=new URL(link.href,browser.location.href);
  if(next.origin!==browser.location.origin || next.pathname===browser.location.pathname || !/\/(airports|universities|hospitals)\/$/.test(next.pathname)) return false;
  browser.sessionStorage.setItem(DOOR_ARRIVAL_KEY,JSON.stringify({path:next.pathname,at:now}));
  return true;
 } catch { return false; }
}

export function consumeDoorArrival(browser,now=Date.now()) {
 try {
  const raw=browser.sessionStorage.getItem(DOOR_ARRIVAL_KEY);
  browser.sessionStorage.removeItem(DOOR_ARRIVAL_KEY);
  if(!raw) return false;
  const intent=JSON.parse(raw),age=now-intent.at;
  return intent.path===browser.location.pathname && Number.isFinite(intent.at) && age>=0 && age<MAX_AGE;
 } catch { return false; }
}

export function initDoorArrival(room,browser,setOpen) {
 room.ownerDocument?.addEventListener('click',event=>recordDoorArrival(event,browser));
 const intended=consumeDoorArrival(browser);
 if(!intended || room.dataset.doorState!=='open' || browser.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || !browser.requestAnimationFrame) return;
 let cancelled=false,pending=true,settled=false,firstFrame,secondFrame;
 const cancel=()=>{
  cancelled=true;pending=false;
  if(firstFrame!==undefined)browser.cancelAnimationFrame?.(firstFrame);
  if(secondFrame!==undefined)browser.cancelAnimationFrame?.(secondFrame);
 };
 room.querySelector('[data-door-toggle]')?.addEventListener('click',()=>{cancel();delete room.dataset.doorArrival;},{once:true});
 browser.addEventListener?.('pagehide',()=>{
  if(!pending)return;
  cancel();settled=true;
  room.dataset.doorArrival='preparing';
  setOpen(true);
 });
 browser.addEventListener?.('pageshow',()=>{if(settled)delete room.dataset.doorArrival;});
 room.dataset.doorArrival='preparing';
 setOpen(false);
 firstFrame=browser.requestAnimationFrame(()=>{
  if(cancelled)return;
  secondFrame=browser.requestAnimationFrame(()=>{
   if(cancelled)return;
   pending=false;
  delete room.dataset.doorArrival;
   setOpen(true);
  });
 });
}
