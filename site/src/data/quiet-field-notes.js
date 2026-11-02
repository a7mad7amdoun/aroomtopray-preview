// Institution-specific arrival guidance, kept separate from place records and their check dates.
// Primary sources were inspected for this addition; no rule below applies to every institution.
export const FIELD_NOTE_COPY = {
  en: { eyebrow: 'A useful detail', source: 'From official guidance', read: 'Read the guidance', email: 'Chaplaincy email' },
  fr: { eyebrow: 'Un détail utile', source: 'Selon les informations officielles', read: 'Lire les informations', email: 'Courriel de l’aumônerie' },
  ar: { eyebrow: 'تفصيل مفيد', source: 'من الإرشادات الرسمية', read: 'اقرأ الإرشادات', email: 'بريد فريق الرعاية الروحية' },
  es: { eyebrow: 'Un detalle útil', source: 'Según la información oficial', read: 'Leer la información', email: 'Correo de capellanía' },
};

export const QUIET_FIELD_NOTES = {
  airports: {
    id: 'melbourne-ambassadors',
    icon: 'help',
    sourceUrl: 'https://www.melbourneairport.com.au/find-support-from-melbourne-airports-chaplaincy',
    sourceName: 'Melbourne Airport',
    copy: {
      en: {
        institution: 'Melbourne Airport',
        title: 'Someone to point the way',
        text: 'If you cannot find your way to a prayer room, Melbourne Airport recommends asking an Experience Ambassador in the terminals for directions.',
      },
      fr: {
        institution: 'Aéroport de Melbourne',
        title: 'Une personne pour vous orienter',
        text: 'Si vous ne trouvez pas la salle de prière, l’aéroport de Melbourne recommande de demander votre chemin à un membre de l’équipe « Experience Ambassadors » dans les terminaux.',
      },
      ar: {
        institution: 'مطار ملبورن',
        title: 'مَن يساعدك في الوصول',
        text: 'إذا لم تعرف طريق غرفة الصلاة، يوصي مطار ملبورن بطلب الإرشاد من أحد أفراد فريق «Experience Ambassadors» في مباني الركاب.',
      },
      es: {
        institution: 'Aeropuerto de Melbourne',
        title: 'Alguien que te indique el camino',
        text: 'Si no encuentras la sala de oración, el aeropuerto de Melbourne recomienda pedir indicaciones a un miembro del equipo «Experience Ambassadors» en las terminales.',
      },
    },
  },
  universities: {
    id: 'bristol-ucard',
    icon: 'key',
    sourceUrl: 'https://www.bristol.ac.uk/multifaith-chaplaincy/places-to-worship/',
    sourceName: 'University of Bristol',
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
    id: 'ashford-st-peters-after-hours',
    icon: 'clock',
    sourceUrl: 'https://ashfordstpeters.nhs.uk/our-multi-faith-centres',
    sourceName: 'Ashford and St Peter’s Hospitals NHS Foundation Trust',
    copy: {
      en: {
        institution: 'Ashford Hospital & St Peter’s Hospital · Surrey',
        title: 'Access outside opening hours',
        text: 'Both Multi-Faith Centres open daily from 08:00 to 18:00. Outside those hours, the Trust says security staff can unlock them when needed.',
      },
      fr: {
        institution: 'Hôpitaux Ashford et St Peter’s · Surrey',
        title: 'Accès en dehors des horaires d’ouverture',
        text: 'Les deux centres multiconfessionnels ouvrent chaque jour de 8 h à 18 h. En dehors de ces horaires, l’établissement indique que le personnel de sécurité peut les ouvrir si nécessaire.',
      },
      ar: {
        institution: 'مستشفيا آشفورد وسانت بيترز · سَري',
        title: 'الدخول خارج ساعات العمل',
        text: 'يفتح المركزان متعددا الأديان يومياً من الثامنة صباحاً إلى السادسة مساءً. وتوضح المؤسسة أن موظفي الأمن يستطيعون فتحهما خارج هذه الساعات عند الحاجة.',
      },
      es: {
        institution: 'Hospitales Ashford y St Peter’s · Surrey',
        title: 'Acceso fuera del horario de apertura',
        text: 'Ambos centros multiconfesionales abren todos los días de 08:00 a 18:00. Fuera de ese horario, la entidad indica que el personal de seguridad puede abrirlos cuando sea necesario.',
      },
    },
  },
};

export function quietFieldNote(kind, locale = 'en') {
  const note = QUIET_FIELD_NOTES[kind];
  return note ? { ...note, ...(note.copy[locale] || note.copy.en) } : null;
}
