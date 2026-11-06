// Keep the room registered with the real header. Once the introduction has
// cleared it, CSS may quiet the scenery without moving content or user context.
export function initRoomMotion(doc=document,browser=window) {
 const room=doc.querySelector('.room-environment');
 if(!room||room.dataset.roomMotionReady==='true')return;
 const header=doc.querySelector('.room-header');
 const stage=room.querySelector?.('.room-stage');
 const scenery=room.querySelector?.('[data-room-scenery]');
 const motion=browser.matchMedia?.('(prefers-reduced-motion: reduce)');
 const layered = room.dataset.roomPresentation === 'directory';
 const lastValues = new Map();
 const write = (name, value) => {
  const rounded = String(Math.round(value * 1000) / 1000);
  if (lastValues.get(name) === rounded) return;
  // Category variables stay on the small scenery subtree, not the full guide.
  (layered ? scenery : room)?.style?.setProperty(name, rounded);
  lastValues.set(name, rounded);
 };
 let frame=null,away=false,lastHeaderHeight,stageObserver=null,refreshStage=false,lastScrollY=browser.scrollY??0;
 const setReading=bounds=>{
  if(!stage)return;
  // Edge adjacency is intersecting in IntersectionObserver. Restore at equality
  // because moving farther into view need not produce another threshold event.
  const reading=Number.isFinite(bounds?.bottom)&&bounds.bottom<(lastHeaderHeight??0);
  const value=String(reading);
  if(room.dataset.roomReading!==value)room.dataset.roomReading=value;
 };
 const disconnectStage=()=>{
  stageObserver?.disconnect();
  stageObserver=null;
 };
 const observeStage=()=>{
  disconnectStage();
  setReading(stage?.getBoundingClientRect?.());
  if(!stage||!browser.IntersectionObserver)return;
  const observer=new browser.IntersectionObserver(entries=>{
   if(away||doc.hidden||stageObserver!==observer)return;
   const entry=entries.filter(item=>item.target===stage).at(-1);
   if(entry)setReading(entry.boundingClientRect);
  },{rootMargin:`-${lastHeaderHeight??0}px 0px 0px 0px`,threshold:0});
  stageObserver=observer;
  observer.observe(stage);
 };
 const updateVisibility=()=>{
  if(!scenery)return;
  let visibility=1,eased=0;
  if(!motion?.matches){
   const bounds=scenery.getBoundingClientRect?.();
   if(Number.isFinite(bounds?.top)&&Number.isFinite(bounds?.height)&&bounds.height>0){
    const progress=Math.min(1,Math.max(0,((lastHeaderHeight??0)-bounds.top)/(bounds.height*(layered?1.15:.75))));
    // Ease at both architectural boundaries, not over time: reversing a scroll
    // must reveal the same room immediately rather than chase a CSS transition.
    eased=progress*progress*(3-2*progress);
    visibility=1-.84*eased;
   }
  }
  if(!layered)write('--room-visibility',visibility);
  if(layered){
   // Transform only the glass; never the rug, reading area or document flow.
   write('--room-approach',eased);
   write('--room-wall-visibility',1-eased);
   write('--room-rug-visibility',1-eased);
   write('--room-glass-visibility',1-.15*eased);
  }
 };
 const measure=()=>{
  frame=null;
  if(away||doc.hidden)return;
  const bounds=header?.getBoundingClientRect?.();
  let headerChanged=false;
  if(bounds&&Number.isFinite(bounds.bottom)){
   const height=Math.max(0,Math.ceil(bounds.bottom));
   if(height!==lastHeaderHeight){
    doc.documentElement.style.setProperty('--room-header-height',`${height}px`);
    lastHeaderHeight=height;
    headerChanged=true;
   }
  }
  // Only the decorative canvas consumes this value. Reading content and room
  // controls stay fully visible, and no content position or focus is changed.
  updateVisibility();
  // An anchor jump can take a short stage from below to above the viewport
  // between observer samples, leaving isIntersecting false at both ends.
  const scrollY=browser.scrollY??0;
  const jumped=Number.isFinite(browser.innerHeight)&&Math.abs(scrollY-lastScrollY)>Math.max(0,browser.innerHeight-(lastHeaderHeight??0));
  lastScrollY=scrollY;
  if(headerChanged||!stageObserver||refreshStage||jumped)observeStage();
  refreshStage=false;
 };
 const schedule=()=>{
  if(away||doc.hidden||frame!==null)return;
  if(browser.requestAnimationFrame)frame=browser.requestAnimationFrame(measure);else measure();
 };
 const suspend=()=>{
  if(frame!==null)browser.cancelAnimationFrame?.(frame);
  frame=null;
  disconnectStage();
 };
 const refresh=()=>{refreshStage=true;schedule();};
 motion?.addEventListener?.('change',schedule);
 browser.addEventListener('scroll',schedule,{passive:true});
 browser.addEventListener('resize',refresh,{passive:true});
 browser.visualViewport?.addEventListener?.('resize',refresh,{passive:true});
 browser.addEventListener('pageshow',()=>{away=false;schedule();});
 browser.addEventListener('pagehide',()=>{away=true;suspend();});
 doc.addEventListener('visibilitychange',()=>{if(doc.hidden)suspend();else schedule();});
 if(browser.ResizeObserver&&header)new browser.ResizeObserver(schedule).observe(header);
 if(browser.ResizeObserver&&stage)new browser.ResizeObserver(refresh).observe(stage);
 room.dataset.roomMotionReady='true';
 measure();
 return {refresh};
}
if(typeof document!=='undefined')initRoomMotion();
