// Checks every source and feedback URL in the data files and writes docs/link-check.md.
// Note: some airports block requests from Morocco or from scripts (403/429); those need a browser check, not a fix.
import { readFileSync, writeFileSync } from 'node:fs';
const load = (f) => JSON.parse(readFileSync(new URL(`../src/data/${f}`, import.meta.url), 'utf8'));
const urls = new Map();
const add = (u, where) => { if (u && /^https?:/.test(u)) (urls.get(u) || urls.set(u, []).get(u)).push(where); };
for (const a of load('airports.json')) { add(a.feedback, `${a.iata} feedback`); a.spaces.forEach((s) => add(s.src, `${a.iata} ${s.name}`)); }
for (const u of load('universities.json')) { add(u.feedback_url, `${u.slug} feedback`); u.spaces.forEach((s) => add(s.source_url, `${u.slug} ${s.name}`)); }
for (const h of load('halal.json')) h.outlets.forEach((o) => add(o.source_url, `${h.iata} halal ${o.name}`));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
async function check(u) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const r = await fetch(u, { method, redirect: 'follow', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(15000) });
      if (method === 'HEAD' && (r.status === 405 || r.status === 403)) continue;
      return { status: r.status, final: r.url };
    } catch (e) { if (method === 'GET') return { status: 'ERR', final: String(e.cause?.code || e.name) }; }
  }
}
const list = [...urls.keys()]; const res = {};
for (let i = 0; i < list.length; i += 12) await Promise.all(list.slice(i, i + 12).map(async (u) => { res[u] = await check(u); }));
const bad = list.filter((u) => res[u].status === 404 || res[u].status === 410 || res[u].status === 'ERR' || res[u].status >= 500);
const blocked = list.filter((u) => [401, 403, 429].includes(res[u].status));
const ok = list.length - bad.length - blocked.length;
const row = (u) => `| ${res[u].status} | ${urls.get(u).join('; ')} | ${u} |`;
const md = `# Link check (${new Date().toISOString().slice(0, 10)})\n\n${list.length} URLs: ${ok} OK, ${bad.length} broken or unreachable, ${blocked.length} blocked (need a browser check).\n\n## Broken or unreachable\n\n| Status | Used by | URL |\n|---|---|---|\n${bad.map(row).join('\n')}\n\n## Blocked (403/429: likely bot or geo blocking)\n\n| Status | Used by | URL |\n|---|---|---|\n${blocked.map(row).join('\n')}\n`;
writeFileSync(new URL('../../docs/link-check.md', import.meta.url), md);
console.log(`${list.length} URLs: ${ok} OK, ${bad.length} broken, ${blocked.length} blocked`);
