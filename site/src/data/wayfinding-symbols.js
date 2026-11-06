/** Threshold: one architectural pictogram family on a 24-unit grid.
 * Solid structural masses + 2-unit service lines; currentColor only.
 * Names are functional API keys, never institution logos. */
export const SYMBOLS = Object.freeze({
  airport:{solid:'M11 2h2l1 7 7 5v3l-7-3v5l3 2v1l-5-1-5 1v-1l3-2v-5l-7 3v-3l7-5Z'},
  campus:{solid:'M2 8 12 2l10 6v2H2Zm2 4h3v7H4Zm6 0h4v7h-4Zm7 0h3v7h-3ZM2 21v-2h20v2Z',line:'M9 7h6'},
  care:{solid:'M5 2h14v9h3v11h-8v-5h-4v5H2V11h3Zm5 2v3H7v4h3v3h4v-3h3V7h-3V4Z'},
  room:{solid:'M4 20V11c0-4 3-7 8-10 5 3 8 6 8 10v9h-4v-9c0-2-1-4-4-6-3 2-4 4-4 6v9ZM2 22v-2h20v2Z',line:'M12 19v-7m-2 2 2-2 2 2'},
  arrow:{line:'M3 12h17m-6-6 6 6-6 6'},
  close:{line:'M5 5l14 14M5 19 19 5'},
  grid:{solid:'M3 3h7v7H3Zm11 0h7v7h-7ZM3 14h7v7H3Zm11 0h7v7h-7Z'},
  filter:{line:'M3 7h9m5 0h4M3 17h3m5 0h10',solid:'M12 3h4v8h-4ZM7 13h4v8H7Z'},
  globe:{line:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18Z'},
  list:{solid:'M3 4h3v4H3Zm0 6h3v4H3Zm0 6h3v4H3Z',line:'M10 6h11M10 12h11M10 18h11'},
  book:{solid:'M3 3h7l2 2 2-2h7v17h-7l-2 2-2-2H3Zm2 2v13h5l1 1V7L9 5Zm10 0-2 2v12l1-1h5V5Z'},
  key:{line:'M10 10l10 10m-5-5 3-3m0 6 3-3',solid:'M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2Zm0 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z'},
  help:{line:'M5 13V9a7 7 0 0 1 14 0v9c0 3-3 4-7 4',solid:'M3 11h4v8H3Zm14 0h4v8h-4ZM10 20h5v3h-5Z'},
  save:{solid:'M5 2h14v20l-7-4-7 4Zm3 3v12l4-2 4 2V5Z'},
  copy:{solid:'M7 7h15v15H7Zm3 3v9h9v-9ZM2 2h14v3H5v11H2Z'},
  print:{line:'M6 8V3h12v5M6 17H3V8h18v9h-3',solid:'M6 13h12v9H6Zm2 2v5h8v-5Zm9-5h2v2h-2Z'},
  pin:{solid:'M12 2a8 8 0 0 0-8 8c0 5 8 12 8 12s8-7 8-12a8 8 0 0 0-8-8Zm0 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z'},
  gate:{solid:'M3 2h18v4h-3v16h-3V6H9v16H6V6H3Z',line:'M2 22h20'},
  clock:{solid:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14Z',line:'M12 7v5l4 2'},
  water:{solid:'M12 2c-2 4-6 7-6 11a6 6 0 0 0 12 0c0-4-4-7-6-11Zm-2 9v2c0 2 1 3 3 3v2c-3 0-5-2-5-5v-2Z',line:'M3 22h18'},
  screen:{solid:'M3 4h5v16H3Zm13 0h5v16h-5ZM10 2h4v18h-4Z',line:'M2 22h20'},
  qibla:{line:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',solid:'m18 6-4 12-3-5-5-3Zm-7 7 3-1 1-3Z'},
  search:{solid:'M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z',line:'m16 16 6 6'},
  check:{line:'m3 12 6 6L21 5'},
  info:{solid:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm-1 6h2v8h-2Zm0-4h2v2h-2Z'},
  'door-closed':{solid:'M4 2h16v20h-3V5H7v17H4Z',line:'M2 22h20M13 12h1'},
  'door-open':{line:'M14 22h7V3H5M2 22h3',solid:'M4 2 15 5v17L4 19Zm3 4v11l5 1V7Z'},
  sun:{solid:'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z',line:'M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2'},
  moon:{solid:'M10 2a10 10 0 1 0 12 12A8 8 0 0 1 10 2Zm-3 5a10 10 0 0 0 10 10A7 7 0 0 1 7 7Z'},
  focus:{line:'M3 8V3h5m8 0h5v5M3 16v5h5m8 0h5v-5',solid:'M7 7h10v3H7Zm0 5h10v2H7Zm0 4h6v2H7Z'},
  photo:{solid:'M2 6h5l2-3h6l2 3h5v16H2Zm3 3v10h14V9h-4l-2-3h-2L9 9Z',line:'M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z'},
  source:{solid:'M4 2h11l5 5v15H4Zm3 3v14h10V9h-5V5Zm7 0v2h2Z',line:'M10 12h4m-4 4h4'},
  security:{solid:'M12 2 3 6v6c0 5 5 8 9 10 4-2 9-5 9-10V6Zm0 3 6 3v4c0 3-3 5-6 7-3-2-6-4-6-7V8Z',line:'m9 11 2 2 4-4'},
  community:{solid:'M12 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM5 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm14 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM7 21v-5a5 5 0 0 1 10 0v5h-3v-5a2 2 0 0 0-4 0v5ZM1 20v-5a4 4 0 0 1 5-4v3c-2-1-2 0-2 1v5Zm19 0v-5c0-1 0-2-2-1v-3a4 4 0 0 1 5 4v5Z'},
  food:{solid:'M3 2h2v6h2V2h2v6h2V2h2v8l-4 3v9H6v-9l-3-3Zm17 0v20h-3v-8h-3V8c0-3 3-6 6-6Z'},
});
export const SYMBOL_ALIASES = Object.freeze({airports:'airport',universities:'campus',hospital:'care',hospitals:'care',prayer:'room',access:'key',privacy:'screen',wudu:'water',direction:'qibla'});
export const symbolName = name => Object.hasOwn(SYMBOLS,name) ? name : SYMBOL_ALIASES[name] || 'room';
export function symbolMarkup(name) {
  const glyph=SYMBOLS[symbolName(name)];
  return `${glyph.solid?`<path d="${glyph.solid}" fill="currentColor" fill-rule="evenodd" stroke="none"/>`:''}${glyph.line?`<path d="${glyph.line}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="round"/>`:''}`;
}
// Original doorway mark: keep its 40-unit geometry independent of pictograms.
export const BRAND_MARK = '<path fill-rule="evenodd" fill="currentColor" d="M9 31V18.5C9 12.5 13.5 8.6 20 5c6.5 3.6 11 7.5 11 13.5V31ZM20 11.5l6 7h-4V28h-4v-9.5h-4Z"/><rect x="5" y="32.5" width="30" height="3" rx="1.5" fill="currentColor"/>';
