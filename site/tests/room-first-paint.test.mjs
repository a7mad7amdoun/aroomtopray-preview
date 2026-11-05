import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../src/scripts/room-first-paint.js', import.meta.url), 'utf8');
function freshPage({ preference, systemDark = false, mobile = false, tablet = false, density = 1, kind = 'home', presentation = 'home', query = '', blocked = false, preview = false } = {}) {
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
    window: { devicePixelRatio: density, location: { search: query }, matchMedia: query => ({ matches: query.includes('color-scheme') ? systemDark : query.includes('min-width') ? !mobile && !tablet : mobile }) },
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
    assert.equal(p.attributes.get('meta-content'), dark ? '#0b121d' : '#f4f1eb');
    assert.ok(p.classes.has('js'));
    assert.equal(p.links.length, 2);
    assert.equal(p.links[0].href, `/art/artful-room/${dark ? 'night' : 'day'}-1774.webp`);
    assert.equal(p.links[1].href, `/art/home-paired-views/airport-${dark ? 'night' : 'day'}-640.webp`);
  }
});

test('each category and device density preloads existing assets used by the CSS', () => {
  for (const [kind, scene] of Object.entries({ airports: 'airport', universities: 'campus', hospitals: 'hospital' })) {
    for (const preference of ['light','dark']) for (const mobile of [false,true]) for (const density of [1,2]) {
      const p = freshPage({ kind, presentation: 'directory', preference, mobile, density });
      const mode = preference === 'dark' ? 'night' : 'day';
      const folder = preference === 'dark' ? 'arrival-room' : 'daylight-room';
      assert.equal(p.links[0].href, `/art/${folder}/${mode}-${mobile && density === 1 ? 1024 : 1774}.webp`);
      assert.equal(p.links[1].href, `/art/real-views/${scene}-${density === 1 ? 800 : !mobile && scene !== 'hospital' ? 2048 : 1400}.webp`);
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
  assert.equal(p.attributes.get('meta-content'), '#0b121d');
  assert.ok(p.links.every(link => link.href.startsWith('/aroomtopray-preview/art/')));
  assert.equal(freshPage({ query: '?q=report' }).root.dataset.guideReportIntent, undefined);
});

test('dense tablet glass keeps the medium image while large desktop gets original-resolution detail', () => {
  for (const [kind, scene] of Object.entries({airports:'airport',universities:'campus',hospitals:'hospital'})) {
    const tablet=freshPage({kind,presentation:'directory',tablet:true,density:2});
    assert.equal(tablet.links[1].href, `/art/real-views/${scene}-1400.webp`);
    const desktop=freshPage({kind,presentation:'directory',density:2});
    assert.equal(desktop.links[1].href, `/art/real-views/${scene}-${scene==='hospital'?1400:2048}.webp`);
  }
});

test('home preloads its generated lighting pair without changing directory photography', () => {
 for(const preference of ['light','dark'])for(const density of [1,2]) {
  const page=freshPage({preference,density});
  const expected=`/art/home-paired-views/airport-${preference==='dark'?'night':'day'}-${density===1?640:1122}.webp`;
  assert.equal(page.links[1].href,expected);
  assert.ok(fs.existsSync(new URL('../public'+expected,import.meta.url)));
 }
});
