import test from 'node:test';
import assert from 'node:assert/strict';
import { airportRoomFlags, matchingAirportRooms, chooseAirportRoom, writeAirportRoom } from '../src/lib/airport-room-selection.js';

const rooms = [
  { filters: airportRoomFlags({ side:'landside', wudu:'yes', women:'no', hours:'09:00–17:00' }) },
  { filters: airportRoomFlags({ side:'airside', wudu:'no', women:'yes', hours:'24 hours' }) },
  { filters: airportRoomFlags({ side:'both', wudu:'partial', women:'partition', hours:'Always open' }) },
];

test('airport flags preserve directory meanings and unknowns', () => {
  assert.deepEqual(rooms[2].filters, { airside:true, wudu:true, women:true, h24:true });
  assert.deepEqual(airportRoomFlags({}), { airside:false, wudu:false, women:false, h24:false });
  assert.equal(airportRoomFlags({hours:'24/7'}).h24, true);
});

test('combined facilities must be present in the same room', () => {
  assert.deepEqual(matchingAirportRooms(rooms.slice(0, 2), '?f=airside,wudu'), []);
  assert.deepEqual(matchingAirportRooms(rooms, '?f=airside,wudu,women,h24'), [2]);
  assert.equal(chooseAirportRoom(rooms, '?f=airside,wudu'), 2);
});

test('place filters do not change room matching', () => {
  assert.deepEqual(matchingAirportRooms(rooms, '?f=room,halal,unknown'), [0, 1, 2]);
  assert.deepEqual(matchingAirportRooms(rooms, '?f=open'), []);
});

test('URL room is one-based and honored only when it matches', () => {
  assert.equal(chooseAirportRoom(rooms, '?room=3&f=airside', { preferredIndex:1 }), 2);
  assert.equal(chooseAirportRoom(rooms, '?room=1&f=airside'), 1);
  for (const room of ['0', '-1', '4', '1.5', '1e0', 'no', 'Infinity', '9007199254740993']) {
    assert.equal(chooseAirportRoom(rooms, `?room=${room}&f=airside`), 1);
  }
});

test('preferred room must match, otherwise choose first matching room', () => {
  assert.equal(chooseAirportRoom(rooms, '?f=airside', { preferredIndex:2 }), 2);
  assert.equal(chooseAirportRoom(rooms, '?f=airside', { preferredIndex:0 }), 1);
  assert.equal(chooseAirportRoom(rooms, '', { preferredIndex:99 }), 0);
  assert.equal(chooseAirportRoom(rooms, '?f=open'), 0);
});

test('empty rooms have no selection', () => {
  assert.deepEqual(matchingAirportRooms([], '?f=wudu'), []);
  assert.equal(chooseAirportRoom([], '?room=1'), -1);
});

test('writing a room preserves other query state and removes invalid selection', () => {
  const params = new URLSearchParams(writeAirportRoom(2, '?airport=lhr&f=wudu&room=1&q=London'));
  assert.equal(params.get('room'), '3');
  assert.equal(params.get('airport'), 'lhr');
  assert.equal(params.get('f'), 'wudu');
  assert.equal(params.get('q'), 'London');
  for (const index of [-1, null, undefined, '1', 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER]) {
    assert.equal(writeAirportRoom(index, '?airport=lhr&room=2'), 'airport=lhr');
  }
});
