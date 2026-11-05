export const READING_KEY = 'aroomtopray.reading.v1';
export const normalizeReading = value => value === 'large' ? 'large' : 'standard';
export function readReading(storage) {
 try { return normalizeReading(storage.getItem(READING_KEY)); } catch { return 'standard'; }
}
export function saveReading(storage, value) {
 try {
  if (normalizeReading(value) === 'large') storage.setItem(READING_KEY, 'large');
  else storage.removeItem(READING_KEY);
  return true;
 } catch { return false; }
}
export function applyReading(element, value) {
 const preference = normalizeReading(value);
 if (preference === 'large') element.setAttribute('data-reading', 'large');
 else element.removeAttribute('data-reading');
 return preference;
}
