import { browseQuery, returnToDirectory } from '../lib/directory-context.js';
import { initRoomCycle } from '../lib/room-cycle.js';
import { initDoorArrival } from '../lib/door-arrival.js';

export const ROOM_PREVIEW_INTENT_DELAY = 180;

// The moving leaf is decorative. Wayfinding and controls stay on the wall.
export function initRoomDoor(room, browser = window) {
  if (!room || room.dataset.doorReady === 'true') return;
  const control = room.querySelector('[data-door-toggle]');
  const label = room.querySelector('[data-door-toggle-label]');
  const outside = room.querySelector('.door-outside');
  const scenes = ['airport', 'campus', 'hospital'];
  const sceneName = room.querySelector('[data-room-scene-name]');
  const sceneIcon = room.querySelector('[data-room-scene-icon]');
  const notices = [...room.querySelectorAll('[data-door-preview]')];
  const initiallyOpen = room.dataset.doorState === 'open';
  let cycle,previewTimer=null;
  const cancelPreview=()=>{
    if(previewTimer!==null){browser.clearTimeout(previewTimer);previewTimer=null;}
  };
  const setOpen = open => {
    cancelPreview();
    room.dataset.doorState = open ? 'open' : 'closed';
    control?.setAttribute('aria-expanded', String(open));
    if (label && control) label.textContent = open ? control.dataset.closeLabel : control.dataset.openLabel;
    cycle?.sync();
  };
  const preview = link => {
    // A category room keeps its location, even while choosing another destination.
    if (room.dataset.roomSetting !== 'home') return;
    const scene = link.dataset.doorPreview;
    if (!scenes.includes(scene)) return;
    // One stationary scene is seen through the actual opening in the moving leaf.
    if (outside) for (const name of scenes) outside.classList.toggle(`outside-${name}`, name === scene);
    room.dataset.roomPreview = scene;
    notices.forEach(notice => notice.toggleAttribute?.('data-previewed', notice === link));
    if (sceneName && link.dataset.sceneName) sceneName.textContent = link.dataset.sceneName;
    if (sceneIcon && link.dataset.sceneIcon) sceneIcon.setAttribute('href', `#i-${link.dataset.sceneIcon}`);
    if (link.dataset.sceneLabel) outside?.setAttribute('aria-label', link.dataset.sceneLabel);
  };
  setOpen(initiallyOpen);
  if (control) {
    control.hidden = false;
    control.addEventListener('pointerdown',cancelPreview);
    control.addEventListener('focus',cancelPreview);
    control.addEventListener('click', () => setOpen(room.dataset.doorState !== 'open'));
  }
  notices.forEach(link => {
    // Passing across the notices is not a request to change the scenery.
    // Keyboard focus is deliberate; a pointer gets a short intent threshold.
    link.addEventListener('pointerenter', event => {
      cancelPreview();
      if(room.dataset.roomSetting!=='home' || event.pointerType==='touch')return;
      previewTimer=browser.setTimeout(()=>{previewTimer=null;preview(link);},ROOM_PREVIEW_INTENT_DELAY);
    });
    link.addEventListener('pointerleave',cancelPreview);
    link.addEventListener('pointerdown',cancelPreview);
    link.addEventListener('click',cancelPreview);
    link.addEventListener('focus', () => {cancelPreview();preview(link);});
    // Keep the current category's country, filters, map selection and result page.
    // Other categories must not inherit incompatible filters.
    if (link.dataset.doorDestination !== room.dataset.roomSetting) return;
    const path = link.getAttribute('href');
    const syncContext = () => {
      const location = browser.location;
      if (!location) return;
      const back = returnToDirectory(path, location.search);
      const query = location.pathname === path ? browseQuery(location.search) : '';
      link.setAttribute('href', back || (query ? `${path}?${query}` : path));
      const returnLabel = link.querySelector('[data-door-return-label]');
      if (returnLabel) {
        returnLabel.hidden = !back;
        returnLabel.textContent = back ? link.dataset.returnLabel : '';
      }
    };
    syncContext();
    link.addEventListener('focus', syncContext);
    link.addEventListener('pointerenter', syncContext);
    link.addEventListener('pointerdown', syncContext);
    link.addEventListener('click', syncContext);
    browser.addEventListener('pageshow', syncContext);
    browser.addEventListener('popstate', syncContext);
    // These events are dispatched on document by the directory and atlas.
    // Keep copied/open-in-new-tab links current before the next pointer action.
    room.ownerDocument?.addEventListener('directory:updated', syncContext);
    room.ownerDocument?.addEventListener('atlas:selection', syncContext);
  });
  // Exploring is an explicit request to see the views. Open a closed door
  // before starting; ordinary restoration and hover never do this.
  cycle=initRoomCycle(room,browser,notices,preview,()=>setOpen(true));
  browser.addEventListener('pagehide',cancelPreview);
  initDoorArrival(room,browser,setOpen);
  // Restored pages keep their door state; navigation is always immediate.
  browser.addEventListener('pageshow', () => setOpen(room.dataset.doorState === 'open'));
  room.dataset.doorReady = 'true';
}
if (typeof document !== 'undefined') initRoomDoor(document.querySelector('.room-environment'));
