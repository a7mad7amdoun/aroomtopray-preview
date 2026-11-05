import { SETTING_PHOTOS } from './room-atmosphere.js';
import { ROOM_VIEWS } from './room-views.js';
const fresh = {
 airport:{title:'Suvarnabhumi Airport · Terminal E',author:'Grendelkhan',date:'2017-04-22',width:4032,height:3024,source:'https://commons.wikimedia.org/wiki/File:Suvarnabhumi_Airport_Terminal_E_interior_at_dusk.jpg',license:'CC BY-SA 3.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0/'},
 campus:{title:'All Souls College · Hall and kitchen',author:'Camboxer',date:'2016-11-28',width:3456,height:2304,source:'https://commons.wikimedia.org/wiki/File:All_Souls_hall_%26_kitchen.jpg',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/'},
 hospital:{title:'Queen Elizabeth Hospital · Main entrance, Woolwich',author:'Paul W',date:'2018-04-17',width:4608,height:2592,source:'https://commons.wikimedia.org/wiki/File:Main_entrance,_Queen_Elizabeth_Hospital,_Woolwich.jpg',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/'},
};
const existingDimensions={airport:[4080,3072],campus:[2048,1536],hospital:[2848,4288]};
export const SETTING_GALLERIES=Object.fromEntries(Object.keys(fresh).map(scene=>{
 const setting=SETTING_PHOTOS[scene], view=ROOM_VIEWS[scene];
 const photos=[
  {...setting,title:setting.name,base:`/photos/settings/${scene}`,widths:[720,1440,2160],license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/'},
  {...fresh[scene],base:`/photos/setting-gallery/${scene}`,widths:[720,1440,2160]},
  {...view,width:existingDimensions[scene][0],height:existingDimensions[scene][1],base:`/art/real-views/${scene}`,widths:scene==='hospital'?[800,1400]:[800,1400,2048]},
 ];
 return [scene,photos];
}));
export const SETTING_GALLERY_COPY={
 en:{title:'Real places, photographed',note:'Architectural context, not photographs of the listed prayer rooms. Check each listing for its exact location and access.',previous:'Previous photograph',next:'Next photograph',of:'of',source:'Photo source',changes:'Resized and framed; original colours preserved.'},
 fr:{title:'Des lieux réels, photographiés',note:'Contexte architectural, pas des photos des salles de prière répertoriées. Consultez chaque fiche pour le lieu exact et les conditions d’accès.',previous:'Photo précédente',next:'Photo suivante',of:'sur',source:'Source de la photo',changes:'Redimensionnée et cadrée ; couleurs originales préservées.'},
 ar:{title:'أماكن حقيقية بعدسة المصوّرين',note:'صور للسياق المعماري، وليست صورًا لغرف الصلاة المدرجة. راجع كل موقع لمعرفة المكان الدقيق وشروط الدخول.',previous:'الصورة السابقة',next:'الصورة التالية',of:'من',source:'مصدر الصورة',changes:'تم تغيير الحجم والتأطير مع الحفاظ على الألوان الأصلية.'},
 es:{title:'Lugares reales, fotografiados',note:'Contexto arquitectónico, no fotografías de las salas de oración indicadas. Consulta cada ficha para conocer su ubicación exacta y acceso.',previous:'Fotografía anterior',next:'Fotografía siguiente',of:'de',source:'Fuente de la foto',changes:'Redimensionada y encuadrada; colores originales conservados.'},
};
