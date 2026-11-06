// Official pages actually read on the stated date. This is a page-content
// review, not an onsite inspection, endorsement, or guarantee of future access.
// Historical room checked dates in the directory remain independent.
export const PLACE_OFFICIAL_GUIDES = [
 {
  placeUrl:'/universities/university-of-melbourne/', officialUrl:'https://students.unimelb.edu.au/support-and-wellbeing/health-and-wellbeing/faith-and-spirituality/faiths-directory',
  officialTitle:'Faiths directory', checkedOn:'2026-11-06', sourceScope:'access',
  summary:'Melbourne’s Musallah at Pelham and Leicester Streets has entrances via Little Pelham Street and dedicated ablution facilities for brothers and sisters. Access is strictly for registered university staff and students using individual swipe cards; unaffiliated visitors are not admitted.',
  evidence:['Musallah entrances for brothers and sisters are via Little Pelham Street.','Access is strictly for registered University staff and students using individual swipe cards.'],
  ambiguities:['Availability for five daily prayers does not establish unrestricted public or 24-hour access. Other campus prayer rooms have their own access or booking arrangements.'],
 },
 {
  placeUrl:'/airports/lhr/', officialUrl:'https://www.heathrow.com/at-the-airport/terminal-facilities/multi-faith-prayer-rooms',
  officialTitle:'Multi-faith prayer rooms', checkedOn:'2026-11-06', sourceScope:'room',
  summary:'Heathrow lists terminal-specific prayer-room locations, security sides and selected wudu facilities, including a temporary room near Terminal 5 check-in Zone A.',
  evidence:['T2 after security near Gate A21 and Gates B34/B35.','T5 check-in Zone A has a temporary room nearby.'],
  ambiguities:['Wudu is listed at particular locations; do not infer it at every room. Temporary locations can change.'],
 },
 {
  placeUrl:'/airports/ams/', officialUrl:'https://www.schiphol.nl/en/at-schiphol/services/meditation-centre/',
  officialTitle:'Meditation Centre', checkedOn:'2026-11-06', sourceScope:'access',
  summary:'Schiphol lists its multi-faith Meditation Centre in Lounge 2 after security, open 24 hours every day, with airport chaplaincy support.',
  evidence:['Lounge 2, after security.','Monday–Sunday, 24/7.'],
  ambiguities:['After-security access requires the appropriate travel access; this is not an unrestricted landside facility.'],
 },
 {
  placeUrl:'/airports/sin/', officialUrl:'https://www.changiairport.com/in/en/at-changi/facilities-and-services-directory/prayer-rooms-at-changi-airport-tranquil-spaces-for-reflection.html',
  officialTitle:'Prayer Room', checkedOn:'2026-11-06', sourceScope:'room',
  summary:'Changi lists prayer rooms in the transit areas of Terminals 1–4, with terminal locations and information about separate prayer areas and ablution facilities.',
  evidence:['Prayer rooms located across all terminals.','The listed locations are in transit areas.'],
  ambiguities:['Transit access depends on travel and security requirements; no landside access is implied.'],
 },
 {
  placeUrl:'/universities/university-of-warwick/', officialUrl:'https://warwick.ac.uk/services/chaplaincy/about_us/facilities/central/iph/',
  officialTitle:'Islamic Prayer Hall', checkedOn:'2026-11-06', sourceScope:'access',
  summary:'Warwick’s Islamic Prayer Hall is available daily to staff and students with an ID/access card, with separate brothers’ and sisters’ entrances and ablution facilities.',
  evidence:['The Prayer Hall is open for Warwick staff and students with an ID/access card.','Available 7 days a week, 365 days of the year.'],
  ambiguities:['Daily availability is not a statement of 24-hour entry or unrestricted public access. This check covers the central Islamic Prayer Hall only.'],
 },
 {
  placeUrl:'/universities/university-of-toronto/', officialUrl:'https://www.studentlife.utoronto.ca/news/update-on-the-open-assembly-space-in-the-bahen-centre/',
  officialTitle:'Update on the Open Assembly Space in the Bahen Centre', checkedOn:'2026-11-06', sourceScope:'room',
  summary:'In its February 2026 update, the university describes the Bahen Centre first-floor space by the café as a drop-in Muslim prayer space, not bookable at that time, with a maximum capacity of 30.',
  evidence:['The space will not currently be bookable.','Max. capacity 30 people.'],
  ambiguities:['This is a February 2026 update. Ablution stations and bidets were described as planned; their installation was not confirmed by this page. Other campus rooms were not rechecked here.'],
 },
 {
  placeUrl:'/hospitals/st-thomas-hospital/', officialUrl:'https://www.guysandstthomas.nhs.uk/our-services/spiritual-care/religious-services',
  officialTitle:'Religious services', checkedOn:'2026-11-06', sourceScope:'access',
  summary:'Friday Muslim prayers are listed at 1pm in the South Wing ground-floor multi-faith room. Access is limited to patients, relatives during their stay, and staff.',
  evidence:['Multi faith prayer room, ground floor, South Wing, St Thomas’ Hospital — 1pm.','Patients and relatives during their stay in the hospital and staff only.'],
  ambiguities:['The weekly service time does not establish general room opening hours. Public access is restricted.'],
 },
 {
  placeUrl:'/hospitals/toronto-general/', officialUrl:'https://www.uhn.ca/PatientsFamilies/Patient_Services/Spiritual_Care/Pages/spiritual_care_centres.aspx',
  officialTitle:'Spiritual Care in UHN Hospitals: General and Muslim Prayer Rooms', checkedOn:'2026-11-06', sourceScope:'room',
  summary:'UHN lists Toronto General’s Muslim Prayer Room on the first floor of the Gerrard Wing, Room 557, and its reflection centre in the Norman Urquhart Wing, Room 1NU-000.',
  evidence:['Muslim Prayer Room – 1st Floor, Gerrard Wing, Room 557.','1st Floor, Norman Urquhart Wing — Room 1NU-000.'],
  ambiguities:['The general reflection-centre hours are not explicitly assigned to the Muslim Prayer Room. The unusual floor/room combination is reproduced from UHN; confirm wayfinding onsite.'],
 },
 {
  placeUrl:'/hospitals/houston-methodist-tmc/', officialUrl:'https://www.houstonmethodist.org/locations/texas-medical-center/for-patients/spiritual-care-education/',
  officialTitle:'Spiritual Care & Education', checkedOn:'2026-11-06', sourceScope:'room',
  summary:'Houston Methodist lists its Muslim Prayer Center on the first floor of the Fondren-Brown Building, open 24 hours, with prayer times posted by the doors.',
  evidence:['Muslim Prayer Center — first floor of the Fondren-Brown Building.','Prayer timing is posted by the Center doors.'],
  ambiguities:['The page does not establish unrestricted public access; hospital visiting requirements still apply.'],
 },
];

// Retrieval history is independent of checked evidence; a blocked attempt alone
// never establishes current page content. Melbourne was subsequently read.
export const OFFICIAL_GUIDE_RESEARCH = [
 {placeUrl:'/universities/university-of-melbourne/',officialUrl:'https://students.unimelb.edu.au/support-and-wellbeing/health-and-wellbeing/faith-and-spirituality/faiths-directory',attemptedOn:'2026-11-06',status:'resolved',reason:'Initial direct HTTP request returned 403; subsequently the exact official page was successfully opened and read through web research on the same date. Historical room dates have not been changed.'},
];
