export const ROOM_FOCUS_KEY = 'aroomtopray.focus.v1';

export function initRoomFocus(doc = document, browser = window) {
  const root = doc.documentElement;
  const enter = doc.querySelector('[data-room-focus-enter]');
  const exit = doc.querySelector('[data-room-focus-exit]');
  const toolbar = doc.querySelector('[data-room-focus-toolbar]');
  const main = doc.querySelector('#main');
  const room = doc.querySelector('#prayer-room');
  const door = doc.querySelector('[data-door-toggle]');
  if (!enter || !exit || !toolbar || !main) return;

  const update = (focused, moveFocus = false) => {
    root.dataset.roomFocus = String(focused);
    toolbar.hidden = !focused;
    if (!moveFocus) return;
    // No navigation or replacement of content: searches, tabs and saved tools survive.
    const target = focused ? exit : (door || enter);
    target.focus({ preventScroll:true });
    if (!focused && room) room.scrollIntoView({ block:'start', behavior:'instant' });
    else target.scrollIntoView({ block:'nearest', behavior:'instant' });
  };
  // Focus is deliberately page-local. A saved preference must never make the
  // defining room experience disappear on a fresh page or after a refresh.
  try { browser.sessionStorage.removeItem(ROOM_FOCUS_KEY); } catch {}
  enter.hidden = false;
  exit.hidden = false;
  enter.addEventListener('click', () => update(true, true));
  exit.addEventListener('click', () => update(false, true));
  browser.addEventListener('pageshow', () => update(root.dataset.roomFocus === 'true'));
  update(false);
}
if (typeof document !== 'undefined') initRoomFocus();
