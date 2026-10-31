// Merge a parallel run's file (default candidates-b.json) into candidates.json, then delete nothing.
// Run from site/: node scripts/masajid/merge-candidates.mjs [file]
import { readFileSync, writeFileSync } from 'node:fs';
const main = new URL('./candidates.json', import.meta.url);
const extra = JSON.parse(readFileSync(new URL(process.argv[2] || './candidates-b.json', import.meta.url)));
const all = JSON.parse(readFileSync(main));
writeFileSync(main, JSON.stringify({ ...all, ...extra }, null, 1));
console.log(`merged ${Object.keys(extra).length} airports`);
