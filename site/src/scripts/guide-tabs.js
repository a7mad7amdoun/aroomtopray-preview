import {tabIndexForKey,panelIndexForTarget} from '../lib/guide-navigation.js';
// Progressive enhancement: without JavaScript every section and anchor remains available.
for (const root of document.querySelectorAll('[data-guide-tabs]')) {
 const nav=[...root.querySelectorAll('[data-guide-tablist]')].find(el=>el.closest('[data-guide-tabs]')===root);
 if(!nav)continue;
 const tabs=[...nav.querySelectorAll('[data-guide-tab]')];
 const panels=tabs.map(tab=>document.getElementById(tab.dataset.guideTab));
 if(panels.some(panel=>!panel||!root.contains(panel)))continue;
 let active=0;
 root.dataset.guideEnhanced='true';nav.setAttribute('role','tablist');
 tabs.forEach((tab,i)=>{tab.setAttribute('role','tab');tab.setAttribute('aria-controls',panels[i].id);panels[i].setAttribute('role','tabpanel');panels[i].setAttribute('aria-labelledby',tab.id);panels[i].tabIndex=0;});
 function select(index,{focus=false,write=false}={}) {
  active=index;
  tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;panels[i].hidden=i!==index;});
  if(focus)tabs[index].focus();
  if(write && location.hash!=='#'+panels[index].id)history.pushState({},'',location.pathname+location.search+'#'+panels[index].id);
  root.dispatchEvent(new CustomEvent('guide:change',{detail:{panel:panels[index].id}}));
 }
 function revealHash(scroll=false) {
  let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
  const target=document.getElementById(id);
  const index=panelIndexForTarget(panels,target);
  if(index<0)return;
  select(index);
  for(let node=target;node&&node!==root;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;
  if(scroll)requestAnimationFrame(()=>target.scrollIntoView({block:'start',behavior:'instant'}));
 }
 tabs.forEach((tab,i)=>{
  tab.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();select(i,{write:true});});
  tab.addEventListener('keydown',event=>{
   if(event.key===' '){event.preventDefault();select(i,{write:true});return;}
   const rtl=getComputedStyle(nav).direction==='rtl';
   const next=tabIndexForKey(event.key,i,tabs.length,rtl);
   if(next!==null){event.preventDefault();select(next,{focus:true,write:true});}
  });
 });
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[href^="#"]');
  if(link&&!link.hasAttribute('data-guide-tab'))setTimeout(()=>revealHash(true),0);
 });
 window.addEventListener('hashchange',()=>revealHash(true));
 window.addEventListener('popstate',()=>{if(!location.hash)select(0);else revealHash();});
 window.addEventListener('beforeprint',()=>panels.forEach(panel=>panel.hidden=false));
 window.addEventListener('afterprint',()=>select(active));
 const reportPanel=new URLSearchParams(location.search).has('report')?panels.findIndex(panel=>panel.querySelector('[data-report]')):-1;
 select(reportPanel>=0?reportPanel:0);revealHash(Boolean(location.hash));
}
