// Classic head script: restore appearance and request the two arrival images
// before styles/modules load. It never waits for artwork or hides the document.
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  let preference;
  try { preference = localStorage.getItem('aroomtopray.theme.v1'); } catch {}
  if (preference === 'light' || preference === 'dark') root.setAttribute('data-theme', preference);
  const dark = preference === 'dark' || (preference !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0a111c' : '#f6f7f7');
  if (new URLSearchParams(window.location.search).has('report')) root.dataset.guideReportIntent = 'true';
  try {
    sessionStorage.removeItem('aroomtopray.focus.v2');
    sessionStorage.removeItem('aroomtopray.focus.v1');
  } catch {}

  const settings = document.currentScript?.dataset || {};
  const mode = dark ? 'night' : 'day';
  const folder = settings.arrivalPresentation === 'home' ? 'artful-room' : dark ? 'arrival-room' : 'daylight-room';
  const scene = { airports: 'airport', universities: 'campus', hospitals: 'hospital' }[settings.arrivalKind] || 'airport';
  const density = window.devicePixelRatio || 1;
  const small = window.matchMedia('(max-width: 760px)').matches;
  const roomWidth = small && density <= 1 ? 1024 : 1774;
  const largeGlass = window.matchMedia('(min-width: 1001px)').matches;
  const sceneWidth = density <= 1 ? 800 : largeGlass && scene !== 'hospital' ? 2048 : 1400;
  const paths = [`${folder}/${mode}-${roomWidth}.webp`, `real-views/${scene}-${sceneWidth}.webp`];
  for (const path of paths) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.type = 'image/webp';
    link.href = '/art/' + path;
    document.head.append(link);
  }
})();
