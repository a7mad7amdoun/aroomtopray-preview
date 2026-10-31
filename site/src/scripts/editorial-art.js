// Use one picture source at a time, respecting both manual and system appearance.
const system=window.matchMedia('(prefers-color-scheme: dark)');
function refreshArtwork() {
 const preference=document.documentElement.dataset.theme;
 const dark=preference==='dark'||(preference!=='light'&&system.matches);
 document.querySelectorAll('[data-editorial-dark]').forEach(source=>{
  source.media=dark?'all':'not all';
 });
}
refreshArtwork();
window.addEventListener('themechange',refreshArtwork);
system.addEventListener('change',refreshArtwork);
