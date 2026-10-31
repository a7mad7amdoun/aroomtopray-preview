// A progressive inspector for already reviewed images. Native dialog supplies
// modality, keyboard containment and Escape semantics; source links stay usable.
export function initPhotoViewer(root) {
 const dialog=root.querySelector('[data-photo-dialog]');
 if(!dialog || typeof dialog.showModal!=='function' || root.dataset.photoViewerReady==='true')return false;
 const body=dialog.querySelector('[data-photo-dialog-body]'),close=dialog.querySelector('[data-photo-close]');
 if(!body || !close)return false;
 const doc=root.ownerDocument,links=[...root.querySelectorAll('[data-photo-open]')];
 let opener=null,overflow='',backdropPressed=false;
 function restore(){
  body.replaceChildren();
  if(opener){doc.documentElement.style.overflow=overflow;const target=opener;opener=null;if(target.isConnected)target.focus({preventScroll:true});}
 }
 function show(link){
  const figure=link.closest('[data-photo-id]'),image=figure?.querySelector('.place-photo-image img'),caption=figure?.querySelector('figcaption');
  if(!image || !caption || dialog.open)return false;
  const enlarged=doc.createElement('figure'),photo=image.cloneNode(true),credit=caption.cloneNode(true);
  enlarged.className='photo-viewer-figure';
  photo.sizes='(max-width: 1120px) calc(100vw - 72px), 1060px';photo.loading='eager';
  const imageWidth=Number(link.dataset.photoWidth);
  if(Number.isFinite(imageWidth)&&imageWidth>0)photo.style.maxWidth=`${imageWidth}px`;
  // Avoid duplicate identifiers when an image caption gains a linked label later.
  credit.removeAttribute('id');credit.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
  enlarged.append(photo,credit);body.replaceChildren(enlarged);
  try {dialog.showModal();}
  catch {body.replaceChildren();return false;}
  opener=link;overflow=doc.documentElement.style.overflow;doc.documentElement.style.overflow='hidden';
  close.focus({preventScroll:true});return true;
 }
 links.forEach(link=>{
  link.setAttribute('role','button');link.setAttribute('aria-haspopup','dialog');link.setAttribute('aria-controls',dialog.id);
  link.setAttribute('aria-label',link.dataset.photoLabel);
  link.querySelector('[data-photo-hint]')?.removeAttribute('hidden');
  link.addEventListener('click',event=>{
   if(event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button>0)return;
   // Only prevent navigation once opening succeeds. A failed/unsupported dialog
   // must leave the credited original-source destination available.
   if(show(link))event.preventDefault();
  });
  link.addEventListener('keydown',event=>{if(event.key===' '){event.preventDefault();link.click();}});
 });
 close.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('cancel',event=>{event.preventDefault();dialog.close();});
 dialog.addEventListener('close',restore);
 dialog.addEventListener('pointerdown',event=>{backdropPressed=event.target===dialog;});
 dialog.addEventListener('click',event=>{if(event.target===dialog&&backdropPressed)dialog.close();backdropPressed=false;});
 root.dataset.photoViewerReady='true';
 return true;
}
