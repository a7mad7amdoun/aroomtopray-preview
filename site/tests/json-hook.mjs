// Node needs `with { type: 'json' }` for JSON imports; the Pages Functions bundler doesn't. Add it for tests only.
export async function load(url, context, next) {
  if (url.endsWith('.json')) return next(url, { ...context, importAttributes: { ...context.importAttributes, type: 'json' } });
  return next(url, context);
}
