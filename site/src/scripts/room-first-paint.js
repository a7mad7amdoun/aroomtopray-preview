// Restore appearance and preload the CSS room background before styles load.
// Photographic views use responsive img loading, including the home window.
// This script never waits for artwork or hides the document.
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  try { if (localStorage.getItem('aroomtopray.reading.v1') === 'large') root.setAttribute('data-reading', 'large'); } catch {}
  let preference;
  try { preference = localStorage.getItem('aroomtopray.theme.v1'); } catch {}
  if (preference === 'light' || preference === 'dark') root.setAttribute('data-theme', preference);
  const dark = preference === 'dark' || (preference !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0a111c' : '#e8edf3');
  if (new URLSearchParams(window.location.search).has('report')) root.dataset.guideReportIntent = 'true';
  try {
    sessionStorage.removeItem('aroomtopray.focus.v2');
    sessionStorage.removeItem('aroomtopray.focus.v1');
  } catch {}

  const settings = document.currentScript?.dataset || {};
  const mode = dark ? 'night' : 'day';
  const folder = settings.arrivalPresentation === 'home' ? 'artful-room' : dark ? 'arrival-room' : 'daylight-room';
  const density = window.devicePixelRatio || 1;
  const small = window.matchMedia('(max-width: 760px)').matches;
  const roomWidth = small && density <= 1 ? 1024 : 1774;
  const paths = [`${folder}/${mode}-${roomWidth}.webp`];
  for (const path of paths) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.type = 'image/webp';
    link.href = '/art/' + path;
    document.head.append(link);
  }
})();
