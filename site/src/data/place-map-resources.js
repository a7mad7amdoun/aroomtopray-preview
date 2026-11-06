// Curated indoor-map links, discovered on the institutions' own pages.
// These are terminal/floor maps, not fabricated room pins or indoor routes.
// checked records the resource review only; original listing dates stay unchanged.
const reviewed = '2026-11-02';
const heathrowSource = 'https://www.heathrow.com/at-the-airport/airport-maps';
const hospitalSource = 'https://www.guysandstthomas.nhs.uk/our-services/spiritual-care';
const hospitalVisit = 'https://www.guysandstthomas.nhs.uk/st-thomas-hospital';
const resources = {
  lhr: {
    'T2 multi-faith prayer rooms': {type:'terminalMap',name:'Terminal 2',url:'https://maps.heathrow.com/?poiId=1701',source:heathrowSource},
    'T3 multi-faith prayer rooms': {type:'terminalMap',name:'Terminal 3',url:'https://maps.heathrow.com/?poiId=510',source:heathrowSource},
    'T4 multi-faith prayer rooms': {type:'terminalMap',name:'Terminal 4',url:'https://maps.heathrow.com/?poiId=1702',source:heathrowSource},
    'T5 multi-faith prayer rooms': {type:'terminalMap',name:'Terminal 5',url:'https://maps.heathrow.com/?poiId=509',source:heathrowSource},
  },
  'st-thomas-hospital': {
    'Multi faith prayer room': {type:'floorMap',name:'South Wing · Ground floor',url:'https://www.guysandstthomas.nhs.uk/media/12422/South%2BWing%2Bground%2Bfloor%2Bmap',source:hospitalSource},
    "St Thomas' Chapel": {type:'floorMap',name:'South Wing · 1st floor',url:'https://www.guysandstthomas.nhs.uk/media/12419/South%2BWing%2B1st%2Bfloor%2Bmap',source:hospitalSource},
  },
};
export function roomMapResource(code, roomName) {
  const resource=resources[code]?.[roomName];
  return resource ? {...resource,checked:reviewed} : null;
}
export function roomMapAdvisory(code, roomName) {
  if(code!=='st-thomas-hospital' || roomName!=="St Thomas' Chapel")return null;
  return {key:'hoursConflict',checked:reviewed,sources:[hospitalSource,hospitalVisit]};
}
