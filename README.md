# A Room to Pray — design review preview

[Open the preview](https://a7mad7amdoun.github.io/aroomtopray-preview/)

Ahmed’s local refinement, shared with Hamza for review. This is a separate copy; it does not deploy to or modify **aroomtopray.com**.

The room environment, doorway, multilingual directories, maps, photographs and visitor tools are included. Search, filters, language/theme switching and saved places run in the browser. Contact/report forms, check-ins, photo uploads and server analytics are disabled in this static preview. No live data services or deployment credentials are configured.

## Source and attribution

Based on Hamza’s A Room to Pray project, originally imported from [Inheriting-Islam/aroomtopray](https://github.com/Inheriting-Islam/aroomtopray) at commit `06e7288a5852ca3e5675d7f24bc5de80e4d8e887`. Existing source links and credits are retained. Individual photograph authors, source pages and licenses appear in the interface and `site/public/photos/places/CREDITS.json`. Flags retain their own attribution. Illustrated room environments are concept artwork, not evidence of a particular institution’s prayer room.

## Structure

- `site/`: Astro source and tests. Server function source is retained for reference and tests only; GitHub Pages does not deploy it.
- `docs/`: the prepared static review snapshot, served by GitHub Pages.
- `research/`: photo provenance and the research queue, retained separately from generated pages.
- No custom domain, production bindings or secret files are included.

## Refresh the review snapshot

Use Node 22.13+ and the version of pnpm specified in `site/package.json`:

```sh
pnpm --dir site install --frozen-lockfile
pnpm --dir site test
PUBLIC_PREVIEW_BASE=/aroomtopray-preview PUBLIC_REVIEW_PREVIEW=true pnpm --dir site build
node site/scripts/prepare-github-preview.mjs site/dist docs /aroomtopray-preview
```

Commit the refreshed snapshot to this repository. GitHub Pages serves `main` → `/docs`. Keep this preview separate from Hamza’s production deployment.

Verified before publication: full build, 113 unit tests, 48 mounted-URL interaction and page-structure scenarios across English/French/Arabic/Spanish, local artwork/assets and internal-link checks. Browser-rendered visual review was unavailable in the local execution environment.


## November 2 structural refinement

The header offers Room and Guide views. Room is the default; an explicit choice is remembered for this browser tab with `aroomtopray-preview.focus.v2` in session storage. The two views share the same guide DOM, so switching does not reset search, filters, tabs, map selection or visitor tools. Room view places the full architectural scene above the centered guide; Guide view hides the scene and starts at the information. Both choices remain available in the header.

The interface uses Archivo for Latin text and Noto Naskh Arabic for Arabic, with a shared ivory/navy/yellow palette. Branding, SVG country flags and existing photo galleries are larger. Photographs use their highest existing responsive sources; the content, dates, licenses and distinction between real photographs and illustrative scenes are retained. Layout changes do not add photographic coverage or synthesize details in documentary images.

The design was checked through the production build, tests, offline DOM scenarios and asset/link validation. Browser-rendered visual inspection remains unavailable; responsive CSS and theme rules have not been verified through screenshots.
