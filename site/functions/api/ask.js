// POST /api/ask { code }: sent when a visitor opens an airport's feedback page. Adds one to that airport's count.
// No personal data is stored. One count per IP per airport per day.
import { CODES, sameOrigin, underLimit, tooBig } from './_util.js';
export async function onRequestPost({ request, env }) {
  const done = new Response(null, { status: 204 });
  if (!env.KV || !sameOrigin(request) || tooBig(request, 512)) return done;
  let code = '';
  try { code = String(JSON.parse(await request.text()).code || '').toLowerCase(); } catch {}
  if (!CODES.has(code)) return done;
  try {
    if (!(await underLimit(env, request, `ask:${code}`, 1))) return done;
    const n = Number(await env.KV.get(`ask:${code}`)) || 0;
    await env.KV.put(`ask:${code}`, String(n + 1));
  } catch {}
  return done;
}
