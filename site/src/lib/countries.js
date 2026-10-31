import { COUNTRY_CATALOG } from '../data/country-catalog.js';
// Countries and territories are distinct from the directory's actual coverage.
export const COUNTRY_CODES = Object.freeze(COUNTRY_CATALOG.map(country=>country.code));
const valid = new Set(COUNTRY_CODES);
const locales=['en','fr','ar','es'];
const names=Object.fromEntries(locales.map(locale=>[locale,new Intl.DisplayNames([locale],{type:'region'})]));
const normalize=value=>typeof value==='string'?value.normalize('NFKD').replace(/\p{M}/gu,'').trim().toLocaleLowerCase('en'):'';
const byName=new Map();
for(const country of COUNTRY_CATALOG){
 byName.set(normalize(country.name),country.code);
 for(const locale of locales)byName.set(normalize(names[locale].of(country.code)),country.code);
}
const aliases={'Bosnia & Herzegovina':'BA','Hong Kong SAR China':'HK','Türkiye':'TR','Turkey':'TR','UK':'GB','USA':'US','UAE':'AE','Ivory Coast':'CI','Czech Republic':'CZ','South Korea':'KR','North Korea':'KP','Palestine':'PS'};
for(const [name,code] of Object.entries(aliases))byName.set(normalize(name),code);
export function countryCode(country) { const code=typeof country==='string'?country.trim().toUpperCase():'';return valid.has(code)?code:byName.get(normalize(country))||''; }
export function countryFlagUrl(country) { const code=countryCode(country);return code?`/flags/${code.toLowerCase()}.svg`:''; }
export function countrySearchText(country) {
 const code=countryCode(country);if(!code)return typeof country==='string'?country:'';
 return [code,...locales.map(locale=>names[locale].of(code)),...Object.keys(aliases).filter(name=>aliases[name]===code)].join(' ');
}
export function countryFlag(country) {
 const code = countryCode(country);
 return code ? String.fromCodePoint(...[...code].map(c => 127397+c.charCodeAt(0))) : '';
}
export function countryName(country, locale='en') {
 const code=countryCode(country);
 return code ? (names[locale]||names.en).of(code) : country;
}
export function readCountry(search, allowed) {
 const value=new URLSearchParams(search).get('country') || '';
 return allowed.includes(value) ? value : '';
}
export function writeCountry(value, search) {
 const params=new URLSearchParams(search);params.delete('country');
 if(value)params.set('country',value);
 return params.toString();
}
