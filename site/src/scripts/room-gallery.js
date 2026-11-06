// One set of original photographs serves both themes; only the glass is dimmed.
export function initRoomGallery(root,browser=window,doc=document) {
 if(!root||root.dataset.galleryReady==='true')return;
 const host=root.closest('.room-environment'),slides=[...root.querySelectorAll('[data-room-photo]')];
 const controls=host?.querySelector('[data-room-gallery-controls]');
 if(!controls||slides.length<2)return;
 const pause=controls.querySelector('[data-room-photo-pause]'),count=controls.querySelector('[data-room-photo-count]');
 const announce=controls.querySelector('[data-room-photo-announcement]'),credits=[...host.querySelectorAll('[data-room-photo-credit]')];
 const media=browser.matchMedia?.('(prefers-reduced-motion: reduce)'),number=new Intl.NumberFormat(count.dataset.locale||'en');
 let index=0,timer=null,visible=!browser.IntersectionObserver,away=false,focused=false,hovered=false,userPaused=Boolean(media?.matches||browser.navigator?.connection?.saveData);
 let generation=0;
 const stop=()=>{generation++;if(timer!==null)browser.clearTimeout(timer);timer=null;};
 const canRun=()=>!userPaused&&!media?.matches&&visible&&!away&&!doc.hidden&&!focused&&!hovered;
 const sync=()=>{
  stop();
  const paused=userPaused||Boolean(media?.matches);
  // A live preference change must not remove a keyboard user's focused button.
  pause.hidden=Boolean(media?.matches)&&doc.activeElement!==pause;
  pause.disabled=Boolean(media?.matches);
  pause.textContent=paused?pause.dataset.playLabel:pause.dataset.pauseLabel;
  pause.setAttribute('aria-pressed',String(paused));
  const scheduledGeneration=generation;
  if(canRun())timer=browser.setTimeout(()=>{if(scheduledGeneration!==generation)return;timer=null;if(canRun())show(index+1,false);},8000);
 };
 const show=(next,manual=true)=>{
  index=(next+slides.length)%slides.length;
  slides.forEach((slide,i)=>{slide.dataset.active=String(i===index);slide.setAttribute('aria-hidden',String(i!==index));});
  credits.forEach((credit,i)=>credit.hidden=i!==index);
  count.textContent=`${number.format(index+1)} ${count.dataset.of} ${number.format(slides.length)}`;
  if(manual)announce.textContent=`${count.textContent}: ${slides[index].alt}`;
  sync();
 };
 controls.querySelectorAll('[data-room-photo-step]').forEach(button=>button.addEventListener('click',()=>{userPaused=true;show(index+Number(button.dataset.roomPhotoStep));}));
 pause.addEventListener('click',()=>{userPaused=!userPaused;if(media?.matches)userPaused=true;if(!userPaused){focused=false;hovered=false;}sync();});
 const interaction=host.querySelector('.room-scene-tools')||controls;
 interaction.addEventListener('focusin',()=>{focused=true;sync();});
 interaction.addEventListener('focusout',event=>{focused=interaction.contains(event.relatedTarget);sync();});
 interaction.addEventListener('pointerenter',()=>{hovered=true;sync();});
 interaction.addEventListener('pointerleave',()=>{hovered=false;sync();});
 if(browser.IntersectionObserver)new browser.IntersectionObserver(entries=>{visible=entries.at(-1)?.isIntersecting||false;sync();},{threshold:.1}).observe(root);
 media?.addEventListener?.('change',()=>{if(media.matches)userPaused=true;sync();});
 doc.addEventListener('visibilitychange',sync);
 browser.addEventListener('pagehide',()=>{away=true;stop();});
 browser.addEventListener('pageshow',()=>{away=false;sync();});
 controls.hidden=false;root.dataset.galleryReady='true';show(0,false);
 return {show,pause:()=>{userPaused=true;sync();}};
}
if(typeof document!=='undefined')document.querySelectorAll('[data-room-gallery]').forEach(root=>initRoomGallery(root));
