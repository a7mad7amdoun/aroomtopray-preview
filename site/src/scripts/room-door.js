import { browseQuery, returnToDirectory } from '../lib/directory-context.js';
import { initRoomCycle, updateRoomSceneCount } from '../lib/room-cycle.js';

export const ROOM_PREVIEW_INTENT_DELAY = 120;

// Fixed panoramic glazing: only the destination scenery changes.
// Keep native links and each directory’s browsing context intact.
export function initRoomDoor(room, browser = window) {
  if (!room || room.dataset.doorReady === 'true') return;
  const outside = room.querySelector('.door-outside');
  const scenes = ['airport', 'campus', 'hospital'];
  const sceneName = room.querySelector('[data-room-scene-name]');
  const sceneIcon = room.querySelector('[data-room-scene-icon]');
  const notices = [...room.querySelectorAll('[data-door-preview]')];
  const artNodes=[...room.querySelectorAll('[data-home-scene]')].filter(node=>node.dataset.homeScene);
  const photoCredits=[...room.querySelectorAll('[data-home-photo-credit]')].filter(node=>node.dataset.homePhotoCredit);
  const sceneItems=artNodes.map(node=>{
    const category=node.dataset.homeScene.replace(/-2$/,'');
    const notice=notices.find(link=>link.dataset.doorPreview===category);
    return notice?{dataset:{...notice.dataset,homeScene:node.dataset.homeScene}}:null;
  }).filter(Boolean);
  let previewTimer=null;
  const cancelPreview=()=>{
    if(previewTimer!==null){browser.clearTimeout(previewTimer);previewTimer=null;}
  };
  const decodedPhotos = new WeakSet();
  const decodingPhotos = new WeakMap();
  let photoRequest = 0;
  const commitPreview = link => {
    // A category room keeps its location, even while choosing another destination.
    if (room.dataset.roomSetting !== 'home') return;
    const scene = link.dataset.doorPreview;
    if (!scenes.includes(scene)) return;
    // All scenery sits behind one stationary glass wall.
    if (outside) for (const name of scenes) outside.classList.toggle(`outside-${name}`, name === scene);
    room.dataset.roomPreview = scene;
    room.dataset.roomScene=link.dataset.homeScene||scene;
    artNodes.forEach(node=>{node.dataset.active=String(node.dataset.homeScene===room.dataset.roomScene);});
    photoCredits.forEach(node=>{node.hidden=node.dataset.homePhotoCredit!==room.dataset.roomScene;});
    notices.forEach(notice => notice.toggleAttribute?.('data-previewed', notice.dataset.doorPreview===scene));
    if (sceneName && link.dataset.sceneName) sceneName.textContent = link.dataset.sceneName;
    if (sceneIcon && link.dataset.sceneIcon) sceneIcon.setAttribute('href', `#i-${link.dataset.sceneIcon}`);
    if (link.dataset.sceneLabel) outside?.setAttribute('aria-label', link.dataset.sceneLabel);
    const activePhoto=artNodes.find(node=>node.dataset.homeScene===room.dataset.roomScene);
    if(activePhoto?.dataset.sceneDescription)outside?.setAttribute('aria-label',activePhoto.dataset.sceneDescription);
    updateRoomSceneCount(room,sceneItems.length?sceneItems:notices);
  };
  const preview = link => {
    if(room.dataset.roomSetting!=='home'||!scenes.includes(link.dataset.doorPreview))return false;
    const request=++photoRequest;
    const id=link.dataset.homeScene||link.dataset.doorPreview;
    room.dataset.roomRequestedScene=id;
    const image=artNodes.find(node=>node.dataset.homeScene===id)?.querySelector('img');
    if(!image||decodedPhotos.has(image)){commitPreview(link);return true;}
    // Loaded bytes can still await bitmap decoding. Never reveal an undecoded
    // first-use photograph or detach its predecessor while work is pending.
    image.loading='eager';
    if(!decodingPhotos.has(image)){
      const ready=typeof image.decode==='function'
        ? Promise.resolve().then(()=>image.decode())
        : image.complete
          ? (image.naturalWidth>0?Promise.resolve():Promise.reject(new Error('Photo unavailable')))
          : new Promise((resolve,reject)=>{image.addEventListener('load',resolve,{once:true});image.addEventListener('error',reject,{once:true});});
      decodingPhotos.set(image,ready.then(()=>{decodedPhotos.add(image);}).catch(error=>{decodingPhotos.delete(image);throw error;}));
    }
    return decodingPhotos.get(image).then(()=>{
      if(request!==photoRequest)return false;
      commitPreview(link);return true;
    }).catch(()=>{
      if(request===photoRequest)room.dataset.roomRequestedScene=room.dataset.roomScene||room.dataset.roomPreview;
      return false;
    });
  };
  notices.forEach(link => {
    // Passing across the notices is not a request to change the scenery.
    // Keyboard focus is deliberate; a pointer gets a short intent threshold.
    link.addEventListener('pointerenter', event => {
      cancelPreview();
      if(room.dataset.roomSetting!=='home' || event.pointerType==='touch' || room.ownerDocument?.hidden)return;
      previewTimer=browser.setTimeout(()=>{
        previewTimer=null;
        if(!room.ownerDocument?.hidden)preview(link);
      },ROOM_PREVIEW_INTENT_DELAY);
    });
    link.addEventListener('pointerleave',cancelPreview);
    link.addEventListener('pointercancel',cancelPreview);
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
  let beforeHeaderPreview=null;
  const cycle=initRoomCycle(room,browser,notices,preview,sceneItems.length?sceneItems:notices,{onManual:()=>{beforeHeaderPreview=null;}});
  if(sceneItems.length)preview(sceneItems.find(item=>item.dataset.homeScene===room.dataset.roomScene)||sceneItems[0]);
  const restoreHeader=()=>{
    if(beforeHeaderPreview){preview(beforeHeaderPreview);beforeHeaderPreview=null;}
    cycle?.setExternalPaused('header',false);
  };
  room.ownerDocument?.addEventListener('room:destination-preview',event=>{
    if(room.dataset.roomSetting!=='home'||event.detail?.source!=='header')return;
    const category=event.detail.scene;
    if(category===null){restoreHeader();return;}
    if(!scenes.includes(category)||room.ownerDocument?.hidden)return;
    const target=notices.find(link=>link.dataset.doorPreview===category);
    if(!target)return;
    cancelPreview();
    if(!beforeHeaderPreview){
      const current=room.dataset.roomRequestedScene||room.dataset.roomScene||room.dataset.roomPreview;
      beforeHeaderPreview=sceneItems.find(item=>item.dataset.homeScene===current)||notices.find(link=>link.dataset.doorPreview===room.dataset.roomPreview);
    }
    cycle?.setExternalPaused('header',true);
    preview(target);
  });
  browser.addEventListener('pagehide',restoreHeader);
  browser.addEventListener('pagehide',cancelPreview);
  room.ownerDocument?.addEventListener('visibilitychange',()=>{
    if(room.ownerDocument.hidden){cancelPreview();restoreHeader();}
  });
  room.dataset.doorReady = 'true';
}
if (typeof document !== 'undefined') initRoomDoor(document.querySelector('.room-environment'));
