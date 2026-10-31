// Presentation shares the URL with the facility filters; no browser storage needed.
export function readDirectoryMode(search, hasMap) {
  const params = new URLSearchParams(search);
  if (params.get('mode') === 'guide') return 'guide';
  if (!hasMap) return 'list';
  if (['map', 'list'].includes(params.get('mode'))) return params.get('mode');
  return params.get('view') === 'cards' || params.has('page') ? 'list' : 'map';
}
export function readPresentation(search) {
  const params = new URLSearchParams(search);
  return { view: params.get('view') === 'cards' ? 'cards' : 'list', sort: ['name', 'location'].includes(params.get('sort')) ? params.get('sort') : 'default' };
}
export function writePresentation(state, search) {
  const params = new URLSearchParams(search);
  params.delete('view'); params.delete('sort');
  if (state.view === 'cards') params.set('view', 'cards');
  if (['name', 'location'].includes(state.sort)) params.set('sort', state.sort);
  return params.toString();
}
export function sortPlaces(items, sort) {
  const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
  return [...items].sort((a, b) => sort === 'default' ? a.order - b.order : collator.compare(a[sort] || '', b[sort] || '') || a.order - b.order);
}
