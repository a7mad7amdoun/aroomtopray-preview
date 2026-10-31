// Shared image metadata, descriptions and attribution for the selected visitor collection.
export const VISITOR_ART_REFERENCES={
 airport:{label:'Heathrow Terminal 5',author:'Gerd Eichmann',url:'https://commons.wikimedia.org/wiki/File:London-Heathrow-34-Terminal_5-Wartehalle-2009-gje.jpg',license:true},
 campus:{label:'University of Warwick · Islamic Prayer Hall',url:'https://warwick.ac.uk/services/chaplaincy/about_us/facilities/central/iph/',license:false},
 hospital:{label:'Princess Alexandra Hospital',author:'Kgbo',url:'https://commons.wikimedia.org/wiki/File:Princess_Alexandra_Hospital_corridors.jpg',license:true},
};

export const VISITOR_ART_COPY={
 en:{note:'AI-generated illustration · not a photograph of a listed place.',reference:'Architectural reference:',adapted:'Adapted under',titles:{airport:'Between flights',campus:'A pause between classes',hospital:'A moment with family'},alt:{airport:'Illustration of a traveler in a headscarf checking her phone beside her suitcase in an airport waiting area.',campus:'Illustration of a student waiting outside a simple university prayer hall, with his shoes beneath the bench.',hospital:'Illustration of an older man and an adult woman in a headscarf sitting together in a hospital waiting area.'}},
 fr:{note:'Illustration générée par IA · ne représente pas un lieu répertorié.',reference:'Référence architecturale :',adapted:'Adaptation sous licence',titles:{airport:'Entre deux vols',campus:'Une pause entre les cours',hospital:'Un moment en famille'},alt:{airport:'Illustration d’une voyageuse portant un foulard, consultant son téléphone près de sa valise dans un aéroport.',campus:'Illustration d’un étudiant devant une salle de prière universitaire, ses chaussures rangées sous le banc.',hospital:'Illustration d’un homme âgé et d’une femme adulte portant un foulard, assis ensemble dans un espace d’attente à l’hôpital.'}},
 ar:{note:'مشهد مولّد بالذكاء الاصطناعي · ليس صورة لمكان مدرج في الدليل.',reference:'مرجع التصميم المعماري:',adapted:'اقتباس بموجب ترخيص',titles:{airport:'بين رحلتين',campus:'استراحة بين المحاضرات',hospital:'لحظة مع العائلة'},alt:{airport:'مشهد توضيحي لمسافرة محجبة تتصفح هاتفها بجوار حقيبتها في صالة انتظار بالمطار.',campus:'مشهد توضيحي لطالب ينتظر خارج مصلى جامعي بسيط، وقد وضع حذاءه تحت المقعد.',hospital:'مشهد توضيحي لرجل مسن وامرأة بالغة محجبة يجلسان معاً في منطقة انتظار بمستشفى.'}},
 es:{note:'Ilustración generada con IA · no es una fotografía de un lugar del directorio.',reference:'Referencia arquitectónica:',adapted:'Adaptación bajo licencia',titles:{airport:'Entre vuelos',campus:'Una pausa entre clases',hospital:'Un momento en familia'},alt:{airport:'Ilustración de una viajera con pañuelo que consulta su teléfono junto a su maleta en una sala de espera del aeropuerto.',campus:'Ilustración de un estudiante ante una sala de oración universitaria, con los zapatos bajo el banco.',hospital:'Ilustración de un hombre mayor y una mujer adulta con pañuelo sentados juntos en una sala de espera del hospital.'}},
};

export const VISITOR_ART_SCENES = Object.keys(VISITOR_ART_REFERENCES);
export function visitorArtSources(scene, mode) {
 if (!Object.hasOwn(VISITOR_ART_REFERENCES, scene)) throw new Error('Unknown visitor artwork: '+scene);
 if (!['light','dark'].includes(mode)) throw new Error('Unknown artwork appearance: '+mode);
 return [480,960,1664].map(width=>`/art/visitors/${scene}-${mode}-${width}.webp ${width}w`).join(', ');
}
