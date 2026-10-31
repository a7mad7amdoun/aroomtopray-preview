// "How to pray while travelling" guides. Every ruling-level point on a guide page carries one of these sources.
// Qurʾān references link to quran.com; ḥadīth numbers follow sunnah.com (checked 13 Oct 2026).
// Madhhab texts are cited by volume:page of a named printed edition and linked on shamela.ws (see REVIEW.md for the quoted passages).
// All pages await the editor's review.

export const REVIEWED = false; // flip to true (and drop noindex) once Hamza has reviewed the guides
export const WRITTEN = '13 October 2026';

const q = (s, a) => ({ label: `Qurʾān ${s}:${a}`, href: `https://quran.com/${s}/${a}` });
const b = (n, note) => ({ label: `Ṣaḥīḥ al-Bukhārī ${n}`, note, href: `https://sunnah.com/bukhari:${n}` });
const m = (n, note) => ({ label: `Ṣaḥīḥ Muslim ${n}`, note, href: `https://sunnah.com/muslim:${n}` });
const sh = (label, book, page, note) => ({ label, note, href: `https://shamela.ws/book/${book}/${page}` });
const d = (n, note) => ({ label: `Sunan Abī Dāwūd ${n}`, note, href: `https://sunnah.com/abudawud:${n}` });

export const S = {
  q4_101: { ...q(4, 101), note: 'no blame on you for shortening the prayer when you travel' },
  q4_103: { ...q(4, 103), note: 'prayer is prescribed at set times' },
  q4_43: { ...q(4, 43), note: 'on a journey and finding no water: clean earth, face and hands' },
  q5_6: { ...q(5, 6), note: 'the parts washed in wuḍūʾ; tayammum; “Allah does not intend to make difficulty for you”' },
  q2_115: { ...q(2, 115), note: 'to Allah belong the east and the west' },
  q2_144: { ...q(2, 144), note: 'turn your face toward al-Masjid al-Ḥarām wherever you are' },
  q2_185: { ...q(2, 185), note: 'Allah intends ease for you' },
  q2_239: { ...q(2, 239), note: 'praying on foot or riding when there is fear' },
  q2_286: { ...q(2, 286), note: 'no soul is charged beyond its capacity' },
  q22_78: { ...q(22, 78), note: 'no hardship placed on you in the religion' },
  q64_16: { ...q(64, 16), note: 'fear Allah as much as you are able' },
  b39: b(39, 'the religion is easy'),
  b157: b(157, 'the Prophet ﷺ made wuḍūʾ washing each part once'),
  b201: b(201, 'wuḍūʾ with one mudd of water'),
  b206: b(206, 'wiping over khuffs put on after wuḍūʾ'),
  b335: b(335, 'the earth made a place of prayer and of purification'),
  b338: b(338, 'ʿAmmār: how tayammum is done'),
  b400: b(400, 'voluntary prayer on a mount facing any direction; dismounting for the obligatory prayer'),
  b510: b(510, 'passing in front of someone praying'),
  b1080: b(1080, 'Ibn ʿAbbās: a stay of nineteen days with shortened prayers'),
  b1081: b(1081, 'Anas: two rakʿahs from Madinah to Makkah and back, with ten days in Makkah'),
  b1089: b(1089, 'four rakʿahs in Madinah, two at Dhul-Ḥulayfah'),
  b1090: b(1090, 'ʿĀʾishah: the prayer was first prescribed as two rakʿahs'),
  b1101: b(1101, 'Ibn ʿUmar: no voluntary prayers on the journey'),
  b1106: b(1106, 'combining Maghrib and ʿIshāʾ when in a hurry on a journey'),
  b1111: b(1111, 'combining Ẓuhr and ʿAṣr on a journey'),
  b1117: b(1117, 'pray standing; if you cannot, sitting; if you cannot, on your side'),
  b1682: b(1682, 'Ibn Masʿūd: the two prayers at Jamʿ (Muzdalifah)'),
  m276: m(276, 'three days and nights for the traveller, one for the resident'),
  m689: m(689, 'Ibn ʿUmar and voluntary prayers on the road to Makkah'),
  m705: m(705, 'Ibn ʿAbbās: combining in Madinah without fear or travel'),
  m1218: m(1218, 'Jābir’s account of the Farewell Ḥajj, including ʿArafah and Muzdalifah'),
  d159: d(159, 'wiping over socks; Abū Dāwūd notes the weakness of this report'),
  d334: d(334, 'ʿAmr ibn al-ʿĀṣ and tayammum on a cold night'),
  d336: d(336, 'the injured traveller told to bathe'),
  m537: { label: 'Ṣaḥīḥ Muslim 537', note: 'Muʿāwiyah ibn al-Ḥakam: “talking to persons is not fitting during the prayer”', href: 'https://sunnah.com/muslim:537a' },
  // Classical works: volume:page of the printed edition named in the note, linked to that page on al-Maktabah al-Shāmilah (opened 13 Oct 2026).
  hid_travel: sh('al-Marghīnānī, al-Hidāyah (Ḥanafī) 1:80–81', 11820, 106, 'distance, shortening as the traveller’s obligation, the 15-day stay, waiting with no set date, behind a resident imam; ed. Ṭalāl Yūsuf, Dār Iḥyāʾ al-Turāth al-ʿArabī, Beirut 2004'),
  hid_tayammum: sh('al-Marghīnānī, al-Hidāyah (Ḥanafī) 1:27–29', 11820, 28, 'tayammum: two strikes, earth, prayers per tayammum, fear of the time running out, thirst'),
  hid_khuff: sh('al-Marghīnānī, al-Hidāyah (Ḥanafī) 1:31–32', 11820, 32, 'no wiping for ghusl; wiping over socks'),
  hid_sick: sh('al-Marghīnānī, al-Hidāyah (Ḥanafī) 1:76–77', 11820, 100, 'the prayer of the sick; sitting in a ship'),
  hid_speech: sh('al-Marghīnānī, al-Hidāyah (Ḥanafī) 1:62', 11820, 77, 'speaking during the prayer'),
  mabsut_jam: sh('al-Sarakhsī, al-Mabsūṭ (Ḥanafī) 1:149', 5423, 148, 'no combining in one time except at ʿArafah and Muzdalifah; Maṭbaʿat al-Saʿādah, Cairo, repr. Dār al-Maʿrifah'),
  risalah_travel: sh('Ibn Abī Zayd, al-Risālah (Mālikī) pp. 45–46', 11373, 53, 'distance and the four-day stay; Dār al-Fikr'),
  risalah_tayammum: sh('Ibn Abī Zayd, al-Risālah (Mālikī) pp. 20–21', 11373, 20, 'tayammum: what counts as earth, one obligatory prayer per tayammum'),
  risalah_khuff: sh('Ibn Abī Zayd, al-Risālah (Mālikī) p. 22', 11373, 23, 'wiping “as long as he has not taken them off”'),
  khalil_travel: sh('Khalīl, al-Mukhtaṣar (Mālikī) pp. 43–44', 11355, 56, 'shortening as sunnah, the four-day stay, combining on a journey; ed. Aḥmad Jād, Dār al-Ḥadīth, Cairo 2005'),
  khalil_khuff: sh('Khalīl, al-Mukhtaṣar (Mālikī) pp. 23–24', 11355, 20, 'wiping: no time limit; conditions of the khuff'),
  khalil_tayammum: sh('Khalīl, al-Mukhtaṣar (Mālikī) pp. 24–25', 11355, 22, 'tayammum: causes, strikes, earth, one obligatory prayer'),
  minhaj_travel: sh('al-Nawawī, Minhāj al-Ṭālibīn (Shāfiʿī) pp. 44–46', 12096, 47, 'distance, stay, behind a resident imam, preference for shortening, combining; ed. ʿAwaḍ Qāsim Aḥmad ʿAwaḍ, Dār al-Fikr 2005'),
  minhaj_khuff: sh('al-Nawawī, Minhāj al-Ṭālibīn (Shāfiʿī) pp. 13–14', 12096, 10, 'wiping: the count, conditions'),
  minhaj_tayammum: sh('al-Nawawī, Minhāj al-Ṭālibīn (Shāfiʿī) pp. 16–18', 12096, 16, 'tayammum: thirst, dust, two strikes, one obligatory prayer'),
  minhaj_qibla: sh('al-Nawawī, Minhāj al-Ṭālibīn (Shāfiʿī) p. 24', 12096, 24, 'facing the qibla; voluntary prayer while riding; an obligatory prayer on a moving mount'),
  minhaj_speech: sh('al-Nawawī, Minhāj al-Ṭālibīn (Shāfiʿī) p. 32', 12096, 33, 'what speech and movement break the prayer'),
  majmu_ship: sh('al-Nawawī, al-Majmūʿ (Shāfiʿī) 3:242', 2186, 1372, 'the obligatory prayer on a ship and on a mount; al-Munīriyyah, Cairo 1344–1347 AH'),
  mughni_travel: sh('Ibn Qudāmah, al-Mughnī (Ḥanbalī) 2:188–200', 8463, 636, 'distance, shortening a choice and better, combining; Maktabat al-Qāhirah 1968–69'),
  mughni_imam: sh('Ibn Qudāmah, al-Mughnī (Ḥanbalī) 2:209', 8463, 657, 'a traveller behind a resident imam, with the Mālikī view'),
  mughni_stay: sh('Ibn Qudāmah, al-Mughnī (Ḥanbalī) 2:212–215', 8463, 660, 'the stay that ends travel; waiting with no set date'),
  mughni_tayammum: sh('Ibn Qudāmah, al-Mughnī (Ḥanbalī) 1:179–195', 8463, 177, 'tayammum: one strike, dust, until the time ends, water kept for thirst'),
  mughni_khuff: sh('Ibn Qudāmah, al-Mughnī (Ḥanbalī) 1:209–215', 8463, 207, 'the period, when it starts, Mālik’s view, thick socks'),
  mughni_qibla: sh('Ibn Qudāmah, al-Mughnī (Ḥanbalī) 1:316', 8463, 314, 'facing the qibla when riding, “like one on a ship”'),
  ibn_taymiyyah: sh('Ibn Taymiyyah, Majmūʿ al-Fatāwā 24:12, 24:18, 24:40', 7289, 12081, 'no fixed distance or stay; King Fahd Complex, Madinah 2004'),
  zuhayli: sh('Wahbah al-Zuḥaylī, al-Fiqh al-Islāmī wa-Adillatuh 2:1340, 2:1343', 384, 1300, 'modern comparative work: Mālikī “strong sunnah”; four burud as about 89 km; Dār al-Fikr, Damascus, 4th ed.'),
  ship_hadith: { label: '“Pray standing unless you fear drowning” (al-Dāraquṭnī, al-Ḥākim)', href: 'https://dorar.net/h/FhOwcMxj', note: 'graded ṣaḥīḥ by al-Albānī (Ṣaḥīḥ al-Jāmiʿ 3777) from Ibn ʿUmar; the version from Ibn ʿAbbās is rejected for a weak narrator (al-Dāraquṭnī, al-Dhahabī). Gradings as listed on dorar.net' },
  tsa_religion: { label: 'TSA, “Religion” (TSA Cares)', href: 'https://www.tsa.gov/travel/tsa-cares/religion', note: 'read 13 Oct 2026' },
  tsa_screening: { label: 'TSA, “Security Screening”', href: 'https://www.tsa.gov/travel/security-screening', note: 'pat-downs and private screening; read 13 Oct 2026' },
  dhs_trip: { label: 'DHS Traveler Redress Inquiry Program (DHS TRIP)', href: 'https://www.dhs.gov/dhs-trip', note: 'read 13 Oct 2026' },
  dot_complaint: { label: 'US Department of Transportation, “File a Consumer Complaint”', href: 'https://www.transportation.gov/airconsumer/file-consumer-complaint', note: 'read 13 Oct 2026' },
  usc_46504: { label: '49 U.S.C. § 46504', href: 'https://www.law.cornell.edu/uscode/text/49/46504', note: 'interference with flight crew members and attendants' },
};

export const guides = [
  { slug: 'praying-on-a-plane', title: 'Praying on a plane', short: 'When to pray in the air, standing or seated, and finding the qibla on board.' },
  { slug: 'wudu-at-the-airport', title: 'Wuḍūʾ at the airport', short: 'Making wuḍūʾ considerately in a public washroom, wiping over socks, and using little water.' },
  { slug: 'tayammum', title: 'Tayammum', short: 'When there is no water, or you can’t use it, and how tayammum is done.' },
  { slug: 'shortening-and-combining', title: 'Shortening and combining', short: 'Qaṣr and jamʿ: how far, how long, and what each of the four schools says.' },
  { slug: 'praying-in-public', title: 'Praying in public', short: 'Praying calmly in a terminal, what to say if staff ask, and your options at security.' },
];
