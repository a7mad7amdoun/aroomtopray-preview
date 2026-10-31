// www.aroomtopray.com → aroomtopray.com (301), keeping the path and query.
// Detail pages are generated lowercase only, so /airports/JFK or /hospitals/NYP-Weill-Cornell would 404:
// redirect GET/HEAD requests for those detail paths to the lowercase, trailing-slash URL (301), keeping the query.
const DETAIL = /^\/(?:airports\/[A-Za-z]{3}|(?:universities|hospitals)\/[A-Za-z0-9-]+)\/?$/;

export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (url.hostname === 'www.aroomtopray.com') { url.hostname = 'aroomtopray.com'; return Response.redirect(url.toString(), 301); }
  if ((request.method === 'GET' || request.method === 'HEAD') && DETAIL.test(url.pathname) && /[A-Z]/.test(url.pathname)) {
    url.pathname = url.pathname.toLowerCase().replace(/\/?$/, '/');
    return Response.redirect(url.toString(), 301);
  }
  return next();
}
