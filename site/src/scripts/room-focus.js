// Room and guide now form one page. Retire saved preferences from both older layouts.
export const ROOM_FOCUS_KEY = 'aroomtopray.focus.v2';
const LEGACY_ROOM_FOCUS_KEY = 'aroomtopray.focus.v1';

export function initRoomFocus(doc = document, browser = window) {
  const restoreUnifiedPage = () => {
    delete doc.documentElement.dataset.roomFocus;
    const room = doc.querySelector('#prayer-room');
    if (room) room.hidden = false;
    try {
      browser.sessionStorage.removeItem(ROOM_FOCUS_KEY);
      browser.sessionStorage.removeItem(LEGACY_ROOM_FOCUS_KEY);
    } catch {
      // The complete page remains available when browser storage is blocked.
    }
  };
  // A cached page may still carry the former hidden-room state. Do not move focus,
  // scroll, or touch the guide's search, filters, tabs, or saved places.
  browser.addEventListener('pageshow', restoreUnifiedPage);
  restoreUnifiedPage();
}

if (typeof document !== 'undefined') initRoomFocus();
