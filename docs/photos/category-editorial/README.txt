Twelve real architectural photographs for category and homepage editorial context.
They are not photographs of verified prayer rooms and must not be presented as
evidence of current access, amenities, opening hours or any other institution.

Attribution, individual Commons file pages, capture dates, original dimensions,
licences and change notices live in src/data/category-photography.js and the
generated provenance.json in this directory. Raw Commons API licence evidence is
retained in commons-source-metadata.json. Keep the author, licence link and source
link accessible alongside displayed photographs, including on the homepage.
The CC BY-SA derivatives retain their source licences. Display crops are allowed
and must retain the general change notice. No generated scene content is used.

Reproduce from site/:
1. Download each manifest originalUrl without changing its content to
   .local/category-editorial-originals/<id>.jpg (curl -fLsS).
2. Run node scripts/prepare-category-photography.mjs.
3. Run node --test tests/category-photography.test.mjs.

The script verifies source dimensions before producing uncropped 720, 1600 and
2880px-wide WebPs using Lanczos3 resampling and gentle sharpening. Eleven originals
are wider than 2880px. The KTPH original is 2848px wide; its largest derivative is
enlarged by 1.12% to 2880px, explicitly disclosed in the manifest and provenance.
This minimal enlargement adds no source detail. KTPH reuses an existing approved
photograph; the other eleven are new additions to this site's collection.
The first two entries per category preserve the established homepage selection.
The six additional category views cover Morocco, Spain, South Africa, Singapore,
Germany and Australia. None of these six additions requires enlargement.
Provenance records SHA-256 for the originals. Native originals remain in a local
working cache rather than being downloaded by page visitors.

Toronto airport source metadata notes personality rights. Its use here is an
editorial terminal overview, not an endorsement or a portrait. Historic hospital
signage must not be interpreted as present-day wayfinding advice.
