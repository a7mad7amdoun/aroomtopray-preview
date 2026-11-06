import { ROOM_FILTERS } from './directory-state.js';

// Keep these meanings identical to the airport directory's room-level flags.
export function airportRoomFlags(room) {
  return {
    airside: room.side === 'airside' || room.side === 'both',
    wudu: room.wudu === 'yes' || room.wudu === 'partial',
    women: room.women === 'yes' || room.women === 'partition',
    h24: /24 hours|24\/7|always open|day and night|any time/i.test(room.hours),
  };
}

export function matchingAirportRooms(roomDetails, search) {
  const params = new URLSearchParams(search);
  const active = new Set((params.get('f') || '').split(','));
  const filters = ROOM_FILTERS.filter(filter => active.has(filter));
  return roomDetails.flatMap((room, index) =>
    filters.every(filter => room.filters?.[filter] === true) ? [index] : []);
}

export function chooseAirportRoom(roomDetails, search, { preferredIndex = null } = {}) {
  if (!roomDetails.length) return -1;
  const matching = matchingAirportRooms(roomDetails, search);
  const value = new URLSearchParams(search).get('room');
  const urlIndex = /^[1-9]\d*$/.test(value || '') ? Number(value) - 1 : -1;
  if (Number.isSafeInteger(urlIndex) && matching.includes(urlIndex)) return urlIndex;
  if (Number.isInteger(preferredIndex) && matching.includes(preferredIndex)) return preferredIndex;
  return matching[0] ?? 0;
}

export function writeAirportRoom(index, search) {
  const params = new URLSearchParams(search);
  params.delete('room');
  if (Number.isSafeInteger(index) && index >= 0 && Number.isSafeInteger(index + 1)) {
    params.set('room', String(index + 1));
  }
  return params.toString();
}
