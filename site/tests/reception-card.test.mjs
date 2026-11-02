import test from 'node:test';
import assert from 'node:assert/strict';
import {initReceptionCard} from '../src/scripts/reception-card.js';
import {RECEPTION_COPY,RECEPTION_PHRASES,RECEPTION_LANGUAGES} from '../src/data/reception-copy.js';

// Native <dialog>.showModal() owns focus containment and page inertness.
// These checks cover our progressive enhancement, copy and history lifecycle.
function fixture({locale='en',supported=true,throws=false,historyDenied=false,clipboard,initialState}={}) {
 let focused=null,selected=null,scrollLocks=0;
 const listeners={};
 const element=name=>({name,dataset:{},hidden:false,disabled:false,isConnected:true,listeners:{},textContent:'',value:'',
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);},
  emit(type,props={}){const event={target:this,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},...props};event.done=Promise.all((this.listeners[type]||[]).map(fn=>fn(event)));return event;},
  focus(){focused=name;doc.activeElement=this;},
 });
 const root=element('root'),dialog=element('dialog'),opener=element('opener'),fallback=element('fallback'),close=element('close'),language=element('language'),phrase=element('phrase'),copy=element('copy'),status=element('status');
 const doc={activeElement:null,documentElement:{style:{overflow:'clip'}},createRange:()=>({selectNodeContents(node){selected=node.textContent;}}),getSelection:()=>({removeAllRanges(){},addRange(){}})};
 root.ownerDocument=doc;root.dataset={locale,receptionId:'reception-test'};language.value=locale;opener.hidden=true;dialog.open=false;
 const nodes={'[data-reception-dialog]':dialog,'[data-reception-open]':opener,'[data-reception-fallback]':fallback,'[data-reception-close]':close,'[data-reception-language]':language,'[data-reception-phrase]':phrase,'[data-reception-copy]':copy,'[data-reception-status]':status};
 root.querySelector=selector=>nodes[selector]||null;
 if(supported)dialog.showModal=()=>{if(throws)throw Error('Not available');dialog.open=true;scrollLocks++;};
 dialog.close=()=>{if(dialog.open){dialog.open=false;dialog.emit('close');}};
 const originalState=initialState||{country:'CA',query:'airport'},href='https://example.test/preview/?country=CA#countries';
 const entries=[{state:originalState,href}];let index=0;
 const browser={location:{href},navigator:{clipboard:clipboard??{writeText:async()=>{}}},addEventListener(type,fn){(listeners[type]??=[]).push(fn);},
  history:{
   get state(){return entries[index].state;},
   pushState(state,unused,url){if(historyDenied)throw Error('Denied');entries.splice(index+1);entries.push({state,href:url});index++;},
   back(){if(index>0){index--;for(const fn of listeners.popstate||[])fn({state:this.state});}},
   forward(){if(index<entries.length-1){index++;for(const fn of listeners.popstate||[])fn({state:this.state});}},
  },
 };
 return {root,dialog,opener,fallback,close,language,phrase,copy,status,doc,browser,entries,originalState,get index(){return index;},get focused(){return focused;},get selected(){return selected;},get openings(){return scrollLocks;}};
}

test('staff request provides four independent translations with correct writing direction',()=>{
 assert.deepEqual(RECEPTION_LANGUAGES.map(item=>item.code),['en','fr','ar','es']);
 for(const language of RECEPTION_LANGUAGES){assert.ok(RECEPTION_PHRASES[language.code].length>20);assert.ok(RECEPTION_COPY[language.code].copyFailed);assert.equal(language.dir,language.code==='ar'?'rtl':'ltr');}
});

test('enhancement is optional and idempotent, leaving no-JS phrases available when unsupported',()=>{
 const f=fixture();assert.equal(initReceptionCard(f.root,f.browser),true);assert.equal(initReceptionCard(f.root,f.browser),false);
 assert.equal(f.opener.hidden,false);assert.equal(f.fallback.hidden,true);assert.equal(f.dialog.open,false);assert.equal(f.entries.length,1);assert.equal(f.opener.listeners.click.length,1);
 const u=fixture({supported:false});assert.equal(initReceptionCard(u.root,u.browser),false);assert.equal(u.opener.hidden,true);assert.equal(u.fallback.hidden,false);
 const broken=fixture({throws:true});initReceptionCard(broken.root,broken.browser);broken.opener.emit('click');
 assert.equal(broken.fallback.hidden,false);assert.equal(broken.fallback.open,true);assert.equal(broken.doc.documentElement.style.overflow,'clip');assert.equal(broken.entries.length,1);
});

test('opening and closing preserve existing URL context, scroll lock and trigger focus',()=>{
 const f=fixture();initReceptionCard(f.root,f.browser);f.opener.emit('click');
 assert.equal(f.dialog.open,true);assert.equal(f.focused,'close');assert.equal(f.doc.documentElement.style.overflow,'hidden');assert.equal(f.index,1);
 assert.equal(f.entries[1].href,f.browser.location.href);assert.equal(f.browser.history.state.country,'CA');assert.equal(f.browser.history.state.query,'airport');
 f.opener.emit('click');assert.equal(f.openings,1);f.close.emit('click');
 assert.equal(f.dialog.open,false);assert.equal(f.doc.documentElement.style.overflow,'clip');assert.equal(f.focused,'opener');assert.equal(f.index,0);assert.deepEqual(f.browser.history.state,f.originalState);
});

test('browser Back closes the card, Forward reopens it and Escape restores the previous entry',()=>{
 const f=fixture();initReceptionCard(f.root,f.browser);f.opener.emit('click');f.browser.history.back();
 assert.equal(f.dialog.open,false);assert.equal(f.index,0);assert.equal(f.focused,'opener');
 f.browser.history.forward();assert.equal(f.dialog.open,true);assert.equal(f.index,1);assert.equal(f.entries.length,2);assert.equal(f.focused,'close');
 const event=f.dialog.emit('cancel');assert.equal(event.defaultPrevented,true);assert.equal(f.dialog.open,false);assert.equal(f.index,0);
});

test('refreshing an open card cannot make an older history marker reopen the new card on close',async()=>{
 // Fresh module instances reproduce the counter reset that occurs on a reload.
 const previousModule=await import('../src/scripts/reception-card.js?document=before-refresh');
 const nextModule=await import('../src/scripts/reception-card.js?document=after-refresh');
 const previous=fixture();previousModule.initReceptionCard(previous.root,previous.browser);previous.opener.emit('click');
 const retainedState={...previous.browser.history.state};
 const refreshed=fixture({initialState:retainedState});nextModule.initReceptionCard(refreshed.root,refreshed.browser);
 assert.equal(refreshed.dialog.open,false,'A previous modal entry must not open the request on load');
 refreshed.opener.emit('click');assert.equal(refreshed.dialog.open,true);refreshed.close.emit('click');
 assert.equal(refreshed.dialog.open,false);assert.equal(refreshed.openings,1);assert.equal(refreshed.focused,'opener');
 assert.equal(refreshed.doc.documentElement.style.overflow,'clip');assert.deepEqual(refreshed.browser.history.state,retainedState);
 refreshed.browser.history.forward();assert.equal(refreshed.dialog.open,true,'The new document’s own modal entry still supports Forward');
 refreshed.browser.history.back();assert.equal(refreshed.dialog.open,false);
});

test('backdrop dismissal requires the pointer to start outside the card',()=>{
 const f=fixture();initReceptionCard(f.root,f.browser);f.opener.emit('click');
 f.dialog.emit('pointerdown',{target:f.phrase});f.dialog.emit('click');assert.equal(f.dialog.open,true);
 f.dialog.emit('pointerdown');f.dialog.emit('click');assert.equal(f.dialog.open,false);assert.equal(f.focused,'opener');
});

test('request language can change independently of site language and copied text follows it',async()=>{
 const writes=[],f=fixture({locale:'fr',clipboard:{writeText:async value=>writes.push(value)}});initReceptionCard(f.root,f.browser);f.opener.emit('click');
 assert.equal(f.phrase.lang,'fr');f.language.value='ar';f.language.emit('change');
 assert.equal(f.phrase.lang,'ar');assert.equal(f.phrase.dir,'rtl');assert.equal(f.phrase.textContent,RECEPTION_PHRASES.ar);assert.equal(f.root.dataset.locale,'fr');
 await f.copy.emit('click').done;assert.deepEqual(writes,[RECEPTION_PHRASES.ar]);assert.equal(f.status.textContent,RECEPTION_COPY.fr.copied);
 f.language.value='es';f.language.emit('change');assert.equal(f.phrase.dir,'ltr');assert.equal(f.status.textContent,'');
});

test('denied clipboard offers selectable text and a localized explanation',async()=>{
 const f=fixture({locale:'ar',clipboard:{writeText:async()=>{throw Error('Denied');}}});initReceptionCard(f.root,f.browser);f.opener.emit('click');
 await f.copy.emit('click').done;assert.equal(f.status.textContent,RECEPTION_COPY.ar.copyFailed);assert.equal(f.selected,RECEPTION_PHRASES.ar);assert.equal(f.focused,'phrase');assert.equal(f.copy.disabled,false);assert.equal(f.dialog.open,true);
});

test('stale clipboard promises cannot announce the wrong language or leave copy disabled',async()=>{
 let finish;const f=fixture({clipboard:{writeText:()=>new Promise(resolve=>{finish=resolve;})}});initReceptionCard(f.root,f.browser);f.opener.emit('click');
 const pending=f.copy.emit('click');assert.equal(f.copy.disabled,true);f.language.value='ar';f.language.emit('change');finish();await pending.done;
 assert.equal(f.status.textContent,'');assert.equal(f.copy.disabled,false);assert.equal(f.phrase.lang,'ar');
});

test('denied history writes do not prevent opening, copying or closing the request',async()=>{
 const f=fixture({historyDenied:true});initReceptionCard(f.root,f.browser);f.opener.emit('click');assert.equal(f.dialog.open,true);assert.equal(f.entries.length,1);
 await f.copy.emit('click').done;assert.equal(f.status.textContent,RECEPTION_COPY.en.copied);f.close.emit('click');assert.equal(f.dialog.open,false);assert.equal(f.doc.documentElement.style.overflow,'clip');assert.deepEqual(f.browser.history.state,f.originalState);
});
