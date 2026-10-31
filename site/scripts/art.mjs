// Turns Codex banners in art-src/<name>.png into public/art/<code>.webp (page band) and public/og/<code>.jpg (share card).
// "<code>2.png" (a redo) wins over "<code>.png". Run: pnpm art
import sharp from 'sharp';
import { readdirSync, mkdirSync, existsSync } from 'node:fs';

const src = new URL('../art-src/', import.meta.url);
const pub = new URL('../public/', import.meta.url);
mkdirSync(new URL('art/', pub), { recursive: true });
mkdirSync(new URL('og/', pub), { recursive: true });

const files = readdirSync(src).filter((f) => /^[a-z]{3,5}2?\.png$/.test(f));
const pick = new Map();
for (const f of files.sort()) pick.set(f.replace(/2?\.png$/, ''), f); // sorted: "ist2" after "ist"
// Airports that share a city use its banner until they get their own.
const ALIAS = { lga: 'jfk', ewr: 'jfk', mdw: 'ord', ory: 'cdg', shj: 'shj' };
for (const [code, base] of Object.entries(ALIAS)) if (!pick.has(code) && pick.has(base)) pick.set(code, pick.get(base));
for (const [code, f] of pick) {
  const input = new URL(f, src).pathname;
  const band = new URL(`art/${code}.webp`, pub).pathname;
  const og = new URL(`og/${code}.jpg`, pub).pathname;
  if (!existsSync(band)) await sharp(input).resize(1600, 600, { fit: 'cover' }).webp({ quality: 74 }).toFile(band);
  if (!existsSync(og)) await sharp(input).resize(1200, 630, { fit: 'cover', position: 'right' }).jpeg({ quality: 78, mozjpeg: true }).toFile(og);
  console.log(code, '←', f);
}
