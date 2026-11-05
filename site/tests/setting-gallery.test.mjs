import test from 'node:test';
import assert from 'node:assert/strict';
import {initSettingGallery} from '../src/scripts/setting-gallery.js';
function fixture({rtl=false,reduced=false}={}) {
 let offset=0;const handlers=new Map();
 const previous={disabled:false,addEventListener:(type,fn)=>handlers.set('previous',fn)};
 const next={disabled:false,addEventListener:(type,fn)=>handlers.set('next',fn)};
 const status={dataset:{locale:rtl?'ar':'en',of:rtl?'من':'of'},textContent:''};
 const controls={hidden:true};
 const rect=index=>rtl?{left:100-index*920-offset,right:1000-index*920-offset}:{left:index*920-offset,right:index*920-offset+900};
 const slides=[0,1,2].map(index=>({getBoundingClientRect:()=>rect(index)}));
 const calls=[];
 const track={getBoundingClientRect:()=>({left:0,right:1000}),addEventListener:(type,fn)=>handlers.set(type,fn),scrollBy:options=>{calls.push(options);offset+=options.left;}};
 const map={'[data-photo-track]':track,'[data-photo-controls]':controls,'[data-photo-step="-1"]':previous,'[data-photo-step="1"]':next,'[data-photo-status]':status};
 const root={dir:rtl?'rtl':'ltr',dataset:{},querySelector:selector=>map[selector],querySelectorAll:()=>slides};
 const browser={matchMedia:()=>({matches:reduced}),addEventListener(){},requestAnimationFrame:fn=>{handlers.set('frame',fn);return 1;}};
 return {root,browser,previous,next,status,controls,handlers,calls};
}
for(const rtl of [false,true])test(`photo navigation respects ${rtl?'RTL':'LTR'}, boundaries and manual scrolling`,()=>{
 const f=fixture({rtl});const api=initSettingGallery(f.root,f.browser);
 assert.equal(f.controls.hidden,false);assert.equal(f.previous.disabled,true);
 f.handlers.get('next')();assert.equal(f.calls[0].left,rtl?-920:920);assert.equal(f.calls[0].behavior,'smooth');
 api.update();assert.equal(f.previous.disabled,false);assert.equal(f.next.disabled,false);
 f.handlers.get('next')();api.update();assert.equal(f.next.disabled,true);
 f.handlers.get('previous')();api.update();assert.equal(f.next.disabled,false);
 assert.equal(initSettingGallery(f.root,f.browser),undefined);
});
test('reduced motion uses immediate photo navigation',()=>{
 const f=fixture({reduced:true});initSettingGallery(f.root,f.browser);f.handlers.get('next')();assert.equal(f.calls[0].behavior,'instant');
});
