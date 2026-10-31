import test from 'node:test';
import assert from 'node:assert/strict';
import { LOCALES, getCopy, localeFromPath, localizedPath, unlocalizedPath, localeMeta, translateTerm, formatCount } from '../src/lib/i18n.js';

function leafPaths(value, prefix = '') {
  if (typeof value === 'string') {
    assert.ok(value.trim(), `Empty translation at ${prefix}`);
    return [prefix];
  }
  return Object.entries(value).flatMap(([key, child]) => leafPaths(child, `${prefix}.${key}`));
}

test('all four interfaces have complete matching translation keys', () => {
  const english = leafPaths(getCopy('en')).sort();
  for (const { code } of LOCALES) assert.deepEqual(leafPaths(getCopy(code)).sort(), english, code);
  assert.equal(localeMeta('ar').dir, 'rtl');
  assert.equal(localeMeta('fr').nativeName, 'Français');
  assert.equal(localeMeta('invalid').code, 'en');
  assert.equal(getCopy('invalid'), getCopy('en'));
});

test('switching language preserves a deep route, filters and fragment without double prefixes', () => {
  assert.equal(localizedPath('/fr/airports/lhr/?f=wudu%2Cwomen&q=London#rooms', 'ar'), '/ar/airports/lhr/?f=wudu%2Cwomen&q=London#rooms');
  assert.equal(localizedPath('/ar/hospitals/?view=cards', 'en'), '/hospitals/?view=cards');
  assert.equal(localizedPath('/es/', 'fr'), '/fr/');
  assert.equal(localizedPath('/', 'es'), '/es/');
  assert.equal(localizedPath('/fr?view=cards#browse', 'es'), '/es/?view=cards#browse');
  assert.equal(localizedPath('/en/airports/', 'en'), '/airports/');
  assert.equal(unlocalizedPath('/universities/french-university/'), '/universities/french-university/');
  assert.equal(localizedPath('airports/lhr/', 'fr'), '/fr/airports/lhr/');
});

test('locale detection uses complete first segments and never changes external or same-page links', () => {
  assert.equal(localeFromPath('/ar/airports/lhr/'), 'ar');
  assert.equal(localeFromPath('/france/'), 'en');
  assert.equal(localeFromPath('/airports/ar/'), 'en');
  assert.equal(localeFromPath('https://aroomtopray.com/es/hospitals/'), 'es');
  for (const path of ['#rooms', '?q=London', 'https://example.org/fr/', '//example.org/ar/', 'mailto:hello@example.org', 'tel:+441234']) {
    assert.equal(localizedPath(path, 'ar'), path);
  }
});

test('only known interface terms translate; source wording and unknown institution names remain intact', () => {
  assert.equal(translateTerm('Not stated', 'fr'), 'Non précisé');
  assert.equal(translateTerm('United Kingdom', 'ar'), 'المملكة المتحدة');
  assert.equal(translateTerm('University of Leeds', 'es'), 'University of Leeds');
  assert.equal(translateTerm('Room moved to floor 2. Confirm access with staff.', 'ar'), 'Room moved to floor 2. Confirm access with staff.');
  assert.equal(translateTerm(null, 'ar'), null);
  assert.equal(formatCount(414, 'fr'), '414');
  assert.ok(getCopy('ar').language.notice.includes('بلغتها الأصلية'));
});
