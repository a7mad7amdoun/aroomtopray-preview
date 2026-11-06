import { PLACE_PHOTOS } from '../data/place-photos.js';
import { CATEGORY_PHOTOGRAPHY } from '../data/category-photography.js';

// Curated photographs only. Unknown rights or unmatched locations never become evidence.
export function photosForPlace(placeUrl) {
 return PLACE_PHOTOS.filter(photo => photo.placeUrl === placeUrl && photo.review.status === 'accepted');
}
// Deliberately exact: a city, category or similar institution name is not a match.
// Keep these architectural views separate from documentary room/sign evidence.
const CONTEXT_PHOTO_IDS = {
 '/airports/bkk/':['bangkok-terminal'],
 '/airports/yyz/':['toronto-terminal'],
 '/airports/rak/':['marrakech-terminal'],
 '/airports/mad/':['madrid-terminal'],
 '/universities/university-of-toronto/':['toronto-campus'],
};
export function contextPhotosForPlace(placeUrl) {
 const ids=Object.hasOwn(CONTEXT_PHOTO_IDS,placeUrl)?CONTEXT_PHOTO_IDS[placeUrl]:[];
 return Object.values(CATEGORY_PHOTOGRAPHY).flat().filter(photo=>ids.includes(photo.id)).map(photo=>({
  ...photo,placeUrl,kind:'context',dateTaken:photo.date,
 }));
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
