import { readSaved } from '../lib/saved-places.js';
import { returnToDirectory } from '../lib/directory-context.js';
document.querySelectorAll('[data-directory-return]').forEach(link => {
  const target = returnToDirectory(link.getAttribute('href'), location.search);
  if (target) {
    link.href = target;
    link.textContent = link.dataset.directoryReturn;
    link.classList.add('return-to-results');
  }
});
const count = document.querySelector('[data-saved-count]');
const update = () => { if (!count) return; try { const n = readSaved(localStorage).length; count.textContent = String(n); count.hidden = n === 0; } catch { count.hidden = true; } };
window.addEventListener('storage', update); window.addEventListener('saved-places-change', update); update();
const menu=document.querySelector('[data-site-menu]');
const currentDestination=document.querySelector('.primary-navigation a[aria-current]')?.getAttribute('href');
menu?.querySelectorAll('.menu-destinations>a').forEach(link=>{
  if(link.getAttribute('href')===currentDestination)link.setAttribute('aria-current','page');
});
const closeMenu=()=>{if(menu)menu.open=false;};
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu?.open){closeMenu();menu.querySelector('summary').focus();}});
document.addEventListener('click',event=>{if(menu&&!menu.contains(event.target))closeMenu();});
menu?.addEventListener('focusout',event=>{if(event.relatedTarget&&!menu.contains(event.relatedTarget))closeMenu();});
window.addEventListener('pageshow',closeMenu);
menu?.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
document.querySelectorAll('[data-print]').forEach(b => { b.hidden = false; b.addEventListener('click', () => window.print()); });
let expanded = [];
window.addEventListener('beforeprint', () => { expanded = [...document.querySelectorAll('details[data-print-expand]:not([open])')]; expanded.forEach(d => d.open = true); });
window.addEventListener('afterprint', () => { expanded.forEach(d => d.open = false); expanded = []; });
