import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../src/scripts/room-first-paint.js', import.meta.url), 'utf8');
function freshPage({ preference, systemDark = false, mobile = false, density = 1, kind = 'home', presentation = 'home', query = '', blocked = false, preview = false } = {}) {
  const attributes = new Map(), classes = new Set(), links = [], removed = [];
  const root = { dataset: {}, classList: { add: value => classes.add(value) }, setAttribute: (key, value) => attributes.set(key, value) };
  const meta = { setAttribute: (key, value) => attributes.set(`meta-${key}`, value) };
  const document = {
    documentElement: root, currentScript: { dataset: { arrivalKind: kind, arrivalPresentation: presentation } },
    querySelector: () => meta, head: { append: link => links.push(link) },
    createElement: name => { assert.equal(name, 'link'); return {}; },
  };
  const context = {
    document, URLSearchParams,
    window: { devicePixelRatio: density, location: { search: query }, matchMedia: query => ({ matches: query.includes('color-scheme') ? systemDark : mobile }) },
    localStorage: { getItem: key => { assert.equal(key, preview ? 'aroomtopray-preview.theme.v1' : 'aroomtopray.theme.v1'); if (blocked) throw Error('blocked'); return preference; } },
    sessionStorage: { removeItem: key => { if (blocked) throw Error('blocked'); removed.push(key); } },
  };
  const mounted = preview ? source.replaceAll('aroomtopray.theme.v1', 'aroomtopray-preview.theme.v1').replace("'/art/'", "'/aroomtopray-preview/art/'") : source;
  vm.runInNewContext(mounted, context);
  return { root, attributes, classes, links, removed };
}

test('repeated fresh starts restore saved/system appearance before requesting matching room imagery', () => {
  for (let refresh = 0; refresh < 20; refresh++) for (const systemDark of [false, true]) for (const preference of [undefined, 'auto', 'invalid', 'light', 'dark']) {
    const p = freshPage({ preference, systemDark });
    const dark = preference === 'dark' || (!['light','dark'].includes(preference) && systemDark);
    assert.equal(p.attributes.get('data-theme'), ['light','dark'].includes(preference) ? preference : undefined);
    assert.equal(p.attributes.get('meta-content'), dark ? '#0a111c' : '#f6f7f7');
    assert.ok(p.classes.has('js'));
    assert.equal(p.links.length, 2);
    assert.equal(p.links[0].href, `/art/artful-room/${dark ? 'night' : 'day'}-1774.webp`);
    assert.equal(p.links[1].href, `/art/panoramic-views/airport-${dark ? 'night' : 'day'}-800.webp`);
  }
});

test('each category and device density preloads existing assets used by the CSS', () => {
  for (const [kind, scene] of Object.entries({ airports: 'airport', universities: 'campus', hospitals: 'hospital' })) {
    for (const preference of ['light','dark']) for (const mobile of [false,true]) for (const density of [1,2]) {
      const p = freshPage({ kind, presentation: 'directory', preference, mobile, density });
      const mode = preference === 'dark' ? 'night' : 'day';
      const folder = preference === 'dark' ? 'arrival-room' : 'daylight-room';
      assert.equal(p.links[0].href, `/art/${folder}/${mode}-${mobile && density === 1 ? 1024 : 1774}.webp`);
      assert.equal(p.links[1].href, `/art/panoramic-views/${scene}-${mode}-${density === 1 ? 800 : 1400}.webp`);
      for (const link of p.links) {
        assert.equal(link.rel, 'preload'); assert.equal(link.as, 'image');
        assert.ok(fs.existsSync(new URL('../public' + link.href, import.meta.url)), link.href);
      }
    }
  }
});

test('blocked storage, mounted preview paths and report intent keep initial appearance usable', () => {
  const p = freshPage({ blocked: true, systemDark: true, query: '?report=access', preview: true });
  assert.equal(p.root.dataset.guideReportIntent, 'true');
  assert.equal(p.attributes.get('meta-content'), '#0a111c');
  assert.ok(p.links.every(link => link.href.startsWith('/aroomtopray-preview/art/')));
  assert.equal(freshPage({ query: '?q=report' }).root.dataset.guideReportIntent, undefined);
});
