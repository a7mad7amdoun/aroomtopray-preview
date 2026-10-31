// Assign a visitor scene by the purpose of the page, not by an invented institution.
export const EDITORIAL_ROUTES = {
 '/visit/':'prepare', '/planner/':'planner', '/saved/':'saved',
 '/travel/':'travel', '/about/':'about', '/contact/':'contact', '/rooms-won/':'rooms-won',
 '/travel/praying-on-a-plane/':'praying-on-a-plane',
 '/travel/wudu-at-the-airport/':'wudu-at-the-airport',
 '/travel/tayammum/':'tayammum',
 '/travel/shortening-and-combining/':'shortening-and-combining',
 '/travel/praying-in-public/':'praying-in-public',
};
export const EDITORIAL_SCENES = new Set([...Object.values(EDITORIAL_ROUTES),'poster-airport','poster-campus','poster-hospital']);
export const EDITORIAL_ART = {
 prepare:{scene:'airport',title:'A little preparation. A calmer visit.',caption:'Know your next step before you arrive.'},
 planner:{scene:'airport',title:'Plan before you fly.',caption:'Keep time for prayer alongside the rest of your journey.'},
 saved:{scene:'airport',title:'Keep your next stop close to hand.',caption:'Your saved places are there when you need to find the details again.'},
 travel:{scene:'airport',title:'Clarity for the journey.',caption:'Practical reading for the moments before, between and after flights.'},
 about:{scene:'hospital',title:'Different journeys. The same need for quiet.',caption:'A place to pause can matter during travel, study or a visit to someone you love.'},
 contact:{scene:'hospital',title:'Useful details help the next visitor.',caption:'Your observations can help someone else prepare for their visit.'},
 'rooms-won':{scene:'campus',title:'Making room for everyday life.',caption:'A quiet space can become part of an ordinary day.'},
 'praying-on-a-plane':{scene:'airport',title:'Before boarding.',caption:'A moment to prepare while you are still in the terminal.'},
 'wudu-at-the-airport':{scene:'airport',title:'Prepare before heading to the gate.',caption:'Washing facilities are one of the details to check in your airport listing.'},
 tayammum:{scene:'campus',title:'A quiet moment to understand your options.',caption:'This scene provides context; the written guide explains the practice and its sources.'},
 'shortening-and-combining':{scene:'airport',title:'Making time along the way.',caption:'Read the sourced guidance alongside your travel plans.'},
 'praying-in-public':{scene:'campus',title:'Looking for a dedicated space.',caption:'An ordinary pause between commitments.'},
 'poster-airport':{scene:'airport'}, 'poster-campus':{scene:'campus'}, 'poster-hospital':{scene:'hospital'},
};
export function editorialScene(path) {
 const normalized = '/' + path.replace(/^\/(?:en|fr|ar|es)(?=\/)/,'').replace(/^\/+|\/+$/g,'') + '/';
 return EDITORIAL_ROUTES[normalized] || null;
}
