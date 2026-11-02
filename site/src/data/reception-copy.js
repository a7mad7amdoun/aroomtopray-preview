// A request a visitor can show to staff. These phrases do not claim that a
// particular institution has a room, or that the visitor is allowed to enter it.
export const RECEPTION_LANGUAGES = [
 {code:'en',name:'English',dir:'ltr'},
 {code:'fr',name:'Français',dir:'ltr'},
 {code:'ar',name:'العربية',dir:'rtl'},
 {code:'es',name:'Español',dir:'ltr'},
];

export const RECEPTION_PHRASES = {
 en:'Could you show me the prayer room or a quiet place to pray?',
 fr:'Pourriez-vous m’indiquer la salle de prière ou un endroit calme où prier ?',
 ar:'هل يمكنكم إرشادي إلى غرفة الصلاة أو مكان هادئ للصلاة؟',
 es:'¿Podría indicarme dónde está la sala de oración o un lugar tranquilo para rezar?',
};

export const RECEPTION_COPY = {
 en:{open:'Ask for directions',title:'A little help finding your way.',label:'To show a member of staff',help:'Choose a language, then show this request to someone who can help.',language:'Language for your request',copy:'Copy this request',copied:'Request copied.',copyFailed:'Copying is unavailable. Select the sentence to copy it.',close:'Close',fallback:'Show one of these requests to a member of staff.'},
 fr:{open:'Demander son chemin',title:'Un peu d’aide pour vous orienter.',label:'À montrer à un membre du personnel',help:'Choisissez une langue, puis montrez cette demande à quelqu’un qui peut vous aider.',language:'Langue de votre demande',copy:'Copier cette demande',copied:'Demande copiée.',copyFailed:'La copie est indisponible. Sélectionnez la phrase pour la copier.',close:'Fermer',fallback:'Montrez l’une de ces demandes à un membre du personnel.'},
 ar:{open:'اطلب الإرشاد',title:'مساعدة بسيطة للوصول إلى وجهتك.',label:'اعرضها على أحد الموظفين',help:'اختر لغة، ثم اعرض هذا الطلب على شخص يمكنه مساعدتك.',language:'لغة الطلب',copy:'انسخ هذا الطلب',copied:'تم نسخ الطلب.',copyFailed:'تعذّر النسخ. حدّد الجملة لنسخها.',close:'إغلاق',fallback:'اعرض أحد هذه الطلبات على أحد الموظفين.'},
 es:{open:'Pedir indicaciones',title:'Una pequeña ayuda para orientarte.',label:'Para mostrar al personal',help:'Elige un idioma y muestra esta petición a alguien que pueda ayudarte.',language:'Idioma de tu petición',copy:'Copiar esta petición',copied:'Petición copiada.',copyFailed:'No se puede copiar. Selecciona la frase para copiarla.',close:'Cerrar',fallback:'Muestra una de estas peticiones a alguien del personal.'},
};
