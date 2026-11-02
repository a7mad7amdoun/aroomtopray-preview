import {RECEPTION_COPY,RECEPTION_LANGUAGES,RECEPTION_PHRASES} from '../data/reception-copy.js';

let instance=0;
const historyKey='__aroomtoprayReception';
// A refreshed document must never adopt an open-dialog entry from its predecessor.
const documentToken=globalThis.crypto?.randomUUID?.()||`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export function initReceptionCard(root,browser=window) {
 if(!root||root.dataset.receptionReady==='true')return false;
 const dialog=root.querySelector('[data-reception-dialog]'),opener=root.querySelector('[data-reception-open]');
 const fallback=root.querySelector('[data-reception-fallback]'),close=root.querySelector('[data-reception-close]');
 const language=root.querySelector('[data-reception-language]'),phrase=root.querySelector('[data-reception-phrase]');
 const copy=root.querySelector('[data-reception-copy]'),status=root.querySelector('[data-reception-status]');
 if(!dialog||typeof dialog.showModal!=='function'||!opener||!fallback||!close||!language||!phrase||!copy||!status)return false;
 const doc=root.ownerDocument,t=RECEPTION_COPY[root.dataset.locale]||RECEPTION_COPY.en;
 const token=`${documentToken}:${root.dataset.receptionId||'directions'}:${++instance}`;
 let focusTarget=null,overflow='',fromHistory=false,backdropPressed=false,copyVersion=0,awaitingBack=false;
 const modalEntry=()=>browser.history?.state?.[historyKey]===token;
 function renderPhrase(){
  const value=Object.hasOwn(RECEPTION_PHRASES,language.value)?language.value:'en';
  language.value=value;phrase.textContent=RECEPTION_PHRASES[value];phrase.lang=value;
  phrase.dir=RECEPTION_LANGUAGES.find(item=>item.code===value).dir;
  status.textContent='';copyVersion++;copy.disabled=false;
 }
 function show(recordHistory=true){
  if(dialog.open||awaitingBack)return false;
  // Dialog failure leaves the fully translated, ordinary HTML disclosure usable.
  try{dialog.showModal();}catch{opener.hidden=true;fallback.hidden=false;fallback.open=true;return false;}
  focusTarget=opener;overflow=doc.documentElement.style.overflow;
  doc.documentElement.style.overflow='hidden';status.textContent='';close.focus({preventScroll:true});
  if(recordHistory){
   try{browser.history.pushState({...browser.history.state,[historyKey]:token},'',browser.location.href);}catch{}
  }
  return true;
 }
 function dismiss(history=false){fromHistory=history;dialog.close();}
 opener.addEventListener('click',()=>show());
 close.addEventListener('click',()=>dismiss());
 dialog.addEventListener('cancel',event=>{event.preventDefault();dismiss();});
 dialog.addEventListener('close',()=>{
  doc.documentElement.style.overflow=overflow;copyVersion++;copy.disabled=false;status.textContent='';
  const target=focusTarget;focusTarget=null;if(target?.isConnected)target.focus({preventScroll:true});
  const shouldGoBack=!fromHistory&&modalEntry();fromHistory=false;
  if(shouldGoBack){awaitingBack=true;try{browser.history.back();}catch{awaitingBack=false;}}
 });
 // A drag starting inside the card must not accidentally dismiss it.
 dialog.addEventListener('pointerdown',event=>{backdropPressed=event.target===dialog;});
 dialog.addEventListener('click',event=>{if(event.target===dialog&&backdropPressed)dismiss();backdropPressed=false;});
 browser.addEventListener('popstate',()=>{
  awaitingBack=false;
  if(dialog.open&&!modalEntry())dismiss(true);
  else if(!dialog.open&&modalEntry())show(false);
 });
 language.addEventListener('change',renderPhrase);
 copy.addEventListener('click',async()=>{
  const version=++copyVersion,text=phrase.textContent;copy.disabled=true;status.textContent='';
  try{
   if(!browser.navigator?.clipboard?.writeText)throw new Error('Clipboard unavailable');
   await browser.navigator.clipboard.writeText(text);
   if(version===copyVersion&&dialog.open)status.textContent=t.copied;
  }catch{
   if(version===copyVersion&&dialog.open){
    status.textContent=t.copyFailed;
    // Keep a usable manual route when browser clipboard permissions are denied.
    phrase.focus({preventScroll:true});
    try{const range=doc.createRange(),selection=doc.getSelection();range.selectNodeContents(phrase);selection.removeAllRanges();selection.addRange(range);}catch{}
   }
  }finally{if(version===copyVersion)copy.disabled=false;}
 });
 renderPhrase();root.dataset.receptionReady='true';opener.hidden=false;fallback.hidden=true;
 return true;
}
