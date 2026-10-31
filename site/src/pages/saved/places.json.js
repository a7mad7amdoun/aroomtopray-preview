import { airports } from '../../lib/airports.js';
import { universities } from '../../lib/universities.js';
import { hospitals } from '../../lib/hospitals.js';
import { placeNotes } from '../../lib/place-notes.js';
export const GET = () => new Response(JSON.stringify([
  ...airports.map(p => placeNotes(p, 'Airport')),
  ...universities.map(p => placeNotes(p, 'University')),
  ...hospitals.map(p => placeNotes(p, 'Hospital')),
]), { headers: { 'content-type': 'application/json; charset=utf-8' } });
