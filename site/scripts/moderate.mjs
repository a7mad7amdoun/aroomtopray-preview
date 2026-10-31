// Review traveller photos. Uses the wrangler CLI, so it runs with whatever Cloudflare credentials wrangler already has
// (e.g. CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID exported). Run from site/:
//   node scripts/moderate.mjs list                      pending photos (id, airport, space, size, date)
//   node scripts/moderate.mjs pull [dir]                save pending photos as <dir>/<code>-<id>.jpg to look at (default: a temp folder)
//   node scripts/moderate.mjs approve <id> [<id>...]    publish: copy to photo:<code>:<id>, add to photos:<code>, delete the pending copy
//   node scripts/moderate.mjs reject <id> [<id>...]     delete the pending photo
//   node scripts/moderate.mjs unpublish <code> <id>     remove an approved photo (browsers may keep a cached copy for a while)
// Add --local to work against wrangler's local KV instead of production (for trying it out); MODERATE_PERSIST=<dir> sets where it lives.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const NS = '035d89b9d1944b1487a623e989571546'; // KV namespace from wrangler.toml
const args = process.argv.slice(2);
const where = args.includes('--local') ? '--local' : '--remote';
const [cmd, ...rest] = args.filter((a) => a !== '--local');
const ID = /^[0-9a-f]{16}$/, CODE = /^[a-z0-9-]{2,40}$/;

const persist = where === '--local' && process.env.MODERATE_PERSIST ? ['--persist-to', process.env.MODERATE_PERSIST] : [];
const wr = (a, opts = {}) => execFileSync('npx', ['wrangler', 'kv', ...a, '--namespace-id', NS, where, ...persist], { stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 64 << 20, ...opts });
const listPending = () => JSON.parse(wr(['key', 'list', '--prefix', 'pending:photo:']).toString());
const getBytes = (key) => wr(['key', 'get', key]);
// A missing key is the only read that counts as "empty". wrangler prints "Value not found" for it (exit 0 in current
// versions, non-zero in some); any other failure (network, auth, rate limit) throws so nothing is overwritten.
export function readText(run, key) {
  let out;
  try { out = run(['key', 'get', key, '--text']).toString(); }
  catch (e) {
    if (/Value not found/.test(`${e.stdout || ''}${e.stderr || ''}`)) return null;
    throw new Error(`Couldn't read ${key}: ${String(e.stderr || e.message).trim().split('\n').pop()}`);
  }
  return /^Value not found/.test(out) ? null : out;
}
// The approved list for an airport: [] only if the key doesn't exist; a read error or a malformed value aborts.
export function readList(run, code) {
  const t = readText(run, `photos:${code}`);
  if (t === null) return [];
  let v;
  try { v = JSON.parse(t); } catch { throw new Error(`photos:${code} isn't valid JSON; not changing it.`); }
  if (!Array.isArray(v)) throw new Error(`photos:${code} isn't a list; not changing it.`);
  return v;
}
// Delete with a few retries; throws if it still fails.
export function deleteKey(run, key, tries = 3) {
  for (let n = 1; ; n++) {
    try { run(['key', 'delete', key]); return; }
    catch (e) { if (n >= tries) throw new Error(`Couldn't delete ${key} after ${tries} tries: ${String(e.stderr || e.message).trim().split('\n').pop()}`); }
  }
}
const readOpts = { stdio: ['ignore', 'pipe', 'pipe'] };
const runQuiet = (a) => wr(a, readOpts);
const pendingMeta = (id) => {
  const k = listPending().find((x) => x.name === `pending:photo:${id}`);
  if (!k) throw new Error(`No pending photo ${id} (already handled, or expired after 180 days).`);
  return k.metadata || {};
};
const tmp = () => mkdtempSync(join(tmpdir(), 'arp-photo-'));

function list() {
  const keys = listPending();
  if (!keys.length) return console.log('No photos waiting for review.');
  for (const k of keys) {
    const m = k.metadata || {};
    console.log(`${k.name.slice('pending:photo:'.length)}  ${m.code}  space ${m.space}  ${m.w}x${m.h}  ${m.date}`);
  }
}

function pull(dir = join(tmpdir(), 'arp-pending-photos')) {
  mkdirSync(dir, { recursive: true });
  for (const k of listPending()) {
    const id = k.name.slice('pending:photo:'.length), m = k.metadata || {};
    const file = join(dir, `${m.code}-${id}.jpg`);
    writeFileSync(file, getBytes(k.name));
    console.log(file);
  }
  console.log(`Saved to ${dir}. These are unreviewed traveller photos: delete the folder when you're done.`);
}

function approve(id) {
  if (!ID.test(id)) throw new Error(`Bad id: ${id}`);
  const m = pendingMeta(id);
  if (!CODE.test(m.code || '')) throw new Error(`Pending photo ${id} has no valid airport code.`);
  const dir = tmp(), file = join(dir, 'p.jpg');
  try {
    writeFileSync(file, getBytes(`pending:photo:${id}`));
    const meta = { code: m.code, space: m.space ?? 0, w: m.w, h: m.h, date: m.date };
    wr(['key', 'put', `photo:${m.code}:${id}`, '--path', file, '--metadata', JSON.stringify(meta)]);
    const listed = readList(runQuiet, m.code).filter((p) => p.id !== id);
    listed.push({ id, w: m.w, h: m.h, date: m.date, space: m.space ?? 0 });
    const lf = join(dir, 'list.json');
    writeFileSync(lf, JSON.stringify(listed));
    wr(['key', 'put', `photos:${m.code}`, '--path', lf]);
    deleteKey(runQuiet, `pending:photo:${id}`);
    console.log(`Approved ${id} for ${m.code} (${listed.length} photo${listed.length === 1 ? '' : 's'} listed).`);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

function reject(id) {
  if (!ID.test(id)) throw new Error(`Bad id: ${id}`);
  deleteKey(runQuiet, `pending:photo:${id}`);
  console.log(`Rejected and deleted ${id}.`);
}

function unpublish(code, id) {
  if (!CODE.test(code || '') || !ID.test(id || '')) throw new Error('Usage: unpublish <code> <id>');
  const dir = tmp(), lf = join(dir, 'list.json');
  try {
    // Take it off the list first (the API only serves listed ids), then delete the image itself.
    const listed = readList(runQuiet, code).filter((p) => p.id !== id);
    writeFileSync(lf, JSON.stringify(listed));
    wr(['key', 'put', `photos:${code}`, '--path', lf]);
    try { deleteKey(runQuiet, `photo:${code}:${id}`); }
    catch (e) { throw new Error(`${id} is off the ${code} list (no longer served), but ${e.message} Run unpublish again.`); }
    console.log(`Removed ${id} from ${code}.`);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  try {
    if (cmd === 'list') list();
    else if (cmd === 'pull') pull(rest[0]);
    else if (cmd === 'approve' && rest.length) rest.forEach(approve);
    else if (cmd === 'reject' && rest.length) rest.forEach(reject);
    else if (cmd === 'unpublish') unpublish(rest[0], rest[1]);
    else { console.log('Usage: node scripts/moderate.mjs list | pull [dir] | approve <id>... | reject <id>... | unpublish <code> <id>  [--local]'); process.exitCode = 1; }
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
