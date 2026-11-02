// Institution-specific details drawn from Hamza’s original listings.
// These highlights do not change the records’ dates or their primary-source citations.
export const FIELD_NOTE_COPY = {
  en: { eyebrow: 'A useful detail', source: 'From Hamza’s directory', read: 'Read the original listing', email: 'Chaplaincy email' },
  fr: { eyebrow: 'Un détail utile', source: 'D’après l’annuaire de Hamza', read: 'Lire la fiche d’origine', email: 'Courriel de l’aumônerie' },
  ar: { eyebrow: 'تفصيل مفيد', source: 'من دليل حمزة', read: 'اقرأ الصفحة الأصلية', email: 'بريد فريق الرعاية الروحية' },
  es: { eyebrow: 'Un detalle útil', source: 'Del directorio de Hamza', read: 'Leer la ficha original', email: 'Correo de capellanía' },
};

export const QUIET_FIELD_NOTES = {
  airports: {
    id: 'melbourne-security-sides',
    icon: 'pin',
    sourceUrl: 'https://aroomtopray.com/airports/mel/',
    sourceName: 'A Room to Pray',
    copy: {
      en: {
        institution: 'Melbourne Airport',
        title: 'Choose the right side of security',
        text: 'The directory lists two 24-hour prayer rooms: one before security on the ground floor between T2 and T3, and one after security in T2, opposite Cafe Sol.',
      },
      fr: {
        institution: 'Aéroport de Melbourne',
        title: 'Repérez le bon côté du contrôle',
        text: 'L’annuaire répertorie deux salles de prière ouvertes 24 h/24 : l’une avant le contrôle de sécurité, au rez-de-chaussée entre les terminaux T2 et T3, et l’autre après le contrôle, dans le T2, en face du Cafe Sol.',
      },
      ar: {
        institution: 'مطار ملبورن',
        title: 'حدّد موقع الغرفة من التفتيش الأمني',
        text: 'يسرد الدليل غرفتين للصلاة مفتوحتين على مدار الساعة: واحدة قبل التفتيش الأمني في الطابق الأرضي بين مبنيَي T2 وT3، وأخرى بعد التفتيش في T2 مقابل Cafe Sol.',
      },
      es: {
        institution: 'Aeropuerto de Melbourne',
        title: 'Antes o después del control de seguridad',
        text: 'El directorio recoge dos salas de oración abiertas las 24 horas: una antes del control de seguridad, en la planta baja entre T2 y T3, y otra después del control, en T2, frente a Cafe Sol.',
      },
    },
  },
  universities: {
    id: 'bristol-ucard',
    icon: 'key',
    sourceUrl: 'https://aroomtopray.com/universities/university-of-bristol/',
    sourceName: 'A Room to Pray',
    email: 'multifaith-chaplaincy@bristol.ac.uk',
    copy: {
      en: {
        institution: 'University of Bristol · Woodland Prayer Rooms',
        title: 'Activate your card before you go',
        text: 'For 24-hour access at 21 Woodland Road, Bristol asks students and staff to email the Multifaith Chaplaincy to activate their Ucard.',
      },
      fr: {
        institution: 'Université de Bristol · Salles de prière de Woodland',
        title: 'Faites activer votre carte avant de venir',
        text: 'Pour accéder aux salles du 21 Woodland Road à toute heure, Bristol demande aux étudiants et au personnel d’écrire à l’aumônerie multiconfessionnelle afin de faire activer leur Ucard.',
      },
      ar: {
        institution: 'جامعة بريستول · غرف الصلاة في وودلاند',
        title: 'فعّل بطاقة الدخول قبل الزيارة',
        text: 'للدخول على مدار الساعة إلى غرف الصلاة في 21 Woodland Road، تطلب بريستول من الطلاب والموظفين مراسلة فريق الرعاية الروحية متعدد الأديان لتفعيل بطاقة Ucard.',
      },
      es: {
        institution: 'Universidad de Bristol · Salas de oración de Woodland',
        title: 'Activa tu tarjeta antes de ir',
        text: 'Para acceder a cualquier hora a las salas de 21 Woodland Road, Bristol pide a estudiantes y personal que escriban a la capellanía multiconfesional para activar su Ucard.',
      },
    },
  },
  hospitals: {
    id: 'st-thomas-access',
    icon: 'key',
    sourceUrl: 'https://aroomtopray.com/hospitals/st-thomas-hospital/',
    sourceName: 'A Room to Pray',
    copy: {
      en: {
        institution: 'St Thomas’ Hospital · London',
        title: 'Check who can use the room',
        text: 'The directory lists the multi-faith room for patients, their relatives during the patient’s stay, and staff only because space is limited. Ask ward staff for access.',
      },
      fr: {
        institution: 'Hôpital St Thomas’ · Londres',
        title: 'Vérifiez les conditions d’accès',
        text: 'L’annuaire indique que la salle multiconfessionnelle est réservée aux patients, à leurs proches pendant leur séjour et au personnel, faute de place. Demandez l’accès au personnel du service.',
      },
      ar: {
        institution: 'مستشفى سانت توماس · لندن',
        title: 'تأكّد ممن يحق لهم استخدام الغرفة',
        text: 'يوضح الدليل أن الغرفة متعددة الأديان مخصّصة للمرضى وأقاربهم خلال إقامة المريض والموظفين فقط، بسبب محدودية المساحة. اطلب الدخول من موظفي الجناح.',
      },
      es: {
        institution: 'Hospital St Thomas’ · Londres',
        title: 'Comprueba quién puede acceder',
        text: 'El directorio indica que la sala multiconfesional está reservada a pacientes, familiares durante la estancia del paciente y personal, por falta de espacio. Pide acceso al personal de la planta.',
      },
    },
  },
};

export function quietFieldNote(kind, locale = 'en') {
  const note = QUIET_FIELD_NOTES[kind];
  return note ? { ...note, ...(note.copy[locale] || note.copy.en) } : null;
}
