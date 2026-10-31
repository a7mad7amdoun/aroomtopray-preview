export const PAGE_SIZE = 12;
export function readPage(search) {
  const raw = new URLSearchParams(search).get('page');
  return /^\d{1,5}$/.test(raw || '') ? Math.max(1, Number(raw)) : 1;
}
export function pageWindow(items, requested, size = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const page = Math.min(totalPages, Math.max(1, requested));
  return { page, totalPages, items: items.slice((page - 1) * size, page * size) };
}
export function writePage(page, search) {
  const params = new URLSearchParams(search);
  params.delete('page');
  if (page > 1) params.set('page', String(page));
  return params.toString();
}
