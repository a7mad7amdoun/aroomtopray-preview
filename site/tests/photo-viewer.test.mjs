import test from 'node:test';
import assert from 'node:assert/strict';
import {initPhotoViewer} from '../src/scripts/photo-viewer.js';

// These exercise our enhancement lifecycle, not the browser's native modal trap.
function fixture({supported=true,throws=false,deferredClose=false}={}) {
 let focused=null,opened=0,pendingClose=0;
 const element=name=>({name,dataset:{},attributes:{},listeners:{},children:[],style:{},isConnected:true,
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);},
  emit(type,props={}){const e={target:this,button:0,defaultPrevented:false,preventDefault(){this.defaultPrevented=true},...props};(this.listeners[type]||[]).forEach(fn=>fn(e));return e;},
  click(){return this.emit('click');},focus(){focused=name;},
  setAttribute(key,value){this.attributes[key]=value;},removeAttribute(key){delete this.attributes[key];},
  append(...children){this.children.push(...children);},replaceChildren(...children){this.children=children;},
  querySelectorAll(){return[];},cloneNode(){return {...element(name+'-copy'),attributes:{...this.attributes}};},
 });
 const root=element('root'),dialog=element('dialog'),body=element('body'),close=element('close'),link=element('photo'),hint=element('hint'),figure=element('figure'),image=element('image'),caption=element('caption');
 hint.attributes.hidden='';link.dataset.photoLabel='Enlarge: documented room';link.dataset.photoWidth='1000';link.attributes.href='https://commons.wikimedia.org/wiki/File:Example.jpg';
 image.attributes={src:'/photos/real.webp',srcset:'/photos/real.webp 1440w',alt:'Original room details'};
 caption.attributes={'data-credit':'Photographer · CC BY-SA · original source',id:'optional-caption-id'};
 const doc={documentElement:{style:{overflow:'clip'}},createElement:()=>element('created-figure')};root.ownerDocument=doc;
 root.querySelector=selector=>selector==='[data-photo-dialog]'?dialog:null;
 root.querySelectorAll=()=>[link];
 dialog.id='photo-dialog';dialog.open=false;
 dialog.querySelector=selector=>selector==='[data-photo-dialog-body]'?body:selector==='[data-photo-close]'?close:null;
 if(supported)dialog.showModal=()=>{if(throws)throw new Error('Unavailable');opened++;dialog.open=true;};
 dialog.close=()=>{dialog.open=false;if(deferredClose)pendingClose++;else dialog.emit('close');};
 link.closest=()=>figure;link.querySelector=()=>hint;
 figure.querySelector=selector=>selector==='.place-photo-image img'?image:selector==='figcaption'?caption:null;
 return {root,dialog,body,close,link,hint,image,caption,doc,flushClose(){assert.ok(pendingClose>0);pendingClose--;dialog.emit('close');},get focused(){return focused},get opened(){return opened}};
}

test('photo enhancement is optional, does not open on load and is idempotent',()=>{
 const f=fixture();assert.equal(initPhotoViewer(f.root),true);assert.equal(initPhotoViewer(f.root),false);
 assert.equal(f.opened,0);assert.equal(f.focused,null);assert.equal(f.doc.documentElement.style.overflow,'clip');
 assert.equal(f.link.listeners.click.length,1);assert.equal(f.link.attributes['aria-haspopup'],'dialog');assert.equal(f.hint.attributes.hidden,undefined);
 const unsupported=fixture({supported:false});assert.equal(initPhotoViewer(unsupported.root),false);
 assert.equal(unsupported.link.attributes.role,undefined);assert.equal(unsupported.hint.attributes.hidden,'');assert.ok(unsupported.link.attributes.href.startsWith('https:'));
});
test('inspection preserves the image and credits, then restores focus and scrolling',()=>{
 const f=fixture();initPhotoViewer(f.root);const click=f.link.click();
 assert.equal(click.defaultPrevented,true);assert.equal(f.dialog.open,true);assert.equal(f.focused,'close');assert.equal(f.doc.documentElement.style.overflow,'hidden');
 const [photo,credit]=f.body.children[0].children;
 assert.equal(photo.attributes.src,f.image.attributes.src);assert.equal(photo.attributes.srcset,f.image.attributes.srcset);assert.equal(photo.loading,'eager');
 assert.equal(photo.style.maxWidth,'1000px','Do not stretch a smaller photograph past its available resolution');
 assert.equal(credit.attributes['data-credit'],f.caption.attributes['data-credit']);assert.equal(credit.attributes.id,undefined);
 assert.equal(f.caption.attributes.id,'optional-caption-id','Original caption remains untouched');
 f.close.click();assert.equal(f.dialog.open,false);assert.equal(f.focused,'photo');assert.equal(f.doc.documentElement.style.overflow,'clip');assert.equal(f.body.children.length,0);
});
test('Escape cancellation follows the same cleanup and focus restoration',()=>{
 const f=fixture();initPhotoViewer(f.root);f.link.click();const cancel=f.dialog.emit('cancel');
 assert.equal(cancel.defaultPrevented,true);assert.equal(f.dialog.open,false);assert.equal(f.focused,'photo');assert.equal(f.doc.documentElement.style.overflow,'clip');
});
test('modified clicks retain original source navigation',()=>{
 for(const props of [{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{button:1}]){
  const f=fixture();initPhotoViewer(f.root);assert.equal(f.link.emit('click',props).defaultPrevented,false);assert.equal(f.opened,0);
 }
});
test('Escape key closes embedded viewers even without a native cancel event',()=>{
 const f=fixture();initPhotoViewer(f.root);f.link.click();
 assert.equal(f.dialog.emit('keydown',{key:'Escape',isComposing:true}).defaultPrevented,false);
 assert.equal(f.dialog.open,true,'IME composition remains untouched');
 assert.equal(f.dialog.emit('keydown',{key:'Escape'}).defaultPrevented,true);
 assert.equal(f.dialog.open,false);assert.equal(f.focused,'photo');assert.equal(f.doc.documentElement.style.overflow,'clip');
 assert.equal(f.dialog.emit('keydown',{key:'Escape'}).defaultPrevented,false,'Closed dialog does not consume Escape');
});
test('failure to open a dialog leaves the original source link usable',()=>{
 const f=fixture({throws:true});initPhotoViewer(f.root);assert.equal(f.link.click().defaultPrevented,false);
 assert.equal(f.body.children.length,0);assert.equal(f.focused,null);assert.equal(f.doc.documentElement.style.overflow,'clip');assert.ok(f.link.attributes.href.startsWith('https:'));
});
test('Space activates the enhanced image control',()=>{
 const f=fixture();initPhotoViewer(f.root);const event=f.link.emit('keydown',{key:' '});
 assert.equal(event.defaultPrevented,true);assert.equal(f.dialog.open,true);assert.equal(f.opened,1);
});
test('backdrop dismissal requires the interaction to start on the backdrop',()=>{
 const f=fixture();initPhotoViewer(f.root);f.link.click();
 f.dialog.emit('pointerdown',{target:f.body});f.dialog.emit('click');assert.equal(f.dialog.open,true);
 f.dialog.emit('pointerdown');f.dialog.emit('click');assert.equal(f.dialog.open,false);assert.equal(f.focused,'photo');
});
test('a queued close event cannot clear a reopened photo or lose the original scroll state',()=>{
 const f=fixture({deferredClose:true});initPhotoViewer(f.root);f.link.click();
 f.close.click();assert.equal(f.dialog.open,false);
 f.image.attributes.src='/photos/second-real.webp';
 f.link.click();assert.equal(f.dialog.open,true);assert.equal(f.opened,2);
 const reopenedFigure=f.body.children[0];
 f.flushClose();
 assert.equal(f.dialog.open,true);assert.equal(f.body.children[0],reopenedFigure);
 assert.equal(reopenedFigure.children[0].attributes.src,'/photos/second-real.webp');
 assert.equal(f.doc.documentElement.style.overflow,'hidden');assert.equal(f.focused,'close');
 f.close.click();f.flushClose();
 assert.equal(f.body.children.length,0);assert.equal(f.doc.documentElement.style.overflow,'clip');assert.equal(f.focused,'photo');
});
