// Native horizontal scrolling remains available without JavaScript. Enhancement
// only supplies explicit previous/next controls; photographs never auto-advance.
export function initSettingGallery(root,browser=window) {
 if(!root||root.dataset.galleryReady==='true')return;
 const track=root.querySelector('[data-photo-track]');
 const slides=[...root.querySelectorAll('[data-photo-slide]')];
 const controls=root.querySelector('[data-photo-controls]');
 const previous=root.querySelector('[data-photo-step="-1"]');
 const next=root.querySelector('[data-photo-step="1"]');
 const status=root.querySelector('[data-photo-status]');
 if(!track||slides.length<2||!previous||!next||!status)return;
 const rtl=root.dir==='rtl',number=new Intl.NumberFormat(status.dataset.locale||'en');
 const edge=rect=>rtl?rect.right:rect.left;
 let current=0,frame=null;
 const update=()=>{
  frame=null;
  const start=edge(track.getBoundingClientRect());
  current=slides.reduce((best,slide,index)=>Math.abs(edge(slide.getBoundingClientRect())-start)<Math.abs(edge(slides[best].getBoundingClientRect())-start)?index:best,0);
  previous.disabled=current===0;next.disabled=current===slides.length-1;
  status.textContent=`${number.format(current+1)} ${status.dataset.of} ${number.format(slides.length)}`;
 };
 const select=index=>{
  const target=slides[Math.max(0,Math.min(slides.length-1,index))];
  const delta=edge(target.getBoundingClientRect())-edge(track.getBoundingClientRect());
  track.scrollBy({left:delta,behavior:browser.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 };
 previous.addEventListener('click',()=>select(current-1));
 next.addEventListener('click',()=>select(current+1));
 track.addEventListener('scroll',()=>{if(frame===null)frame=browser.requestAnimationFrame(update);},{passive:true});
 browser.addEventListener('resize',update,{passive:true});
 controls.hidden=false;root.dataset.galleryReady='true';update();
 return {update,select};
}
if(typeof document!=='undefined')document.querySelectorAll('[data-setting-gallery]').forEach(root=>initSettingGallery(root));
