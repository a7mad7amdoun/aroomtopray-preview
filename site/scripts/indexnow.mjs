// Tells IndexNow (Bing, Yandex, Seznam, Naver…) about every URL in the live sitemap. Run after a deploy: pnpm indexnow
import { readdirSync, readFileSync } from 'node:fs';
const SITE = 'https://aroomtopray.com';
const key = readdirSync(new URL('../public/', import.meta.url)).find((f) => /^[0-9a-f]{32}\.txt$/.test(f)).slice(0, 32);
const idx = await (await fetch(`${SITE}/sitemap-index.xml`)).text();
const maps = [...idx.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const urls = (await Promise.all(maps.map(async (m) => [...(await (await fetch(m)).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1])))).flat();
const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: 'aroomtopray.com', key, keyLocation: `${SITE}/${key}.txt`, urlList: urls }) });
console.log(`IndexNow: ${urls.length} URLs → ${r.status}`);
