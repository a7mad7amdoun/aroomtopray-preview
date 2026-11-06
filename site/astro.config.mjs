import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';
import { REVIEWED as TRAVEL_REVIEWED } from './src/data/travel/guides.js';

// Airports not checked yet are noindex; keep them out of the sitemap too.
const pending = JSON.parse(readFileSync(new URL('./src/data/airports.json', import.meta.url), 'utf8'))
  .filter((a) => a.status === 'pending').map((a) => `/airports/${a.iata.toLowerCase()}/`);

// Hospitals still being checked are noindex too (src/lib/hospitals.js HOLD).
const hospHold = ['heartlands-hospital', 'st-jamess-university-hospital-leeds', 'university-hospital-coventry', 'university-hospital-of-wales', 'queen-elizabeth-university-hospital-glasgow',
  'corewell-health-dearborn', 'montreal-general', 'humber-river', 'parkland-memorial', 'ui-health', 'inova-fairfax', 'hennepin-healthcare', 'nyu-langone-tisch'].map((s) => `/hospitals/${s}/`);
pending.push(...hospHold);

// The travel guides are noindex until the editor has reviewed them (src/data/travel/guides.js REVIEWED).
const travelHold = TRAVEL_REVIEWED ? [] : ['/travel/'];

export default defineConfig({
  devToolbar: { enabled: false },
  site: 'https://aroomtopray.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [sitemap({ filter: (page) => !page.includes('/404') && !new URL(page).pathname.startsWith('/saved/') && !pending.some((p) => page.endsWith(p)) && !travelHold.some((p) => new URL(page).pathname.startsWith(p)) })],
});
