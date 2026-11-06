// Real architectural context, never evidence of a prayer room or current access.
// Originals and licence evidence: /photos/category-editorial/commons-source-metadata.json.
const copy = (en, fr, ar, es) => ({ en, fr, ar, es });
// Institution pages whose real content was inspected on 2026-11-06.
// Blocked/challenge responses are deliberately omitted, not treated as verification.
const officialSites = {
 'bangkok-terminal':'https://suvarnabhumi.airportthai.co.th/',
 'toronto-campus':'https://www.utoronto.ca/',
 'madrid-terminal':'https://www.aena.es/en/adolfo-suarez-madrid-barajas.html',
 'capetown-campus':'https://uct.ac.za/',
 'ntu-campus':'https://www.ntu.edu.sg/',
 'berlin-hospital':'https://www.charite.de/en/',
};
// Focal positions reviewed against the actual originals, including narrow glass apertures.
const focus = { 'bangkok-terminal':'50% 60%', 'toronto-terminal':'52% 50%', 'toronto-campus':'65% 58%', 'lincoln-campus':'50% 42%', 'suburban-hospital':'62% 55%', 'ktph-bridge':'50% 45%' };
const photo = (record) => ({
 ...record,
 ...(officialSites[record.id]?{officialUrl:officialSites[record.id],officialCheckedOn:'2026-11-06'}:{}),
 objectPosition: focus[record.id] || record.objectPosition,
 context: 'architecture',
 sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(record.file.replaceAll(' ', '_'))}`,
 images: [720, 1600, 2880].map(width => ({ src: `/photos/category-editorial/${record.id}-${width}.webp`, width, height: Math.round(width * record.height / record.width) })),
 changes: record.allowEnlargement
  ? 'Uncropped original downsampled to 720 and 1600 pixels; 2848px original enlarged by 1.12% to 2880px using Lanczos3 with light sharpening. WebP encoding; display may crop. Enlargement adds no source detail. No generated content.'
  : 'Uncropped original resized down to 720, 1600 and 2880 pixels wide, lightly sharpened and encoded as WebP. Display may crop using the recorded focal position. No enlargement or generated content.',
 reviewedOn: '2026-11-06',
});
const bysa = version => ({ name: `CC BY-SA ${version}`, url: `https://creativecommons.org/licenses/by-sa/${version}/` });
export const CATEGORY_PHOTOGRAPHY = {
 airports: [
  photo({ id:'bangkok-terminal', category:'airports', title:'Suvarnabhumi Airport · Terminal C', location:'Bangkok, Thailand', file:'File:Suvarnabhumi Airport Terminal C interior (I).jpg', author:'Supanut Arunoprayote', date:'2019-05-27', license:{name:'CC BY 4.0',url:'https://creativecommons.org/licenses/by/4.0/'}, width:5518, height:3711, objectPosition:'50% 60%', originalUrl:'https://upload.wikimedia.org/wikipedia/commons/8/87/Suvarnabhumi_Airport_Terminal_C_interior_%28I%29.jpg',
   alt:copy('Arched glass concourse and gate signs in Suvarnabhumi Airport Terminal C.','Hall vitré voûté et panneaux des portes du terminal C de Suvarnabhumi.','ممر زجاجي مقوّس ولافتات البوابات في المبنى C بمطار سوفارنابومي.','Vestíbulo acristalado y señales de puertas en la Terminal C de Suvarnabhumi.'),
   caption:copy('A vaulted concourse, seen from the upper level, with gate signs along the central route.','Un hall voûté vu depuis le niveau supérieur, avec des panneaux de portes le long du passage central.','بهو مقوّس يُرى من المستوى العلوي، مع لافتات البوابات على طول الممر المركزي.','Vestíbulo abovedado visto desde el nivel superior, con señales de puertas a lo largo del paso central.') }),
  photo({ id:'toronto-terminal', category:'airports', title:'Toronto Pearson · Terminal 1', location:'Mississauga, Canada', file:'File:Interior of Toronto Pearson International Airport Terminal 1 wider view.jpg', author:'Daniel Case', date:'2015-06-27', license:bysa('3.0'), width:5382, height:3606, objectPosition:'50% 50%', originalUrl:'https://upload.wikimedia.org/wikipedia/commons/3/37/Interior_of_Toronto_Pearson_International_Airport_Terminal_1_wider_view.jpg',
   alt:copy('Wide view of the gate area in Toronto Pearson Terminal 1.','Vue des portes d’embarquement du terminal 1 de Toronto Pearson.','منظر واسع لمنطقة البوابات في المبنى 1 بمطار تورونتو بيرسون.','Vista amplia de las puertas en la Terminal 1 de Toronto Pearson.'),
   caption:copy('Travellers, overhead signs and a long skylight give this busy concourse its everyday rhythm.','Voyageurs, panneaux suspendus et longue verrière rythment la vie quotidienne de ce hall animé.','مسافرون ولافتات معلّقة وفتحة سقفية طويلة ترسم إيقاع الحياة اليومية في هذا البهو النشط.','Viajeros, señales suspendidas y un largo lucernario marcan el ritmo cotidiano de este vestíbulo.') }),
 ],
 universities: [
  photo({ id:'toronto-campus', category:'universities', title:'University of Toronto · Back Campus', location:'Toronto, Canada', file:'File:A view from the Back Campus of the University of Toronto.jpg', author:'Maksim Sokolov (Maxergon)', date:'2021-12-28', license:bysa('4.0'), width:9180, height:4450, objectPosition:'50% 50%', originalUrl:'https://upload.wikimedia.org/wikipedia/commons/6/67/A_view_from_the_Back_Campus_of_the_University_of_Toronto.jpg',
   alt:copy('A view across the Back Campus of the University of Toronto.','Vue du Back Campus de l’Université de Toronto.','منظر من منطقة باك كامبس في جامعة تورونتو.','Vista del Back Campus de la Universidad de Toronto.'),
   caption:copy('Stone towers and the city skyline frame a quiet, snow-covered campus.','Des tours de pierre et la silhouette de la ville encadrent un campus calme, couvert de neige.','أبراج حجرية وأفق المدينة يؤطّران حرمًا جامعيًا هادئًا تغطيه الثلوج.','Torres de piedra y el perfil de la ciudad enmarcan un campus tranquilo cubierto de nieve.') }),
  photo({ id:'lincoln-campus', category:'universities', title:'Lincoln University · Landscape Architecture', location:'Lincoln, New Zealand', file:'File:Landscape Architecture Building, Lincoln University Campus, New Zealand 06.jpg', author:'Michal Klajban', date:'2019-12-09', license:bysa('4.0'), width:5472, height:2920, objectPosition:'50% 50%', originalUrl:'https://upload.wikimedia.org/wikipedia/commons/e/e0/Landscape_Architecture_Building%2C_Lincoln_University_Campus%2C_New_Zealand_06.jpg',
   alt:copy('Landscape Architecture Building on the Lincoln University campus.','Bâtiment d’architecture paysagère du campus de l’Université Lincoln.','مبنى عمارة المناظر الطبيعية في حرم جامعة لينكولن.','Edificio de Arquitectura del Paisaje en el campus de la Universidad Lincoln.'),
   caption:copy('The building name sits above a glass entrance, making the destination part of the architecture.','Le nom du bâtiment surmonte une entrée vitrée, intégrant le repère à l’architecture.','يعلو اسم المبنى مدخلًا زجاجيًا، لتصبح دلالة المكان جزءًا من عمارته.','El nombre del edificio corona una entrada acristalada e integra la orientación en la arquitectura.') }),
 ],
 hospitals: [
  photo({ id:'suburban-hospital', category:'hospitals', title:'Suburban Hospital · Main entrance', location:'Bethesda, Maryland, USA', file:'File:Suburban Hospital main entrance Bethesda MD 20210430 073615 1 crop.jpg', author:'G. Edward Johnson', date:'2021-04-30', license:{name:'CC BY 4.0',url:'https://creativecommons.org/licenses/by/4.0/'}, width:7360, height:4140, objectPosition:'50% 50%', originalUrl:'https://upload.wikimedia.org/wikipedia/commons/6/6b/Suburban_Hospital_main_entrance_Bethesda_MD_20210430_073615_1_crop.jpg',
   alt:copy('Main entrance of Suburban Hospital in Bethesda.','Entrée principale du Suburban Hospital à Bethesda.','المدخل الرئيسي لمستشفى سابربان في بيثيسدا.','Entrada principal del Suburban Hospital en Bethesda.'),
   caption:copy('A curved brick-and-glass facade gathers around the hospital’s main entrance.','Une façade courbe de briques et de verre entoure l’entrée principale de l’hôpital.','واجهة منحنية من الطوب والزجاج تحيط بالمدخل الرئيسي للمستشفى.','Una fachada curva de ladrillo y vidrio rodea la entrada principal del hospital.') }),
  photo({ id:'ktph-bridge', category:'hospitals', title:'Khoo Teck Puat Hospital · Link bridge', location:'Yishun, Singapore', file:'File:Link bridge at KTPH.jpg', author:'KTPH', date:'2013-07-05', license:bysa('4.0'), width:2848, height:4288, allowEnlargement:true, objectPosition:'50% 45%', originalUrl:'https://upload.wikimedia.org/wikipedia/commons/d/db/Link_bridge_at_KTPH.jpg',
   alt:copy('Link bridge and planted courtyard at Khoo Teck Puat Hospital.','Passerelle et cour végétalisée du Khoo Teck Puat Hospital.','جسر رابط وفناء مزروع في مستشفى خو تيك بوات.','Pasarela y patio ajardinado del Khoo Teck Puat Hospital.'),
   caption:copy('Planted bridges cross the courtyard, with gardens and water beyond the hospital buildings.','Des passerelles végétalisées traversent la cour, avec des jardins et un plan d’eau au-delà des bâtiments.','تعبر جسور مزروعة الفناء، وتظهر الحدائق والمياه خلف مباني المستشفى.','Pasarelas ajardinadas cruzan el patio, con jardines y agua más allá de los edificios del hospital.') }),
 ],
};

// Additional international views follow the stable two homepage photographs.
// These are category editorial context, not new directory entries or room claims.
CATEGORY_PHOTOGRAPHY.airports.push(
 photo({id:'marrakech-terminal',category:'airports',title:'Marrakech Menara Airport · Terminal 1',location:'Marrakech, Morocco',countryCode:'MA',file:'File:Marrakech Airport terminal 1 - interior - 2026-02-04 01.jpg',author:'瑞丽江的河水',date:'2026-02-04',license:bysa('4.0'),width:5712,height:4284,objectPosition:'55% 65%',originalUrl:'https://upload.wikimedia.org/wikipedia/commons/0/0d/Marrakech_Airport_terminal_1_-_interior_-_2026-02-04_01.jpg',
  alt:copy('Geometric white ceiling and check-in hall at Marrakech Menara Airport.','Plafond blanc géométrique et hall d’enregistrement de Marrakech-Ménara.','سقف أبيض هندسي وبهو تسجيل الوصول في مطار مراكش المنارة.','Techo blanco geométrico y vestíbulo de facturación de Marrakech-Menara.'),
  caption:copy('Daylight falls through a patterned ceiling above the terminal’s open check-in hall.','La lumière traverse un plafond à motifs au-dessus du vaste hall d’enregistrement.','ينفذ ضوء النهار عبر سقف مزخرف فوق بهو تسجيل الوصول الواسع.','La luz atraviesa un techo geométrico sobre el amplio vestíbulo de facturación.') }),
 photo({id:'madrid-terminal',category:'airports',title:'Madrid-Barajas Airport · Terminal 4',location:'Madrid, Spain',countryCode:'ES',file:'File:Terminal 4 del aeropuerto de Madrid-Barajas, España, 2013-01-09, DD 09.jpg',author:'Diego Delso',date:'2013-01-09',license:bysa('3.0'),width:4167,height:3217,objectPosition:'60% 60%',originalUrl:'https://upload.wikimedia.org/wikipedia/commons/4/49/Terminal_4_del_aeropuerto_de_Madrid-Barajas%2C_Espa%C3%B1a%2C_2013-01-09%2C_DD_09.jpg',
  alt:copy('Undulating timber ceiling, blue columns and gate signs in Madrid-Barajas Terminal 4.','Plafond ondulé en bois, colonnes bleues et panneaux du terminal 4 de Madrid-Barajas.','سقف خشبي متموّج وأعمدة زرقاء ولافتات بوابات في المبنى 4 بمطار مدريد باراخاس.','Techo ondulado de madera, columnas azules y señales de puertas en la T4 de Madrid-Barajas.'),
  caption:copy('A warm timber roof follows the concourse, with gate signs beside the blue supports.','Une toiture de bois accompagne le hall, avec des panneaux près des supports bleus.','يمتد سقف خشبي دافئ فوق الممر، وتظهر لافتات البوابات بجانب الدعامات الزرقاء.','Una cubierta de madera recorre el vestíbulo, con señales junto a los soportes azules.') }),
);
CATEGORY_PHOTOGRAPHY.universities.push(
 photo({id:'capetown-campus',category:'universities',title:'University of Cape Town · Upper and Middle Campuses',location:'Cape Town, South Africa',countryCode:'ZA',file:'File:Aerial view of the University of Cape Town Upper and Middle Campuses.jpg',author:'Mike',date:'2010-08-23',license:{name:'CC BY 2.0',url:'https://creativecommons.org/licenses/by/2.0/'},width:4288,height:2848,objectPosition:'50% 65%',originalUrl:'https://upload.wikimedia.org/wikipedia/commons/f/f2/Aerial_view_of_the_University_of_Cape_Town_Upper_and_Middle_Campuses.jpg',
  alt:copy('Aerial view of the University of Cape Town campuses below the mountain slopes.','Vue aérienne des campus de l’Université du Cap au pied de la montagne.','منظر جوي لحرم جامعة كيب تاون أسفل سفوح الجبل.','Vista aérea de los campus de la Universidad de Ciudad del Cabo al pie de la montaña.'),
  caption:copy('Terracotta roofs and playing fields mark the campus against the mountain landscape.','Toits de terre cuite et terrains de sport dessinent le campus au pied de la montagne.','تحدّد الأسطح القرميدية والملاعب ملامح الحرم وسط المشهد الجبلي.','Tejados de terracota y campos deportivos dibujan el campus frente al paisaje montañoso.') }),
 photo({id:'ntu-campus',category:'universities',title:'Nanyang Technological University · The Hive',location:'Singapore',countryCode:'SG',file:'File:The Hive, NTU (I).jpg',author:'Supanut Arunoprayote',date:'2020-01-19',license:{name:'CC BY 4.0',url:'https://creativecommons.org/licenses/by/4.0/'},width:4560,height:3257,objectPosition:'50% 48%',originalUrl:'https://upload.wikimedia.org/wikipedia/commons/9/90/The_Hive%2C_NTU_%28I%29.jpg',
  alt:copy('Rounded towers and planted terraces of The Hive at Nanyang Technological University.','Tours arrondies et terrasses plantées de The Hive à l’Université technologique de Nanyang.','أبراج مستديرة وشرفات مزروعة لمبنى ذا هايف في جامعة نانيانغ التكنولوجية.','Torres redondeadas y terrazas ajardinadas de The Hive en la Universidad Tecnológica de Nanyang.'),
  caption:copy('Rounded learning towers and planted terraces create a distinctive campus landmark.','Tours arrondies et terrasses végétalisées forment un repère singulier du campus.','تشكل أبراج التعلّم المستديرة والشرفات المزروعة معلمًا مميزًا في الحرم.','Torres de aprendizaje redondeadas y terrazas ajardinadas forman un hito del campus.') }),
);
CATEGORY_PHOTOGRAPHY.hospitals.push(
 photo({id:'berlin-hospital',category:'hospitals',title:'Charité · Campus Mitte',location:'Berlin, Germany',countryCode:'DE',file:'File:20240815 Campus Charité Mitte.jpg',author:'Flocci Nivis',date:'2024-08-15',license:{name:'CC BY 4.0',url:'https://creativecommons.org/licenses/by/4.0/'},width:6016,height:4016,objectPosition:'50% 50%',originalUrl:'https://upload.wikimedia.org/wikipedia/commons/9/9e/20240815_Campus_Charit%C3%A9_Mitte.jpg',
  alt:copy('Red-brick buildings of Charité Campus Mitte beside the river in Berlin.','Bâtiments de briques rouges du campus Charité Mitte au bord de l’eau à Berlin.','مباني الطوب الأحمر في حرم شاريتيه ميته بجانب النهر في برلين.','Edificios de ladrillo rojo del campus Charité Mitte junto al río en Berlín.'),
  caption:copy('Historic red-brick hospital buildings line the river, with newer wings behind them.','Des bâtiments hospitaliers en briques rouges bordent la rivière, devant des ailes plus récentes.','تصطف مباني المستشفى التاريخية ذات الطوب الأحمر على ضفة النهر، وخلفها أجنحة أحدث.','Edificios hospitalarios históricos de ladrillo rojo bordean el río, con alas más recientes detrás.') }),
 photo({id:'sydney-hospital',category:'hospitals',title:'Royal North Shore Hospital',location:'St Leonards, Sydney, Australia',countryCode:'AU',file:'File:Royal North Shore Hospital.jpg',author:'Thepm',date:'2019-04-01',license:bysa('4.0'),width:4032,height:2585,objectPosition:'52% 55%',originalUrl:'https://upload.wikimedia.org/wikipedia/commons/8/80/Royal_North_Shore_Hospital.jpg',
  alt:copy('Royal North Shore Hospital buildings with coloured facade panels and rooftop lettering.','Bâtiments du Royal North Shore Hospital, panneaux colorés et nom sur la façade.','مباني مستشفى رويال نورث شور بألواح واجهات ملونة واسم المستشفى في أعلاها.','Edificios del Royal North Shore Hospital con paneles de colores y nombre en la fachada.'),
  caption:copy('Coloured panels break up the hospital facade beneath its clearly visible name.','Des panneaux colorés rythment la façade sous le nom bien visible de l’hôpital.','تتوزع ألواح ملونة على واجهة المستشفى أسفل اسمه الواضح.','Paneles de colores animan la fachada bajo el nombre claramente visible del hospital.') }),
);
