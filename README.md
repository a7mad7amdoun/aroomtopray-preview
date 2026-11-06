# A Room to Pray — design review preview

[Open the preview](https://a7mad7amdoun.github.io/aroomtopray-preview/)

Ahmed’s refinement, shared with Hamza for review. This separate preview does not deploy to or modify **aroomtopray.com**.

## What to review

- The original room, glass and doorway, with navy/yellow wayfinding and light/dark themes.
- Airport, university and hospital directories: search, country and facility filters, list/card views, pagination and interactive maps.
- Distinct terminal, campus and hospital visual identities, with signage-inspired lists, photographic spreads and three-step visitor guides.
- Place guides with room-level access information, source links, supporting official identities and related guides.
- Real photographic journals with location, author and license credits. Building photographs show context, not proof of a prayer room or current access.
- English, French, Arabic and Spanish navigation, keyboard access and mobile layouts.

Search, filters, language/theme switching and saved places run in the browser. Contact/report forms, check-ins, photo uploads and server analytics are disabled in this static preview. External street-map availability depends on the provider; direct map links remain available.

## Source and attribution

Based on Hamza’s [A Room to Pray](https://github.com/Inheriting-Islam/aroomtopray), originally imported at commit `06e7288a5852ca3e5675d7f24bc5de80e4d8e887`. Existing attribution and source links are retained. Photographs carry their individual credits and licenses. Illustrative room artwork is not evidence of a particular institution’s prayer room. Selected official-source summaries record their review date and limitations; the entire directory is not represented as freshly verified.

## Structure

- [site/](site/): Astro source, assets and tests. Server function source is retained for reference; GitHub Pages does not deploy it.
- [docs/](docs/): generated static review snapshot served by GitHub Pages.
- [research/](research/): provenance, design decisions and review notes.
- [design/](design/): artwork sources and prompts.

## Refresh the review snapshot

Use Node 22.13+ and the pnpm version specified in [package.json](site/package.json):

```sh
pnpm --dir site install --frozen-lockfile
pnpm --dir site test
PUBLIC_PREVIEW_BASE=/aroomtopray-preview PUBLIC_REVIEW_PREVIEW=true pnpm --dir site build
node site/scripts/prepare-github-preview.mjs site/dist docs /aroomtopray-preview
```

Commit the refreshed snapshot. GitHub Pages serves `main` → `/docs`. Keep this preview separate from production; do not add a custom domain or production credentials.

## November 6 review

The final local refinement passed 320 tests, a 2,189-page build, 48 responsive page/theme checks and 12 map integration scenarios. The generated-site audit reported no broken local references, fragment targets, image references or control targets. Visual checks covered directory records, category covers and photographic journals. Keyboard checks covered map filter removal and pagination through the final result page.

The publication review additionally validates the mounted GitHub Pages snapshot and the deployed site. Review details are retained in [the handover](research/airport-atlas-art-direction-2026-11-05.txt).

The category-identity update adds terminal, campus and hospital palettes, photographic editorial spreads, signage-inspired lists and concise visitor guides. Its additional checks covered 24 guide viewport/theme combinations in English and Arabic, 12 atlas scenarios, and the final 320-test suite. Original room artwork and glass remain intact.
