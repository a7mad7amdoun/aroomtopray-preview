import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ORIGINAL_LISTING_PATHS } from '../src/data/original-listing-paths.js';
import { originalDirectorySource, SOURCE_PROVENANCE_COPY } from '../src/data/source-provenance.js';
import { QUIET_FIELD_NOTES, FIELD_NOTE_COPY } from '../src/data/quiet-field-notes.js';

const readData = file => JSON.parse(readFileSync(new URL(`../src/data/${file}`, import.meta.url)));

test('every existing record has the exact canonical listing observed on Hamza’s directory', () => {
  const local = {
    airports: readData('airports.json').map(place => `/airports/${place.iata.toLowerCase()}/`),
    universities: ['universities.json', 'universities-2.json'].flatMap(file => readData(file)).map(place => `/universities/${place.slug}/`),
    hospitals: ['hospitals-uk.json', 'hospitals-na.json'].flatMap(file => readData(file)).map(place => `/hospitals/${place.slug}/`),
  };
  for (const [kind, paths] of Object.entries(local)) {
    assert.deepEqual([...paths].sort(), ORIGINAL_LISTING_PATHS[kind]);
    for (const path of paths) assert.deepEqual(originalDirectorySource(path), { kind: 'listing', path, url: `https://aroomtopray.com${path}` });
  }
});

test('translated routes link to original English pages without copying queries or fragments', () => {
  for (const locale of ['en', 'fr', 'ar', 'es']) {
    assert.equal(originalDirectorySource(`/${locale}/universities/university-of-bristol/?q=ucard#rooms`).url, 'https://aroomtopray.com/universities/university-of-bristol/');
    assert.equal(originalDirectorySource(`/${locale}/airports`).url, 'https://aroomtopray.com/airports/');
    assert.equal(originalDirectorySource(`/${locale}/`).url, 'https://aroomtopray.com/');
    assert.ok(SOURCE_PROVENANCE_COPY[locale].listing);
    assert.ok(SOURCE_PROVENANCE_COPY[locale].openListing);
  }
});

test('unknown institutions and non-original destinations never acquire a false source link', () => {
  for (const path of ['/universities/not-listed/', '/hospitals/ashford/', '/airports/xyz/', '/french/airports/mel/', '/aroomtopray-preview/airports/mel/', '/visit/', '//example.com/airports/mel/', 'https://example.com/airports/mel/', 'https://user:secret@aroomtopray.com/airports/mel/', 'javascript:alert(1)', null]) {
    assert.equal(originalDirectorySource(path), null, String(path));
  }
  assert.deepEqual(originalDirectorySource('https://aroomtopray.com/airports/mel/?q=test#rooms'), originalDirectorySource('/airports/mel/'));
});

test('highlighted field notes now attribute facts to exact existing Hamza listings in all four languages', () => {
  for (const note of Object.values(QUIET_FIELD_NOTES)) {
    assert.equal(originalDirectorySource(note.sourceUrl)?.kind, 'listing');
    assert.equal(note.sourceName, 'A Room to Pray');
    for (const locale of ['en', 'fr', 'ar', 'es']) {
      for (const field of ['institution', 'title', 'text']) assert.ok(note.copy[locale][field].length > 5);
      assert.ok(FIELD_NOTE_COPY[locale].source);
    }
  }
  assert.match(QUIET_FIELD_NOTES.airports.copy.en.text, /before security.*after security/);
  assert.match(QUIET_FIELD_NOTES.universities.copy.en.text, /activate their Ucard/);
  assert.match(QUIET_FIELD_NOTES.hospitals.copy.en.text, /patients.*relatives.*staff only.*limited/);
  assert.doesNotMatch(JSON.stringify(QUIET_FIELD_NOTES), /Experience Ambassador|ashfordstpeters|08:00 to 18:00/);
});
