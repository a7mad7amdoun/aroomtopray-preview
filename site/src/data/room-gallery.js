import { SETTING_GALLERIES } from './setting-gallery.js';
import {existsSync} from 'node:fs';
// Prepared photographs keep source attribution and serve both light and dark glass.
export const ROOM_GALLERIES=Object.fromEntries(Object.entries(SETTING_GALLERIES).map(([category,photos])=>[category,photos.map((photo,index)=>{
 const base=`/photos/room-gallery/${category}-${index+1}`,widths=[1440,2880];
 const ready=widths.every(width=>existsSync(new URL(`../../public${base}-${width}.webp`,import.meta.url)));
 return ready?{...photo,base,widths}:photo;
})]));
export const ROOM_GALLERY_COPY={
 en:{label:'Architectural photographs',previous:'Previous photo',next:'Next photo',pause:'Pause slideshow',play:'Play slideshow',of:'of',treatment:'The same photographs appear in both themes. Dark mode dims the glass, not the recorded time of day.'},
 fr:{label:'Photographies d’architecture',previous:'Photo précédente',next:'Photo suivante',pause:'Mettre en pause',play:'Lancer le diaporama',of:'sur',treatment:'Les mêmes photographies apparaissent dans les deux thèmes. Le mode sombre assombrit la vitre, sans modifier le moment photographié.'},
 ar:{label:'صور معمارية',previous:'الصورة السابقة',next:'الصورة التالية',pause:'إيقاف العرض مؤقتًا',play:'تشغيل عرض الصور',of:'من',treatment:'تظهر الصور نفسها في كلا المظهرين. يخفّف المظهر الداكن سطوع الزجاج ولا يغيّر وقت التقاط الصورة.'},
 es:{label:'Fotografías de arquitectura',previous:'Foto anterior',next:'Foto siguiente',pause:'Pausar presentación',play:'Reproducir presentación',of:'de',treatment:'Las mismas fotografías aparecen en ambos temas. El modo oscuro atenúa el cristal, sin cambiar el momento fotografiado.'},
};
