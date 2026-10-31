import { PLACE_PHOTOS } from '../data/place-photos.js';

// Curated photographs only. Unknown rights or unmatched locations never become evidence.
export function photosForPlace(placeUrl) {
 return PLACE_PHOTOS.filter(photo => photo.placeUrl === placeUrl && photo.review.status === 'accepted');
}
export function photoSearchUrl(place) {
 const search = [place.name, place.city, place.country].filter(Boolean).join(' ');
 const params = new URLSearchParams({ search, title:'Special:MediaSearch', type:'image' });
 return `https://commons.wikimedia.org/w/index.php?${params}`;
}
export function linkedPhotoSources(place) {
 const candidates = [...(place.spaces || []).map(space => space.src || space.source_url), place.chaplaincy?.source_url, place.feedback_url, place.feedback];
 return [...new Set(candidates.filter(value => {
  if (typeof value !== 'string') return false;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
 }))].slice(0, 4);
}
export function photoSrcset(photo) {
 return photo.images.map(image => `${image.src} ${image.width}w`).join(', ');
}
