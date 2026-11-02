// Session preference: both choices always remain visible in the header.
export const ROOM_FOCUS_KEY = 'aroomtopray.focus.v2';
export function initRoomFocus(doc = document, browser = window) {
  const root = doc.documentElement;
  const switcher = doc.querySelector('[data-room-view-switch]');
  const enter = doc.querySelector('[data-room-focus-enter]');
  const exit = doc.querySelector('[data-room-focus-exit]');
  const main = doc.querySelector('#main');
  const room = doc.querySelector('#prayer-room');
  const door = doc.querySelector('[data-door-toggle]');
  if (!switcher || !enter || !exit || !main || !room) return;
  const read = () => {
    try { const value=browser.sessionStorage.getItem(ROOM_FOCUS_KEY); if(value==='true'||value==='false')return value==='true'; } catch {}
    return root.dataset.roomFocus==='true';
  };
  const update = (focused, interact = false) => {
    root.dataset.roomFocus=String(focused);
    enter.setAttribute('aria-pressed',String(focused));
    exit.setAttribute('aria-pressed',String(!focused));
    room.hidden=focused;
    if (!interact) return;
    try { browser.sessionStorage.setItem(ROOM_FOCUS_KEY,String(focused)); } catch {}
    const target=focused?main:(door||exit);
    target.focus({preventScroll:true});
    (focused?main:room).scrollIntoView({block:'start',behavior:'instant'});
  };
  switcher.hidden=false;
  enter.addEventListener('click',()=>update(true,true));
  exit.addEventListener('click',()=>update(false,true));
  // bfcache restores the latest choice from this tab, without stealing focus.
  browser.addEventListener('pageshow',()=>update(read()));
  update(read());
}
if(typeof document!=='undefined') initRoomFocus();
