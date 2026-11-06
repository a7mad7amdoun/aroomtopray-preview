import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../src/scripts/room-first-paint.js', import.meta.url), 'utf8');
function freshPage({ reading, preference, systemDark = false, mobile = false, tablet = false, density = 1, kind = 'home', presentation = 'home', query = '', blocked = false, preview = false } = {}) {
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
    localStorage: { getItem: key => { if (blocked) throw Error('blocked'); const prefix = preview ? 'aroomtopray-preview' : 'aroomtopray'; if (key === `${prefix}.reading.v1`) return reading; assert.equal(key, `${prefix}.theme.v1`); return preference; } },
    sessionStorage: { removeItem: key => { if (blocked) throw Error('blocked'); removed.push(key); } },
  };
  const mounted = preview ? source.replaceAll('aroomtopray.theme.v1', 'aroomtopray-preview.theme.v1').replaceAll('aroomtopray.reading.v1', 'aroomtopray-preview.reading.v1').replace("'/art/'", "'/aroomtopray-preview/art/'") : source;
  vm.runInNewContext(mounted, context);
  return { root, attributes, classes, links, removed };
}

test('repeated fresh starts restore saved/system appearance before requesting matching room imagery', () => {
  for (let refresh = 0; refresh < 20; refresh++) for (const systemDark of [false, true]) for (const preference of [undefined, 'auto', 'invalid', 'light', 'dark']) {
    const p = freshPage({ preference, systemDark });
    const dark = preference === 'dark' || (!['light','dark'].includes(preference) && systemDark);
    assert.equal(p.attributes.get('data-theme'), ['light','dark'].includes(preference) ? preference : undefined);
    assert.equal(p.attributes.get('meta-content'), dark ? '#0a111c' : '#e8edf3');
    assert.ok(p.classes.has('js'));
    assert.equal(p.links.length, 1);
    assert.equal(p.links[0].href, `/art/artful-room/${dark ? 'night' : 'day'}-1774.webp`);
  }
});

test('each category and device density preloads its CSS room only, leaving gallery images to img loading', () => {
  for (const kind of ['airports','universities','hospitals']) {
    for (const preference of ['light','dark']) for (const mobile of [false,true]) for (const density of [1,2]) {
      const p = freshPage({ kind, presentation: 'directory', preference, mobile, density });
      const mode = preference === 'dark' ? 'night' : 'day';
      const folder = preference === 'dark' ? 'arrival-room' : 'daylight-room';
      assert.equal(p.links[0].href, `/art/${folder}/${mode}-${mobile && density === 1 ? 1024 : 1774}.webp`);
      assert.equal(p.links.length, 1);
      assert.ok(p.links.every(link => !link.href.includes('/real-views/')));
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
  assert.equal(p.links.length, 1);
  assert.ok(p.links.every(link => link.href.startsWith('/aroomtopray-preview/art/')));
  assert.deepEqual(p.removed, []);
  assert.equal(freshPage({ query: '?q=report' }).root.dataset.guideReportIntent, undefined);
});

test('practical pages and preview mounts do not fetch obsolete CSS window scenes', () => {
  for (const kind of ['home','airports','universities','hospitals']) {
    for (const presentation of ['directory','detail','support']) for (const preview of [false,true]) {
      for (const device of [{tablet:true,density:2},{density:2},{mobile:true,density:1}]) {
        const page=freshPage({kind,presentation,preview,...device});
        const prefix=preview?'/aroomtopray-preview/art/':'/art/';
        assert.equal(page.links.length,1);
        assert.equal(page.links[0].href,`${prefix}daylight-room/day-${device.mobile?1024:1774}.webp`);
      }
    }
  }
});

test('home preloads only the original room and leaves real photographs to responsive img selection', () => {
 for(const preference of ['light','dark'])for(const density of [1,2]) {
  const page=freshPage({preference,density});
  assert.equal(page.links.length,1);
  assert.ok(!page.links[0].href.includes('home-paired-views'));
  assert.ok(fs.existsSync(new URL('../public'+page.links[0].href,import.meta.url)));
 }
});

test('obsolete focus sessions are cleared without interfering with current appearance', () => {
  const page=freshPage({preference:'dark',reading:'large'});
  assert.deepEqual(page.removed,['aroomtopray.focus.v2','aroomtopray.focus.v1']);
  assert.equal(page.attributes.get('data-theme'),'dark');
  assert.equal(page.attributes.get('data-reading'),'large');
});


test('larger reading preference restores before paint without overriding theme or accepting invalid values', () => {
 for (const preview of [false, true]) for (const preference of ['light','dark']) {
  const page = freshPage({reading:'large',preference,preview});
  assert.equal(page.attributes.get('data-reading'),'large');
  assert.equal(page.attributes.get('data-theme'),preference);
 }
 for (const reading of [undefined,'standard','invalid']) assert.equal(freshPage({reading}).attributes.has('data-reading'),false);
 assert.equal(freshPage({reading:'large',blocked:true}).attributes.has('data-reading'),false);
});
