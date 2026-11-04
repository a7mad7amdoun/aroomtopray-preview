export const DOOR_ARRIVAL_KEY='aroomtopray.door-arrival.v1';
export const DOOR_JOURNEY_DURATION=1500;
export const DOOR_JOURNEY_ANIMATION='door-arrival-depth';
const MAX_AGE=15000;

// This self-contained function also runs inline in <head>, before the first
// paint. A late module must never close a doorway the visitor has already seen.
export function prepareDoorArrival(browser,doc,now=Date.now()) {
 try {
  const intent=JSON.parse(browser.sessionStorage.getItem('aroomtopray.door-arrival.v1'));
  const age=now-intent?.at;
  if(!intent || intent.path!==browser.location.pathname || !/\/(airports|universities|hospitals)\/$/.test(intent.path) || !Number.isFinite(intent.at) || age<0 || age>=15000 || browser.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || browser.navigator?.connection?.saveData || !browser.requestAnimationFrame || !browser.setTimeout) return false;
  const root=doc.documentElement;
  root.dataset.doorArrival='preparing';
  // If the enhancement fails or loads too late, expose the server's open door.
  // No body content, navigation or information is hidden by this marker.
  const release=()=>{delete root.dataset.doorArrival;};
  browser.setTimeout(release,4000);
  browser.addEventListener?.('pagehide',release,{once:true});
  browser.addEventListener?.('pageshow',event=>{if(event.persisted)release();});
  return true;
 } catch { return false; }
}
export const DOOR_ARRIVAL_PREPAINT_SCRIPT=`(${prepareDoorArrival.toString()})(window,document);`;

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
  return Boolean(intent && intent.path===browser.location.pathname && /\/(airports|universities|hospitals)\/$/.test(intent.path) && Number.isFinite(intent.at) && age>=0 && age<MAX_AGE);
 } catch { return false; }
}

export function initDoorArrival(room,browser,setOpen) {
 room.ownerDocument?.addEventListener('click',event=>recordDoorArrival(event,browser));
 const root=room.ownerDocument?.documentElement;
 const prepared=root?.dataset.doorArrival==='preparing';
 const intended=consumeDoorArrival(browser);
 const motion=browser.matchMedia?.('(prefers-reduced-motion: reduce)');
 if(!prepared || !intended || room.dataset.doorState!=='open' || motion?.matches || browser.navigator?.connection?.saveData || !browser.requestAnimationFrame || !browser.setTimeout) {
  if(root)delete root.dataset.doorArrival;
  return;
 }
 let cancelled=false,pending=true,settled=false,firstFrame,secondFrame,journeyTimer;
 const finishJourney=()=>{
  delete room.dataset.doorJourney;
  if(journeyTimer!==undefined)browser.clearTimeout?.(journeyTimer);
  journeyTimer=undefined;
 };
 const cancel=()=>{
  cancelled=true;pending=false;
  if(firstFrame!==undefined)browser.cancelAnimationFrame?.(firstFrame);
  if(secondFrame!==undefined)browser.cancelAnimationFrame?.(secondFrame);
  finishJourney();
 };
 const settle=()=>{
  const wasPending=pending;
  cancel();
  if(wasPending){
   room.dataset.doorArrival='preparing';
   setOpen(true);
  }
  return wasPending;
 };
 room.querySelector('[data-door-toggle]')?.addEventListener('click',()=>{cancel();delete room.dataset.doorArrival;},{once:true});
 room.addEventListener?.('animationend',event=>{
  if(event.animationName===DOOR_JOURNEY_ANIMATION && event.target?.classList?.contains('door-scene'))finishJourney();
 });
 browser.addEventListener?.('pagehide',()=>{
  settled=settle()||settled;
 });
 browser.addEventListener?.('pageshow',event=>{
  // Initial pageshow may follow the first animation frames. Only restoration
  // cancels an arrival; a normal load must not truncate its decorative motion.
  if(event.persisted){settle();delete room.dataset.doorArrival;}
  else if(settled){finishJourney();delete room.dataset.doorArrival;}
 });
 motion?.addEventListener?.('change',event=>{
  if(!event.matches)return;
  // Expose the server's open state immediately under reduced-motion styles.
  settle();
  delete room.dataset.doorArrival;
 });
 room.dataset.doorArrival='preparing';
 setOpen(false);
 delete root.dataset.doorArrival;
 firstFrame=browser.requestAnimationFrame(()=>{
  if(cancelled)return;
  secondFrame=browser.requestAnimationFrame(()=>{
   if(cancelled)return;
   pending=false;
   delete room.dataset.doorArrival;
   setOpen(true);
   // The depth treatment belongs only to scenery. Content, navigation, focus
   // and scroll are never held for an animation or its completion event.
   room.dataset.doorJourney='entering';
   journeyTimer=browser.setTimeout(finishJourney,DOOR_JOURNEY_DURATION);
  });
 });
}
