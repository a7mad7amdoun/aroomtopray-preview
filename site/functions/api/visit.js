// Cloudflare Pages Function: POST /api/visit { p: path, r: referrer }, sent once per page view by Base.astro (production builds only).
// Adds one to today's count for that page and the visitor's approximate country, region and city, as Cloudflare's
// network reports them. No IP address, cookie or identifier is stored; only the daily totals.
//
// Binding (wrangler.toml): VISITS  D1 database "aroomtopray-visits", table from site/scripts/visits.sql.
// Without it the endpoint does nothing.
// Read the counts:  npx wrangler d1 execute aroomtopray-visits --remote --command "SELECT ... FROM visits"
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|preview|python|curl|wget/i;
const host = (h) => h.toLowerCase().replace(/^www\./, '');

export async function onRequestPost({ request, env }) {
  const done = new Response(null, { status: 204 });
  const ua = request.headers.get('user-agent') || '';
  if (!env.VISITS || BOT.test(ua)) return done;
  const url = new URL(request.url);
  // Only the site's own pages may count (browsers send Origin with a beacon).
  try { if (host(new URL(request.headers.get('origin')).hostname) !== host(url.hostname)) return done; } catch { return done; }
  let body = {};
  try { body = JSON.parse(await request.text()) || {}; } catch {}
  const path = typeof body.p === 'string' && body.p.startsWith('/') ? body.p.slice(0, 200) : '/';
  let referrer = '';
  try { const r = host(new URL(body.r).hostname); if (r !== host(url.hostname)) referrer = r.slice(0, 100); } catch {}
  const cf = request.cf || {};
  const device = /Mobi|Android|iPhone|iPad/i.test(ua) ? 'mobile' : 'desktop';
  try {
    await env.VISITS.prepare(
      `INSERT INTO visits (day, host, path, country, region, city, device, referrer, n) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
       ON CONFLICT (day, host, path, country, region, city, device, referrer) DO UPDATE SET n = n + 1`,
    ).bind(new Date().toISOString().slice(0, 10), host(url.hostname), path, cf.country || '', cf.region || '', cf.city || '', device, referrer).run();
  } catch {}
  return done;
}
