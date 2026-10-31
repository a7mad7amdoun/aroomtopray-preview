# Rooms won: research notes

Data: `rooms-won.json` (28 entries; airports 15, universities 8, hospitals 5; read 13 Oct 2026). Page: `/rooms-won/`. Every source was opened and read, either directly or through r.jina.ai when blocked from Morocco.

Fields: `date` is a sort key (`YYYY-MM`, or `YYYY` when the source gives only a year); `dateLabel` is shown. `advocacy: true` only when the source itself says people asked or pushed for the room. `advocacyNote` paraphrases the source.

## Caveats on kept entries
- SEA 2017: the Northwest Dharma page shows "Nov. 28" without a year in the text; images are under /2017/12/ and the home page cites 2017.
- Harvard 2025: secondary source (Rakwa). The room was announced in August 2025 for fall 2025. The Harvard Crimson would be a better source if it can be read.
- AUH 2018: Passenger Terminal Today dates it Nov 2018. A Gulf News piece from Nov 2019 says the first *licensed* multi-faith room opened at the airport "in June" (2019). These may be different events, so we use the PTT date.
- MCO 2015: Truth or Fiction (a fact-check) confirms the September 2015 opening. The TravelPulse report from August 2015 describes it only as planned.
- Mount Royal: the stations opened in late 2018 and were celebrated in February 2019 (Education News Canada, 14 Feb 2019).
- Netcare CBMH: Netcare's own item (Dec 2016) gives Saturday 10 December as the planned official opening.
- HND 2014: from a Malay Mail report (Jan 2026) quoting the operator. No airport press release was found.

## Dropped
- Albany (ALB): the 2018 move made the room smaller (418 to 392 sq ft). That isn't an improvement.
- Newark Terminal A: the architect's page (PGAL) gives no date.
- DFW Terminal D ablution stations (2019): we found only secondary coverage of the 2026 dispute, and the proposed 2026 addition was cancelled.
- Munich T1: the only report found was a CAPTCHA-blocked advocacy-site page with no date. The airport's own page describes facilities without a date.
- Narita, Kansai: no dated source.
- Purdue (2020), LMU: the pages were blocked or only showed a cookie wall.
- Sofia T2: the only source was an undated Notion page.
- Long Island Jewish wudu room: no primary source opened.

## For the lead
- The home page's Houston link (fly2houston.com/newsroom/releases/…ritual-washing) now redirects to the newsroom index. The working URL is the one in rooms-won.json (iah-2024).
- Context: in Aug 2026 Texas's governor challenged the IAH and DFW ablution facilities, and DFW dropped its planned addition (Texas Tribune, 14 Aug 2026). The page states only what the sources say.
- LetterKit: `<LetterKit place={a.name} city={a.city} kind="airport" feedbackUrl={…} />`. It asks and never asserts what a place has.
