import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../src/styles/room-palette.css', import.meta.url), 'utf8');
const declarations = (selector) => {
  const start = css.indexOf(selector);
  assert.notEqual(start, -1, `Missing palette scope: ${selector}`);
  const block = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  return Object.fromEntries([...block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)]
    .map(([, key, value]) => [key, value.trim()]));
};
const light = declarations(':root,');
const dark = { ...light, ...declarations(':root[data-theme=dark]') };
const systemDark = { ...light, ...declarations(':root:not([data-theme=light])') };
const airport = { ...light, ...declarations('.room-environment[data-room-setting=airports] .room-arrival-copy,') };

const luminance = (hex) => {
  assert.match(hex, /^#[\da-f]{6}$/i, 'Contrast is tested against opaque production colours');
  const channels = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255)
    .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
};
const ratio = (foreground, background) => {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + .05) / (values[1] + .05);
};
const passes = (palette, foreground, background, minimum, context) => {
  const result = ratio(palette[foreground], palette[background]);
  assert.ok(result >= minimum, `${context}: ${foreground} on ${background} is ${result.toFixed(2)}:1, needs ${minimum}:1`);
};

for (const [name, palette] of Object.entries({ light, dark, airport })) {
  test(`${name}: body, secondary text, links and placeholders meet normal-text contrast`, () => {
    for (const background of ['--bg', '--surface', '--surface-2']) {
      for (const foreground of ['--ink', '--muted', '--link']) {
        passes(palette, foreground, background, 4.5, name);
      }
    }
    passes(palette, '--sign-ink', '--sign', 4.5, `${name} primary action`);
    passes(palette, '--bg', '--ink', 4.5, `${name} inverse button`);
  });

  test(`${name}: control outlines and selected-tab indicators remain distinguishable`, () => {
    for (const background of ['--bg', '--surface', '--surface-2']) {
      for (const foreground of ['--field', '--focus', '--selection-mark']) {
        passes(palette, foreground, background, 3, name);
      }
    }
  });

  test(`${name}: availability status labels remain readable independently of colour`, () => {
    for (const status of ['go', 'warn', 'alert']) {
      passes(palette, `--${status}`, `--${status}-bg`, 4.5, name);
    }
    passes(palette, '--muted', '--mute-bg', 4.5, `${name} unknown status`);
  });
}

test('system dark preference and explicit dark mode use the same semantic palette', () => {
  assert.deepEqual(systemDark, dark);
});

test('departures-board labels are readable on the board and split-flap cells', () => {
  for (const background of ['--board', '--board-cell']) {
    for (const foreground of ['--board-ink', '--board-dim', '--sign']) {
      passes(light, foreground, background, 4.5, 'departures board');
    }
  }
});

test('reading surfaces are opaque in both modes and airport scope explicitly establishes text colour', () => {
  for (const palette of [light, dark]) {
    for (const surface of ['--floating-surface', '--guide-surface', '--room-reading-surface']) {
      assert.equal(palette[surface], 'var(--surface)', 'Artwork must not alter the tested reading contrast');
    }
  }
  const start = css.indexOf('.room-environment[data-room-setting=airports] .room-arrival-copy,');
  const block = css.slice(css.indexOf('{', start), css.indexOf('}', start));
  assert.match(block, /color:\s*var\(--ink\);/, 'Local --ink alone does not change an inherited CSS color');
  assert.match(block, /color-scheme:\s*dark;/, 'Native controls must follow the local navy panel');
});
