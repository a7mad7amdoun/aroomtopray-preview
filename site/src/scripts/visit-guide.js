// Preparation tabs use the same native links and history as every other guide.
const checklist=document.querySelector('[data-visit-checklist]');
if(checklist){
 const boxes=[...checklist.querySelectorAll('[data-visit-check]')];
 const status=checklist.querySelector('[data-checklist-count]');
 const number=new Intl.NumberFormat(document.documentElement.lang);
 const update=()=>{status.textContent=`${number.format(boxes.filter(box=>box.checked).length)} / ${number.format(boxes.length)} ${status.dataset.label}`;};
 boxes.forEach(box=>box.addEventListener('change',update));
 window.addEventListener('pageshow',update);
 update();
}
