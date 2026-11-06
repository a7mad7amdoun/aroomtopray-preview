import { CATEGORY_PHOTOGRAPHY } from './category-photography.js';
// The original room/backdrop remains. Only its six destination views now use
// credited photographs; the commissioned illustrated assets remain available.
export const HOME_SCENES=['airport','campus','hospital','airport-2','campus-2','hospital-2'].map(id=>{
 const category=id.replace(/-2$/,'');
 const kind={airport:'airports',campus:'universities',hospital:'hospitals'}[category];
 return {id,category,photo:CATEGORY_PHOTOGRAPHY[kind][id.endsWith('-2')?1:0]};
});
export const HOME_VIEW_COPY = {
 en:{label:'Original room · real architectural photographs',view:'Photographed places: ',note:'Six real photographs of airports, universities and hospitals, framed inside the original imagined room. They show architectural context, not the listed prayer rooms or a single real window view.',changes:'Prepared from high-resolution originals, resized and cropped for the glass. The same six photographs appear in both themes; dark mode dims the glass without inventing a different time of day.'},
 fr:{label:'Pièce originale · photographies d’architecture réelle',view:'Lieux photographiés : ',note:'Six photographies réelles d’aéroports, d’universités et d’hôpitaux dans la pièce imaginée originale. Elles illustrent l’architecture, pas les salles de prière répertoriées ni une même vue réelle.',changes:'Préparées à partir d’originaux haute résolution, redimensionnées et cadrées pour la vitre. Les mêmes six photos apparaissent dans les deux thèmes ; le mode sombre atténue la vitre sans inventer une autre heure.'},
 ar:{label:'الغرفة الأصلية · صور معمارية حقيقية',view:'أماكن مصوّرة: ',note:'ست صور حقيقية لمطارات وجامعات ومستشفيات، داخل إطار الغرفة الأصلية المتخيّلة. تعرض السياق المعماري ولا تمثّل غرف الصلاة المدرجة أو إطلالة نافذة حقيقية واحدة.',changes:'أُعدّت من صور أصلية عالية الدقة، مع تغيير الحجم والاقتصاص لتناسب الزجاج. تظهر الصور الست نفسها في المظهرين؛ يخفّف المظهر الداكن سطوع الزجاج دون اختلاق وقت آخر من اليوم.'},
 es:{label:'Habitación original · fotografías de arquitectura real',view:'Lugares fotografiados: ',note:'Seis fotografías reales de aeropuertos, universidades y hospitales, enmarcadas en la habitación imaginada original. Muestran el contexto arquitectónico, no las salas de oración indicadas ni una única vista real.',changes:'Preparadas a partir de originales de alta resolución, redimensionadas y encuadradas para el cristal. Las mismas seis fotos aparecen en ambos temas; el modo oscuro atenúa el cristal sin inventar otra hora del día.'},
};
