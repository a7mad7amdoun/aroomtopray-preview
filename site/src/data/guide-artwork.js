// Decorative works accompany preparation notes; none depicts a listed place.
// Museum provenance and image rights live alongside the assets in CREDITS.json.
const artworks = {
  airports: {
    id: 'airport-relief', title: 'A quiet current', artist: '', date: '',
    image: 'airport', widths: [600, 1000], width: 1000, height: 750,
    source: '',
  },
  universities: {
    id: 'campus-botanical', title: 'Spiraea aruncus (Tyrol)', artist: 'Anna Atkins', date: '1851–54',
    image: 'atkins-spiraea', widths: [600, 854], width: 854, height: 1200,
    source: 'https://www.metmuseum.org/art/collection/search/285421',
  },
  hospitals: {
    id: 'hospital-water-lilies', title: 'Water Lilies', artist: 'Helena de Kay', date: 'ca. 1870–77',
    image: 'de-kay-water-lilies', widths: [600, 1000], width: 1000, height: 655,
    source: 'https://www.metmuseum.org/art/collection/search/899646',
  },
};

const copy = {
  en: {
    original: 'Original concept artwork', museum: 'The Met · Public domain',
    alt: {
      airports: 'A sculptural study of brushed silver lines on a deep navy surface.',
      universities: 'Pale botanical leaves and flowering stems on a blue cyanotype by Anna Atkins.',
      hospitals: 'White water lilies reflected in dark green water, painted by Helena de Kay.',
    },
  },
  fr: {
    original: 'Création artistique originale', museum: 'The Met · Domaine public',
    alt: {
      airports: 'Une composition sculpturale de lignes argentées brossées sur un fond bleu nuit.',
      universities: 'Feuilles et tiges fleuries claires sur un cyanotype bleu d’Anna Atkins.',
      hospitals: 'Des nénuphars blancs se reflètent dans une eau vert sombre, peints par Helena de Kay.',
    },
  },
  ar: {
    original: 'عمل فني تصوّري أصلي', museum: 'متحف المتروبوليتان · ملكية عامة',
    alt: {
      airports: 'تكوين نحتي من خطوط فضية مصقولة على سطح أزرق داكن.',
      universities: 'أوراق نباتية وسيقان مزهرة فاتحة على طبعة زرقاء لآنا أتكينز.',
      hospitals: 'زنابق ماء بيضاء تنعكس في مياه خضراء داكنة، بريشة هيلينا دي كاي.',
    },
  },
  es: {
    original: 'Obra conceptual original', museum: 'The Met · Dominio público',
    alt: {
      airports: 'Una composición escultórica de líneas plateadas cepilladas sobre una superficie azul marino.',
      universities: 'Hojas y tallos floridos claros sobre una cianotipia azul de Anna Atkins.',
      hospitals: 'Nenúfares blancos reflejados en agua verde oscura, pintados por Helena de Kay.',
    },
  },
};

export function getGuideArtwork(category, locale = 'en') {
  const art = artworks[category] || artworks.airports;
  const language = copy[locale] || copy.en;
  return {
    ...art,
    alt: language.alt[category] || language.alt.airports,
    credit: art.source ? language.museum : language.original,
    src: `/art/guide-gallery/${art.image}-${art.widths[0]}.webp`,
    srcset: art.widths.map(width => `/art/guide-gallery/${art.image}-${width}.webp ${width}w`).join(', '),
  };
}
