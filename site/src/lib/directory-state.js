// Shared by all directories. Selected amenities must belong to a single room.
export const fold = (s) => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').replace(/\u0640/g, '').toLowerCase().trim();
export const ROOM_FILTERS = ['airside', 'wudu', 'women', 'h24', 'jumuah', 'open', 'musalla'];
export function readDirectoryState(search, regions, filters) {
  const params = new URLSearchParams(search);
  const region = params.get('region') || 'All';
  return { q: (params.get('q') || '').slice(0, 160), region: regions.includes(region) ? region : 'All',
    f: new Set((params.get('f') || '').split(',').filter(k => filters.includes(k))) };
}
export function writeDirectoryState(state, search = '') {
  const params = new URLSearchParams(search);
  for (const key of ['q', 'region', 'f']) params.delete(key);
  if (state.q.trim()) params.set('q', state.q.trim());
  if (state.region !== 'All') params.set('region', state.region);
  if (state.f.size) params.set('f', [...state.f].sort().join(','));
  return params.toString();
}
export function matchesDirectory(item, state) {
  const tokens = fold(state.q).split(/\s+/).filter(Boolean);
  const roomKeys = ROOM_FILTERS.filter(k => state.f.has(k));
  return (state.region === 'All' || item.region === state.region)
    && tokens.every(t => fold(item.text).includes(t))
    && (!state.f.has('room') || item.status === 'room')
    && (!state.f.has('halal') || item.halal)
    && (!state.f.has('ask') || ['none', 'seating', 'planned'].includes(item.status))
    && (!roomKeys.length || item.rooms.some(r => roomKeys.every(k => r[k] === true)));
}
