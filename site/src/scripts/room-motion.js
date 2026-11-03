// This controller only moves the architectural layer. It never changes content
// widths, focus, a URL, form state, or the browser's scroll position.
export function roomPosture({scrollY=0,guideTop=Infinity,headerBottom=0,presentation='home',view='list'}={}) {
 return presentation==='detail'||presentation==='support'||view==='map'||scrollY>180||guideTop<headerBottom+80?'reading':'arrival';
}
export function initRoomMotion(doc=document,browser=window) {
 const room=doc.querySelector('.room-environment');
 if(!room||room.dataset.roomMotionReady==='true')return;
 const guide=doc.querySelector('#guide-content'),header=doc.querySelector('.room-header');
 const media=browser.matchMedia?.('(prefers-reduced-motion: reduce)');
 let frame=null,away=false;
 const measure=()=>{
  frame=null;
  if(away||doc.hidden)return;
  const bounds=header?.getBoundingClientRect?.();
  if(bounds&&Number.isFinite(bounds.bottom))doc.documentElement.style.setProperty('--room-header-height',`${Math.max(0,Math.ceil(bounds.bottom))}px`);
  const reduced=Boolean(media?.matches||browser.navigator?.connection?.saveData);
  room.dataset.roomMotion=reduced?'off':room.dataset.roomCycle==='paused'?'paused':'on';
  if(room.dataset.roomMotion==='paused')return;
  const selected=doc.querySelector('[data-directory-mode][aria-selected="true"]')?.dataset.directoryMode;
  const view=['map','guide'].includes(selected)?selected:'list';
  room.dataset.roomView=reduced?'list':view;
  room.dataset.roomPosture=reduced?'arrival':roomPosture({scrollY:browser.scrollY||0,guideTop:guide?.getBoundingClientRect?.().top??Infinity,headerBottom:bounds?.bottom||0,presentation:room.dataset.roomPresentation,view});
 };
 const schedule=()=>{
  if(away||frame!==null)return;
  if(browser.requestAnimationFrame)frame=browser.requestAnimationFrame(measure);else measure();
 };
 browser.addEventListener('scroll',schedule,{passive:true});
 browser.addEventListener('resize',schedule,{passive:true});
 browser.addEventListener('pageshow',()=>{away=false;schedule();});
 browser.addEventListener('pagehide',()=>{away=true;if(frame!==null)browser.cancelAnimationFrame?.(frame);frame=null;});
 doc.addEventListener('visibilitychange',schedule);
 doc.addEventListener('guide:change',schedule,true);
 doc.addEventListener('directory:updated',schedule);
 doc.addEventListener('atlas:selection',schedule);
 media?.addEventListener?.('change',schedule);
 if(browser.ResizeObserver&&header)new browser.ResizeObserver(schedule).observe(header);
 if(browser.MutationObserver)new browser.MutationObserver(schedule).observe(room,{attributes:true,attributeFilter:['data-room-cycle']});
 room.dataset.roomMotionReady='true';
 measure();
 return {refresh:schedule};
}
if(typeof document!=='undefined')initRoomMotion();
