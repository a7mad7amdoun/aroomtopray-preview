# A Room to Pray upgrade plan

Prepared for Ahmed on 5 November 2026 for the **Improve aroomtopray.com locally** conversation.

A Room to Pray should feel like entering a peaceful room and leave the visitor knowing exactly where they can pray. The next upgrade should unite its architectural welcome, directory, room facts and travel tools into one dependable experience. The biggest gains will come from composition, clarity and completion across the entire journey.

This is an implementation plan, not a completed redesign. Three parallel audits examined design, engineering and product behavior. The active source is [aroomtopray-preview](../), not the older standalone [aroomtopray-local](../../aroomtopray-local/). The original public site is [aroomtopray.com](https://aroomtopray.com/), as confirmed by the project and its canonical URL; this resolves the spoken name in the request. Its homepage was fetched on 5 November and still leads with finding airport prayer rooms, terminal/security details, sources and check dates. The new experience must retain that practical promise.

## The intended experience

**A welcoming room connected to a remarkably clear guide.** Richness should come from light, proportion, beautifully set language and careful information design. It should feel equally welcoming to a student, a hospital visitor and an international traveller using an inexpensive phone.

The visitor should be able to arrive, search, identify an accessible room, inspect its evidence and take the instructions with them. Every page should help with one of those steps. The room should establish the identity; the guide should earn trust.

The proposed success targets are:

- On a 390 × 844 phone viewport at default text size, a usable search control appears in the first screen, with no prerequisite scene interaction.
- In representative usability sessions, a visitor can identify a room's access restrictions within 10 seconds and complete a find-and-save task within 60 seconds. These are targets to test, not current measured results.
- Search, filter, map, room choice, back navigation and saving form one continuous task without losing context.
- Every decisive fact retains its source, uncertainty and original check date. Beautiful presentation must never imply stronger evidence.
- Repeated refreshes, theme restoration, scroll restoration and image loading produce a stable composition.

## Preserve the work already accepted

Keep the logo, ivory/navy/yellow family, architectural room, fixed glass views, realistic place settings, full room composition and distinctive destination pages. Keep the familiar hospital setting. Preserve Room/Guide selection and the existing shared guide state, larger-text control, four language interfaces, saved-place identities and native URLs.

Keep Archivo and Noto Naskh Arabic for the interface. The current invitation additionally uses Garamond/Amiri treatments; assess those in the actual composition rather than reverting to an older font brief. Keep the accepted invitation wording, with Arabic shaping and translations reviewed as meaningful text. Allah's name remains on the homepage only, using the approved artwork and placement. Do not generate replacement sacred lettering.

Preserve the category transition where the wall and rug recede and the glass view approaches. Text, search and results remain stationary. Reduced motion must receive a complete static experience. Preserve first-paint preference restoration, frame deduplication and page-visibility safeguards already in the code.

Use the [A Room to Pray inspiration pack](../../outputs/site-inspiration/a-room-to-pray.md), especially A01 Pearson wayfinding, A07 Bait Ur Rouf proportion/light, A05 prayer-room distinctions, A06 Cambridge warmth and A11 readable fact sheets. The sibling site's identity is not part of this redesign. Pinterest discovery links are research leads, not inspected references. Illustrative environments remain distinct from credited photographs of real places.

## What the audit found

| Finding | Evidence | Consequence for this upgrade |
|---|---|---|
| Mobile search is ordered after the introduction, architecture and scene controls | [visual-room.css](../site/src/styles/visual-room.css) | Change the composition so search is reachable immediately while the room remains visible |
| Twenty-one global style layers are imported | [Base.astro](../site/src/layouts/Base.astro) | Consolidate ownership before spreading a new visual direction across every page |
| Room filtering already correctly matches combined facilities within a single room | [directory-state.js](../site/src/lib/directory-state.js) | Preserve this invariant and carry the matching room into the detail journey |
| Overview summaries emphasize aggregate amenities | [PlaceOverview.astro](../site/src/components/PlaceOverview.astro) | Elevate the chosen room's access and six essential facts |
| Airport note export uses security side as access and can omit separate access conditions | [place-notes.js](../site/src/lib/place-notes.js) | Fix copied/printed instructions early; preserve security side and additional conditions separately |
| Unsupported localized routes fall back to the translated homepage | [localized-routes.js](../site/src/lib/localized-routes.js) | Stop silent task loss before completing translations for saved places, planner and guides |
| Maps already support the three sectors and selected room information | [AirportMap.astro](../site/src/components/AirportMap.astro) | Finish and verify synchronization; do not rebuild maps as though they were absent |
| Indoor-map resources cover only selected institutions | [place-map-resources.js](../site/src/data/place-map-resources.js) | Offer official indoor maps where sourced; never make a facility pin look like a room entrance |
| Travel guidance has a global unreviewed flag | [guides.js](../site/src/data/travel/guides.js) | Track review per guide and retain unresolved review status honestly |
| Submissions and check-ins are deliberately disabled in the review preview | [AGENTS.md](../AGENTS.md), [prepare-github-preview.mjs](../site/scripts/prepare-github-preview.mjs) | Finish a useful static product first; production services require a separate handoff |

The style layering is a maintenance risk, not a measured performance result. Earlier conversation reports of passing tests are historical. No new build, test run or rendered visual audit was performed for this plan. Current Git status could not be verified because system Git requires missing Apple developer tools; pending map work must be inventoried before implementation.

## The major design changes

### 1 A homepage with one clear composition

Create a recognisable arrival: a full architectural room, a beautifully proportioned invitation on its quiet wall, a believable view through the glass, and one unmistakable way to find a place. Avoid a stack of unrelated hero panels, badges and controls competing for attention.

On desktop, compose the room and invitation together, then place search at the transition into the guide so it is visible without exploring the scenery. On mobile, bring a compact search entry directly beneath the invitation and before optional scene controls. The room stays present; its art direction adapts to the screen instead of forcing a desktop sequence into a long vertical introduction.

Use a single search state even if the control moves between layouts. Keep location/category scope clear. Make Airports, Universities and Hospitals three strong destination signs in one family. Place explanatory copy, provenance and secondary reading below the main task. Scene switching, artwork credits and appearance settings should be easy to find without dominating the welcome.

Acceptance: the identity is recognisable at a glance, the search is operable immediately, the mat/niche/glass retain deliberate framing, the invitation remains readable in day and night scenes, and all content is available with motion disabled.

### 2 A directory that makes choosing easier

Organize the directory around search, a concise results summary and results. Keep category/country context visible. Group advanced filters behind a clearly labelled control on small screens, while exposing active filters and individual remove actions. Do not hide important access restrictions in a filter drawer.

Use a consistent result hierarchy: place name and code, location, access/security constraints, evidence status, then facilities. Retain compact list and richer selected states without duplicating every fact in several boxes. Unknown, planned, pending and conflicting information should be distinct and understandable without decoding color.

The list and map must agree on the selected place and matching rooms. Preserve URL state, browser Back, filters and useful scroll position. When filters yield no result, explain the situation and allow removing one filter without clearing everything. Show no invented availability or walking estimate.

Acceptance: a traveller can compare access conditions without opening every result, reach the relevant room directly, and return to the same results. Maps remain optional and the list works if third-party mapping fails.

### 3 Room details built around the actual visit

Make the selected room the center of the detail page. Start with room name, exact stated location, terminal/building, security side and access conditions. Follow with opening hours, wuḍūʾ, women's space and qibla. Present these as calm, semantic label/value rows that stack naturally on phones.

Where several rooms exist, provide a compact comparison/selector that shows meaningful differences. A directory filter match should land at the relevant room without claiming that other rooms share its facilities. Keep institution-level summary information, but label it as such.

Place the source check date and evidence status beside the decisive facts; let visitors expand the full source explanation. Put real photographs beside the room information with exact attribution, appropriate captions and no misleading crop. Separate facility directions from official indoor-map resources and textual room directions.

Offer Save, Copy instructions and Print as practical next actions. Copy/print must include security side, separate access conditions, source date, source link and room identity. Saving a link must not claim to make the full guide available offline.

Acceptance: all six essential facts can be read without switching unrelated tabs; unknown facts stay explicit; printed and copied output preserves the same restrictions as the page.

### 4 Distinct settings within one identity

Airports can use crisp departure-board hierarchy, codes and precise arrows. Universities can use a warmer campus atmosphere and strong building/access descriptions. Hospitals should feel familiar, reassuring and especially clear about location, visiting conditions and staff contacts where sourced.

Keep common typography, action labels, spacing, status treatments and navigation. Distinction should come from the existing room setting, documentary photographs and context, not a new color system for every section. The homepage and category scenes may be expansive; detail and reading pages should devote more space to useful information.

### 5 Finish the supporting pages and states

Apply the same design system to saved places, planner, travel reading, about/contact, footer, menus, search suggestions, loading, empty/error states, print and not-found pages. Treat disabled preview functions honestly at the point where a visitor encounters them.

Preserve the task when changing languages. Until an equivalent route exists, explicitly identify the page's available language and keep the current context. Complete the most important tools in French, Arabic and Spanish through shared templates. Keep original source quotations available and distinguish translated interface text from reviewed factual translations.

Make the planner's example journey unmistakable. Validate time zones, DST, overnight/cross-date journeys and its stated calculation limits. Keep endpoint estimates distinct from in-flight prayer guidance. Give each travel guide a review status and resolve editorial questions with qualified review rather than presenting an unreviewed article as authoritative.

## Implementation sequence

Effort ranges below are planning estimates for focused working days, not promises or elapsed agent time. A phase finishes when its acceptance gate passes. Translation and external editorial review may extend the schedule.

| Phase | Work and ownership | Deliverable and gate | Indicative effort |
|---|---|---|---|
| 0 Baseline | Integration lead inventories current files, pending map work, routes, source data and representative states | Recoverable baseline, current browser captures, test/build baseline, recorded unresolved issues | 0.5–1 day |
| 1 Prove the direction | Design and UI lead develops homepage, mobile directory and difficult multi-room detail together | Three working compositions in both themes, with Arabic and enlarged-text checks; clear visual improvement and no task regression | 2–3 days |
| 2 Unify the system | UI lead consolidates tokens, layout and component styles; integrator owns shared layout | Existing cascade replaced progressively; no extra global redesign override sheet; accepted motion preserved | 1–2 days |
| 3 Complete the journey | Product and interaction lead handles room selection, list/map state, copy/print, saved state and empty/error recovery | Find → filter → choose room → inspect evidence → save/copy → Back works end to end | 2–3 days |
| 4 Finish content and routes | Content/localization lead and integrator close route gaps and tool parity; appropriate reviewer handles religious guidance | Explicit language fallback, translated priority tools, reviewed factual outputs, per-guide status and honest preview messaging | 2–4 days plus external review |
| 5 Verify and package | Independent QA lead checks the exact generated preview with integration lead | Browser evidence, tests, performance report, known limitations and reproducible local startup/release instructions | 1–2 days |

The static usable milestone follows phases 0–3 and the critical parts of 4–5: working search, three sectors, trustworthy room details, maps with fallback, saving, copying, printing, validated client-side tools and clear language behavior. Full content parity can continue only where unfinished areas are explicitly identified. Production replacement is a separate milestone.

## Agent instructions and integration rules

Use the available four-agent capacity: one integration lead plus three bounded contributors. Rotate roles by phase rather than spawning agents who all modify the same components.

**Integration lead:** own the baseline, shared layout, merge order and release. Read the current conversation and this plan before work. Inventory pending changes before assigning files. Do not overwrite the existing map work. Keep a task ledger with owner, files, dependency, evidence and remaining issue. Review each contribution before moving to the next phase.

**Design and UI contributor:** own agreed room/navigation and presentation components. Produce a visible composition change, not a new collection of decorative treatments. Establish spacing, type hierarchy, surfaces and action states in the owning styles. Preserve sacred lettering, the established palette and accepted transitions. Supply desktop/mobile, theme and RTL evidence with the changes.

**Product and interaction contributor:** own room matching, context restoration, saved/copy/print and later the map integration once its pending state is recorded. Preserve same-room matching, unknown states, source dates and existing identifiers. Test meaningful failure cases, especially separate access restrictions, multiple rooms, blocked storage and browser Back.

**QA and accessibility contributor:** begin read-only baseline review while implementation proceeds. Own journey tests, rendering matrix, refresh stress checks and verification records in a separate assigned area. Report failures with route, viewport, locale, theme, steps and expected/actual behavior. Do not change shared CSS while the design contributor is working there; route fixes to the owner. Rotate this slot to content/localization once the baseline is established, then back to independent QA for release.

No two contributors edit the same file concurrently. Changes to factual datasets, translations of source claims, dependency upgrades and deployment configuration require an explicit scope decision by the integration lead. Retain established Astro rather than introducing a framework migration as part of the design upgrade.

## Verification and completion gates

### Functional and evidence checks

Run the repository's Node tests, build, preview preparation and mounted-path/asset checks. Add focused regression tests for the exported access omission, matching-room navigation, unsupported-language behavior and map/list restoration. Preserve record counts, room facts, source URLs, check dates, licenses, canonical routes and saved IDs against the baseline. No facility claim may be introduced from architectural inspiration.

Exercise a traveller, campus visitor, hospital visitor, Arabic visitor and uncertain-listing journey. Use real records that actually satisfy the requested filters rather than assuming a named airport does. Validate keyboard-only operation, visible focus, 44 px primary touch targets, 200% text zoom, 320 px reflow and meaningful screen-reader labels. Review contrast to WCAG AA across text, controls, imagery overlays and status states.

### Actual rendering and refresh checks

Capture homepage, all three directories, one detail per sector, a multi-room case, empty results, map selection, saved places, planner and travel reading. Cover 360/390 px phones, 768 px tablet and 1440 px desktop; all four languages; both themes; larger text; reduced motion. Review representative Safari/iOS and Chromium behavior.

Repeat at least ten cold/warm refreshes for home, a category and a deep-linked room, with light/dark and Room/Guide preferences. Include slow-network image/font loading, failed imagery, denied storage, back/forward navigation, scroll restoration, Save-Data and no JavaScript. Record flashes, jumps, overlapping content and focus loss; fix the cause rather than hiding the page behind a loading overlay. At 200% text or shorter viewports, preserve readability and logical order rather than forcing the entire hero into one screen.

### Performance targets

Measure before optimization. Proposed targets are mobile p75 LCP ≤2.5 seconds, INP ≤200 milliseconds and CLS ≤0.1; field percentiles require real traffic, so prelaunch lab measurements are a proxy, not proof. Initial compressed JavaScript should aim for ≤100 KB, CSS ≤75 KB, and first-view mobile artwork/photography ≤500 KB, with documented adjustments if measurement justifies them.

Load the needed scene first; defer alternate scenes, offscreen galleries and optional maps. Keep decorative motion from shifting layout or running while hidden/offscreen. Aim for search/filter feedback within 100 milliseconds on a representative modest device. Do not treat total repository size as a page-transfer metric.

### Local use and production handoff

Provide a reproducible local run command using the package's Node ≥22.13 and pnpm 11.25 requirements. Verify the exact generated static snapshot, including mounted paths, before preview release. Record the source revision, successful checks, browser screenshots and known gaps together.

The current repository is a review preview. [AGENTS.md](../AGENTS.md) says: “Never deploy to aroomtopray.com, change its DNS, or connect Hamza’s production databases or credentials. Keep preview submissions disabled and original attribution intact.” This plan does not authorize production changes. A later production migration needs the owner's authorized deployment path, route/SEO preservation, moderation, spam protection, upload validation, privacy/retention rules, monitoring, rollback and tested recovery. Never simulate successful reports or check-ins in the static preview.

## Master implementation prompt

Use the following in the existing project conversation when implementing this plan:

> Upgrade the current A Room to Pray preview into a coherent, complete prayer-space guide. Read this plan, the current conversation's latest accepted decisions, the repository instructions and the primary inspiration pack first. Confirm the active source and inventory pending changes, particularly map work. Preserve the completed content and behavior. Work through the phases in order and use up to three bounded parallel contributors with one integration owner.
>
> Make the first visible result a substantial improvement to three connected compositions: the homepage, mobile directory and a multi-room detail. The homepage must feel like a complete peaceful room with realistic glass views and beautifully proportioned invitation text. Keep Allah's approved calligraphy only on the homepage. Retain the accepted wall/rug fade and glass approach on category pages; keep reading content stationary. Preserve the current identity, room artwork, day/night choices, larger text and Room/Guide behavior. Use light, spacing and hierarchy to create richness. Do not introduce another competing visual theme.
>
> Put usable search within immediate reach on mobile. Give the visitor one clear route from choosing a setting to finding a place, understanding access and taking instructions away. Reduce competing toolbar decisions while retaining useful filters and modes. Preserve filter/search/map state and Back behavior. Make each matching room, rather than institution-wide aggregate amenities, the unit of the practical journey.
>
> Lead detail pages with exact stated location, security/access, hours, wuḍūʾ, women's space and qibla. Keep source dates and evidence status nearby. Preserve unknown, pending, planned, conflicting and source-quality distinctions. Never infer availability, exact entrances, walking times or permission to enter. Keep institution coordinates separate from room directions and official indoor resources. Preserve photograph attribution and distinguish real photographs from illustrations.
>
> Fix the exported-access omission and verify Save, Copy and Print retain all conditions. Stop unsupported language changes from silently returning visitors to the homepage. Use shared page structures to close English/localized feature drift. Keep original source prose accessible. Make example planner data unmistakable and verify date/time-zone behavior. Keep unreviewed guidance visibly identified until appropriate review is complete. Every preview action must work locally or explain its limitation without pretending to submit data.
>
> Consolidate the existing style cascade progressively after capturing the baseline. Give tokens, layout, scenery, navigation, directory and details clear owners. Do not append another redesign stylesheet or rewrite the framework. Preserve native URLs, saved identifiers, same-room filtering, reduced-motion behavior and first-paint safeguards. Assign disjoint files to contributors, integrate in dependency order, and document meaningful decisions.
>
> Finish through evidence: functional tests, full build, mounted-path checks, content comparison and actual browser review of the exact output. Exercise both themes, all languages, mobile/tablet/desktop, enlarged text, keyboard and reduced motion. Reproduce refresh/startup behavior under slow loading, blocked storage and back navigation. Measure asset cost and performance. Resolve observed failures and report any remaining verification limit precisely. A passing source test is not a visual review.
>
> Deliver a usable local preview with startup instructions, a concise change summary, representative screenshots and a completed acceptance checklist. Follow the authorized preview workflow only. Do not modify production, enable backend submissions or contact Hamza as part of this implementation. Completion means the full core visitor journey works and the approved design is visibly coherent across the site.

## First implementation checkpoint

Begin with the baseline and a working slice of **homepage → directory → matching room → copied instructions**. Fix the access export as part of that slice, preserve the existing map work, and capture the three key compositions. That will establish a visible direction and a reliable core journey before the design expands to every remaining page.
