#!/bin/zsh
# Generates city banners with Codex, 3 at a time. Usage: scripts/gen-art.sh (run from art-src/). Skips existing PNGs.
X=/Applications/ChatGPT.app/Contents/Resources/codex
STYLE='Flat vector-style editorial illustration, wide panoramic banner, exactly 2400x900 pixels (8:3). Style must match a series: calm, minimal, geometric flat shapes with subtle grain, limited palette of cool terminal greys and slate blues (#E9EDF1, #C9D2DD, #8090A6, #16202E) with a single warm accent of signal yellow (#FFC629) used sparingly (a dusk horizon band and a few lit windows). Dusk light. Landmarks centred-right, generous empty sky on the left. On the far right a small airport control tower and a small plane. Absolutely NO people, NO text, NO letters, NO numbers, NO logos, NO signage, NO calligraphy, NO flags. Architecturally accurate, simplified silhouettes. Save as PNG.'
gen(){ [ -f "$1.png" ] && return; $X exec --skip-git-repo-check --sandbox workspace-write "Generate an image and save it as $1.png in the current directory. Subject: $2 $STYLE" > "$1.log" 2>&1; }
typeset -a J
J=(
"dfw|Dallas at dusk: Reunion Tower (sphere on a tall shaft), downtown towers, the Margaret Hunt Hill cable bridge over the Trinity River."
"mco|Orlando at dusk: Lake Eola with its fountain, downtown towers, palm trees and Florida lakes."
"phx|Phoenix at dusk: desert mountains (Camelback Mountain), saguaro cacti, downtown towers."
"clt|Charlotte at dusk: the Bank of America Corporate Center crown tower and uptown skyline, tree canopy."
"dtw|Detroit at dusk: the Renaissance Center cylinder towers on the Detroit River, the Ambassador Bridge."
"msp|Minneapolis at dusk: the Stone Arch Bridge over the Mississippi, the IDS Center and downtown towers."
"san|San Diego at dusk: the bay with sailboats, downtown towers, the Coronado Bridge curve, palm trees."
"tpa|Tampa at dusk: the silver minarets of the Tampa Bay Hotel (University of Tampa Plant Hall), downtown towers, the Hillsborough River."
"aus|Austin at dusk: the Texas State Capitol dome, downtown towers, Lady Bird Lake, the Congress Avenue bridge."
"hnl|Honolulu at dusk: Diamond Head crater, Waikiki beach towers, palm trees, the Pacific."
"fll|Fort Lauderdale at dusk: Las Olas canals with yachts, beachfront towers, palm trees."
"slc|Salt Lake City at dusk: the Wasatch mountains snow-capped behind the city, the Utah State Capitol dome."
"bwi|Baltimore at dusk: the Inner Harbor, the Domino Sugars-style industrial skyline without text, Federal Hill, tall ships."
"dus|Düsseldorf at dusk: the Rhine Tower, the Gehry buildings of the MedienHafen (curved, wavy facades), the Rhine river."
"cgn|Cologne at dusk: Cologne Cathedral's twin Gothic spires and the Hohenzollern Bridge over the Rhine."
"ham|Hamburg at dusk: the Elbphilharmonie (glass wave roof on a brick warehouse), the harbour cranes, St Michael's church tower."
"ber|Berlin at dusk: the Brandenburg Gate, the TV Tower (Fernsehturm, sphere on a needle), the Reichstag glass dome."
"stn|The countryside of Essex near Stansted at dusk: fields, a windmill, a village church, the airport's light terminal roof low on the horizon."
"ltn|Luton at dusk: rolling Chiltern hills, the town with a red-brick church tower, and the airport on the plateau."
"nce|Nice at dusk: the Promenade des Anglais curving along the bay, pastel facades (rendered grey), palm trees, the hills of the old town."
"vce|Venice at dusk: the Grand Canal, gondolas, St Mark's Campanile and the domes of Santa Maria della Salute."
"nap|Naples at dusk: the Bay of Naples with Mount Vesuvius behind, Castel dell'Ovo on the water."
"krk|Kraków at dusk: Wawel Castle and cathedral on the hill above the Vistula, St Mary's Basilica towers."
"mex|Mexico City at dusk: the Angel of Independence column, Torre Reforma and Chapultepec Castle, volcanoes faint behind."
"gru|São Paulo at dusk: a dense skyline of towers, the Octávio Frias de Oliveira cable-stayed bridge (X-shaped mast)."
"bog|Bogotá at dusk: the Andes mountains with Monserrate sanctuary on top, the Colpatria tower, the city at the foot."
"mnl|Manila at dusk: Manila Bay sunset, the Makati skyline, a traditional jeepney absent, palm trees along Roxas Boulevard."
"khi|Karachi at dusk: the Mazar-e-Quaid (white mausoleum with curved arches), the Arabian Sea, Masjid-e-Tooba's large low dome."
"lhe|Lahore at dusk: the Badshahi Mosque (red sandstone, three marble domes, four tall minarets), Lahore Fort walls, Minar-e-Pakistan tower."
"maa|Chennai at dusk: Marina Beach, the Kapaleeshwarar-style temple gopuram silhouette, the Chennai Central station towers."
"dac|Dhaka at dusk: the National Parliament House (Louis Kahn, geometric concrete with circles and triangles), a river with boats."
"dps|Bali at dusk: a split temple gate (candi bentar), rice terraces, palm trees and Mount Agung behind."
"alg|Algiers at dusk: the white city rising from the bay, the Maqam Echahid (three leaf-shaped concrete monument), the Great Mosque of Algiers tall minaret."
"tun|Tunis at dusk: the Zitouna Mosque square minaret above the medina rooftops, Sidi Bou Said white houses on a cliff."
"svo|Moscow at dusk: the Kremlin walls and towers, St Basil's onion domes, Moscow City skyscrapers behind."
"ika|Tehran at dusk: the Azadi Tower (inverted Y arch), the Milad Tower, the Alborz mountains snow-capped behind."
)
for ((i=1;i<=${#J};i+=3)); do
  for j in $J[$i,$((i+2))]; do gen "${j%%|*}" "${j#*|}" & done; wait
done
