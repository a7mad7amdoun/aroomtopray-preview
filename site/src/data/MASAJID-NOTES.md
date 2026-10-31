# Masajid near the airport: notes

Data for the "Masajid near <IATA>" block on airport pages (`src/components/MasajidNear.astro`).
Published file: `src/data/masajid-near.json` (generated; do not hand-edit).

## How it is built

1. `node scripts/masajid/candidates.mjs [IATA ...]` (from `site/`) asks the OSM Overpass API for
   `amenity=place_of_worship` + `religion=muslim` within 25 km of each airport's coordinates in
   `airports.json`, nearest first, and writes `scripts/masajid/candidates.json` (15 nearest per airport).
   Overpass rate-limits; an airport that fails is skipped with a warning, so re-run it by code.
   `CANDIDATES_OUT=./candidates-b.json` plus `merge-candidates.mjs` lets two runs go in parallel.
2. A person checks candidates by hand, nearest first, on the masjid's own website (or the masjid's
   own listing page, e.g. its Masjid App page), and records each confirmed one in
   `scripts/masajid/confirmed.json`.
3. `node scripts/masajid/build.mjs` joins the two, computes the straight-line distance and writes the
   three nearest confirmed masajid per airport to `masajid-near.json`.

## Rules

- Publish only masajid whose own page (or the masjid's own listing) shows it exists and holds
  Jumuʿah. `verified: true` means exactly that, on the `checked` date.
- Distance is the great-circle distance between coordinates (`distance_basis: "straight-line"`).
  Never a drive time or road distance; the UI says so.
- `jumuah` is copied only from the masjid's own page, with `jumuah_read`. It is null when the page
  shows no time, shows conflicting times, or posts week-specific times (the UI then says "Check the
  masjid's website for Jumuʿah times").
- Address from the masjid's page where it gives one; otherwise from OpenStreetMap, said so in `note`.
- "Nearest by road" was the brief; this round orders by straight-line distance from OSM coordinates
  and stops at the 15 nearest OSM places, so a closer masjid missing from OSM is not considered.

## Editorial decisions for Hamza

- Left out: Ahmadiyya and Nation of Islam centres, and Ismaili jamatkhanas (no Jumuʿah).
- Left out this round: centres tagged `denomination=shia` in OSM. Whether to list them is your call.
- Directory listings (Zabihah, Salatomatic, halaltrip, church directories) are not accepted as
  confirmation.

## Round 1 (13 Oct 2026)

Scope: the 31 curated US airports plus LHR, LGW, CDG, AMS, FRA, MUC, YYZ, YVR, SYD, MEL.
Result: 52 masajid at 32 of 41 airports; 30 with Jumuʿah times from the masjid's own page.
No block yet (nothing confirmed): DEN, MSP, FLL, LGA, PHL, BNA, LGW, CDG, FRA.
- DEN: only one OSM mosque within 25 km; its site doesn't mention Jumuʿah.
- FLL: the only OSM entry is a Nation of Islam mosque.
- LGA, PHL, CDG, FRA: dense OSM coverage, but almost no website tags; the sites found were
  JavaScript-only or didn't mention Jumuʿah. A second pass with a real browser should fill these.
- MSP (Dar Al-Farooq), BNA, LGW (Crawley): sites JavaScript-only, blocked or silent on Jumuʿah.
Airports with no confirmed masjid get no block at all.
Common reasons a candidate was left out: no website found; website is JavaScript-only or blocked
from Morocco so the text could not be read; the site does not mention Jumuʿah.
