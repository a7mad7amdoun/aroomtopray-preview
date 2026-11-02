# Quiet Threshold — master design and implementation prompt

## Brief and authority

Create a complete new visual design for Ahmed’s A Room to Pray preview. The central idea is a peaceful prayer room with a working doorway: a place of stillness within an airport, university, or hospital. Ahmed’s room concept should lead the experience. Hamza’s recognizable wayfinding identity, practical information, and care with sources should give it credibility. The result must feel architectural, contemporary, composed, and useful on every page.

This is a substantial visual change, with the existing directory and visitor tools preserved. Work in `aroomtopray-preview`; publish only to Ahmed’s authorized GitHub Pages preview. Do not modify Hamza’s live site, DNS, credentials, or production services. Keep the review notice, disabled submissions, and original attribution.

Treat this document as an executable product brief. Inspect, implement, test, and refine the actual website. Deliver working pages and assets, not a concept presentation. Choose tools appropriate to the material: interface text and symbols in HTML/SVG; photographic or illustrated architecture as carefully prepared raster artwork.

## Evidence and inherited strengths

Hamza’s [live homepage](https://aroomtopray.com/) was read directly on 2 November 2026. It foregrounds airport search, a sample departures board, and six practical answers: location, security side, hours, wuḍūʾ, provision for women, and qibla. It explains official sources, check dates, editor-reviewed reports, and a workflow in which visitors copy a message and contact the institution themselves. Those are product strengths to preserve and make easier to understand.

The live HTML specifies signal yellow `#FFC629`. The research pass successfully read the [live stylesheet](https://aroomtopray.com/_astro/about.C41yr70D.css), confirming dark background `#0A111C`, surface `#111B2A`, elevated surface `#162235`, text `#E7ECF2`, muted text `#A3B0C2`, border `#26354B`, and field `#5F708A`. Hamza uses Archivo for display, Atkinson Hyperlegible for body text, JetBrains Mono for boards, and Noto Naskh Arabic. His sign lettering combines Archivo weight 800 with 125% stretch. Preserve its confident wayfinding character while unifying the new interface around Archivo and Noto. The live homepage’s reported totals differ from the expanded preview. Always calculate preview counts from its own records; never replace them with a copied marketing number.

| Existing strength or problem | New treatment |
| --- | --- |
| Hamza’s useful airport sign and departures board | A restrained wayfinding system that names destinations and presents real information |
| Ahmed’s quiet room and interactive doorway | A large architectural scene with a genuine purpose: orienting the visitor and previewing destinations |
| Separate scene and information experiences | One continuous page with search beside the room and useful content immediately below |
| Numerous competing surfaces and decorative treatments | One typography scale, one palette, one spacing system, and a small set of components |
| Carefully researched records and visitor tools | Preserve their behavior; improve scanning, priorities, and source presentation |

## Art direction: a quiet threshold

Design the experience around arrival, orientation, and reassurance. Give the room physical depth through believable proportions, restrained materials, soft daylight, and a grounded floor. Use plaster, pale stone, muted timber, and a simple prayer mat. Keep surfaces quiet. The architecture should support the task without becoming a game, a showroom, or a collection of floating panels.

Make the opening composition two coordinated parts: a generous cinematic sanctuary on the left and the real page introduction and search on a flat paper ground on the right. Align their visual center and lower edge when content permits. They belong to one framed composition, connected by a fine yellow wayfinding line. Avoid a frosted panel floating over the artwork. Let content determine height; longer translations and expanded filters must never overlap the door or become clipped. The primary header is ivory by day and navy at night; retain consistent branding and navigation in both themes.

The yellow line is the recurring signature. Use it at the threshold, under the current destination, and beside essential information. It should help people understand where they are and where to go next. Avoid yellow outlines around every component, decorative floor routes, animated light trails, or unexplained numbering.

The room should remain visible while the guide remains immediately usable. Remove the former Room/Guide mode switch and its stored hiding behavior. A clear “Find a place” action should move to the real search. Browsing, selecting a country, reading access restrictions, and checking a map should feel like the natural continuation of entering the room.

## Typography, color, and geometry

Use Archivo for Latin headings, body copy, navigation, tables, and controls. Use its weights and numeric features to distinguish content; do not introduce separate category typefaces. Use Noto Naskh Arabic for Arabic with deliberate line height and natural spacing. Maintain Latin names and airport codes in their correct writing direction. Preserve the English brand name and existing mark while giving them enough size to establish recognition.

Set body text at approximately 16–17px with 1.6–1.75 line height. Use 400 for prose, 500 for controls, and 600 for headings. Avoid excessively heavy headings, tiny uppercase metadata, and wide letter spacing. Desktop hero titles may reach 48–60px; mobile titles should remain approximately 32–40px and wrap naturally. Secondary headings should be clearly subordinate. Limit long prose to roughly 60–70 characters per line.

Build light mode from warm parchment, ivory surfaces, navy text, and restrained yellow. Build dark mode from deep navy, slightly elevated navy surfaces, warm pale text, and the same yellow. Suggested starting tokens are light background `#F1EFE8`, light surface `#FAF8F2`, light ink `#142033`, dark background `#0A111C`, dark surface `#111B2A`, and signal `#FFC629`. Validate contrast in the finished combinations. Status colors must retain textual labels and their established meanings.

Use a centered maximum width around 1360–1440px, consistent outer gutters, and an 8px spacing rhythm. Prefer 24–32px between related sections and 40–64px between major sections. Keep corners modest, around 6–10px. Use borders and tonal separation before shadows. Remove unnecessary nested cards and competing outlines. Align section headings, search fields, result rows, photographs, and footer columns to shared edges.

## Room artwork and working doorway

Prepare a coherent family of sanctuary artwork, with desktop and mobile compositions and coordinated light and dark variants. Use the edited sanctuary portrait as the large architectural artwork, preserving its registered doorway. Complement it with three architectural setting illustrations combining hand-drawn pen detail and restrained gouache color: airport, campus, and hospital. The door aperture must be deliberately placed and geometrically registered. Record its source-image coordinates, derive percentage positions, and scale the entire architecture as one unit. Never independently stretch the wall and HTML doorway.

The homepage door begins closed. Its window should offer a restrained, believable glimpse or crafted translucent view; avoid a large generic emblem pasted on the glass. Category pages begin with the corresponding destination visible through the open doorway. Airports reveal a quiet terminal; universities reveal a campus passage or courtyard; hospitals reveal a calm public corridor. These are illustrative destination settings, not claims about a listed institution.

Build the door leaf, frame, handle, hinges, window, reflection, and threshold as one physical system. The hinge is fixed; the leaf rotates from the correct edge; the outside scene remains stationary. Reflections and shadows should respond subtly. Use one reversible easing curve, approximately 650–850ms, without bounce, exaggerated perspective, or camera movement. A second activation during motion should reverse smoothly.

Keep the native door button outside the moving plane, with a stable hit target, visible action label, keyboard support, and accurate expanded state. Opening it must not navigate unexpectedly. Destination notices remain ordinary links that navigate reliably regardless of door state. Homepage hover or keyboard focus may preview a destination, but navigation must not depend on hover. Keep the light switch recognizable, labelled, and reachable without crossing the reading area.

Label generated or illustrative architecture unobtrusively and honestly. Keep that disclosure readable in both themes. Do not add text inside generated imagery that the interface must communicate. Render room names, destination labels, arrows, and instructions as accessible interface elements.

## Homepage and category stories

The homepage should communicate the promise in one heading and one short sentence, followed by the actual all-place search. Avoid a second decorative version of the same headline. Search should accept names, airport codes, cities, and countries using the existing index. Preserve suggestions, keyboard selection, empty states, and accessible announcements.

Follow the arrival composition with a navigation rail of three equal illustrated destination notices. Each should have a meaningful emblem, a clear category name, an actual count, and a concise explanation of the practical question it answers. Use the airport, campus, and hospital pen-and-gouache illustrations as the distinctive artwork for these notices. Airport storytelling emphasizes terminal and security boundaries; university storytelling emphasizes building and eligibility; hospital storytelling emphasizes public access and chaplaincy guidance. Give them coordinated proportions and distinct imagery without creating three brands.

Keep country exploration and visit preparation in the established tabs. Make the selected tab unmistakable through text weight and a yellow indicator, with a visible focus state. The departures board should remain a useful, compact representation of existing records. Preserve the source explanation and the ask-for-a-room workflow, but avoid repeating the same promise above and below every control.

## Directory, map, and country pages

Each category directory should share the same sequence: identity and short explanation; search and country selection; optional filters; results, map where available, and guidance. Bring the working controls into the arrival area. Keep results directly connected to those controls, with a clear count and an obvious way to remove active filters.

Results should prioritize name, city and country, actual room status, and essential access or facility information. Use the existing meaningful symbols with labels. Keep one consistent code/flag column and adequate row height. Preserve list/card presentation, sorting, pagination, copied filter links, and return-to-results context. Do not silently discard filters when visitors inspect a place and return.

Retain accurate geographic data and the existing airport map. Improve marker contrast, selection rings, zoom labels, country names, and the selected-place panel. A selected marker must correspond clearly to a place in the list. Preserve filtered-out selection explanations and the reveal-in-results action. Keep controls outside dense map information and ensure essential information can be reached without map gestures.

Present country flags as crisp, consistently sized assets, accompanied by country names. Preserve their real proportions and established designs. Do not invent stylized national insignia. Avoid repeating large flags in every metadata line. Country search and counts must remain factual and usable on narrow screens.

## Place pages and supporting tools

Every place page should begin with breadcrumb context, the real place name, city/country, and existing status or source-check information. Keep the beginning compact enough to orient the visitor beside the room artwork. Place access restrictions, provisional status, conflicting-source notes, and opening information before optional interaction or promotional material.

Use the same order for room information: where to go; who can enter or which security side; opening hours; available facilities; source and source date. Preserve the distinction between an explicitly absent facility and information that is not stated. Keep individual rooms separate when their facilities differ. Summary statistics must never imply that every room has every listed amenity.

Preserve qibla information and its limitations, room selectors, photographs, food information, nearby mosques where present, chaplaincy instructions, saved places, notes, print tools, and correction links. Maintain the existing tabs and deep links. Put optional tools after the visitor can answer the immediate question: “Can I get to this place and pray there?”

Apply the same structure to visit preparation, saved places, the planner, travel guidance, Rooms Won, About, Contact, and Terms. Keep each page’s actual purpose and existing logic. Long reading pages need a calmer measure; planning tools need room for controls. Do not force every page into identical decorative cards.

## Photography, factual integrity, and accessibility

Enlarge genuine place photographs where useful, using the best available authorized originals. Preserve captions, photographer credits, license links, source URLs, and descriptions distinguishing exteriors from prayer rooms. Do not use generative enlargement or invented details as documentary evidence. If the original resolution is limited, choose a sensible display size and crop. Never imply every record has a photograph when it does not.

Do not invent access rules, room details, opening hours, check dates, endorsements, institutional logos, or affiliations. Preserve record identifiers and canonical saved-place identities. Add information only when it fills a real gap and has a reliable source. Preserve attribution to Hamza and the independent-directory explanation.

Design English, French, Arabic, and Spanish together. Use logical spacing properties; allow longer labels; preserve correct keyboard order and directional arrows. Retain one semantic heading hierarchy, labelled controls, visible focus, sensible landmarks, and at least 44px interaction targets where practical. Test contrast, keyboard-only use, reduced motion, zoom, blocked storage, and no-JavaScript fallbacks. Essential content must not require an animated door.

## Responsive implementation and acceptance

Use genuine responsive composition. At wide widths, architecture and functional introduction sit beside each other. On tablets, rebalance columns or stack before either becomes cramped. On phones, use a deliberate compact architectural crop followed immediately by the introduction and search within the same continuous surface. Avoid a full-screen decorative prelude. The header should remain compact, with destinations and language selection available in its menu.

Keep all images dimensioned to prevent layout shifts. Deliver appropriately sized WebP/AVIF where supported, responsive sources, lazy loading below the fold, and priority only for the first visible scene. Avoid loading unnecessary category variants on pages that cannot show them. Preserve static rendering and existing routes. Keep shared tokens and structural rules in explicit ownership; retire obsolete mode styles instead of stacking another contradictory override layer.

Before delivery, verify these outcomes:

- One coherent identity appears across home, three directories, representative place pages, and every supporting page type.
- Closed homepage door, open category doors, window treatment, and both themes remain legible and functional.
- Search, filters, country navigation, tabs, map selection, pagination, saved tools, deep links, and language switching retain their behavior.
- All records, source links, attributions, provenance labels, and existing restrictions remain intact.
- Desktop, tablet, narrow mobile, RTL, print, and reduced-motion layouts have no known overlap, clipped controls, or hidden headings.
- Generated preview paths, assets, internal links, and disabled submission behavior are correct.
- Relevant tests and static checks pass. Inspect rendered pages only through an authorized available path. An existing URL-policy block must not be bypassed through another browser, host, screenshot mechanism, or renderer.
- Report exactly what changed, which checks ran, and which visual checks remain unavailable. Do not equate passing DOM tests with verified visual quality.

The finished website should make the room memorable and the information effortless to use. Every graphic, motion, label, and control must contribute to orientation, calm, or practical confidence.
