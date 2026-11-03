// Keep the room registered with the real header. Scrolling and searching do not
// move the camera, resize information, steal focus, or change navigation state.
export function initRoomMotion(doc=document,browser=window) {
 const room=doc.querySelector('.room-environment');
 if(!room||room.dataset.roomMotionReady==='true')return;
 const header=doc.querySelector('.room-header');
 let frame=null,away=false,lastHeaderHeight;
 const measure=()=>{
  frame=null;
  if(away||doc.hidden)return;
  const bounds=header?.getBoundingClientRect?.();
  if(bounds&&Number.isFinite(bounds.bottom)){
   const height=Math.max(0,Math.ceil(bounds.bottom));
   if(height!==lastHeaderHeight){
    doc.documentElement.style.setProperty('--room-header-height',`${height}px`);
    lastHeaderHeight=height;
   }
  }
 };
 const schedule=()=>{
  if(away||doc.hidden||frame!==null)return;
  if(browser.requestAnimationFrame)frame=browser.requestAnimationFrame(measure);else measure();
 };
 browser.addEventListener('scroll',schedule,{passive:true});
 browser.addEventListener('resize',schedule,{passive:true});
 browser.addEventListener('pageshow',()=>{away=false;schedule();});
 browser.addEventListener('pagehide',()=>{away=true;if(frame!==null)browser.cancelAnimationFrame?.(frame);frame=null;});
 doc.addEventListener('visibilitychange',schedule);
 if(browser.ResizeObserver&&header)new browser.ResizeObserver(schedule).observe(header);
 room.dataset.roomMotionReady='true';
 measure();
 return {refresh:schedule};
}
if(typeof document!=='undefined')initRoomMotion();
