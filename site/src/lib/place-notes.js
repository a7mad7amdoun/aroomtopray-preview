import { L } from './airports.js';
export function placeNotes(p, kind) {
  const airport = kind === 'Airport';
  const warnings = [p.note || '',
    p.status === 'pending' ? 'Not checked yet. Prayer facilities at this airport have not been verified.' : '',
    p.hold ? 'Still checking: the official information is limited. Ask ward staff or the chaplaincy before visiting.' : '',
    p.conflict ? 'Published details differ or may be out of date. Confirm times and room numbers with the institution.' : '',
    p.thin ? 'Limited information: only one listing was found. Confirm location and access before visiting.' : '',
    kind === 'University' ? 'Most campus rooms are for students and staff. Check visitor access.' : ''
  ].filter(Boolean);
  return {
    path: p.url, name: p.name, kind, code: p.iata || '', city: p.city, country: p.country, qibla: p.qibla,
    status: airport ? L.status[p.status][0] : p.hold ? 'Still checking' : `${p.spaces.length} room listing${p.spaces.length === 1 ? '' : 's'}`,
    wudu: p.status === 'pending' ? 'Not checked yet' : L.wudu[p.wudu][0],
    women: p.status === 'pending' ? 'Not checked yet' : L.women[p.women][0], warnings,
    rooms: p.spaces.map(s => ({ name: s.name, location: s.loc, access: airport ? L.side[s.side] : s.access,
      hours: s.hours || 'Not stated', wudu: L.wudu[s.wudu][0], women: L.women[s.women][0],
      extra: [s.caution, s.extra, s.chapel ? 'Shared interfaith chapel; check hours and service times.' : '', s.jumuah ? `Group prayer: ${s.jumuah}` : '', s.qibla_marker ? `Qibla marker: ${s.qibla_marker}` : ''].filter(Boolean).join(' '),
      source: s.src, checked: s.checked || null,
      provenance: airport ? (L.verified[String(s.verified)]?.[0] || 'Not from the airport')
        : s.verified === true ? `Official ${kind.toLowerCase()} page`
        : s.verified === 'indirect' ? 'Official source, indirect copy' : `Not from the ${kind.toLowerCase()}` }))
  };
}
