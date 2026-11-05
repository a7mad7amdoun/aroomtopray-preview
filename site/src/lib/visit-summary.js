import { getCopy, translateTerm } from './i18n.js';
import { VISIT_SUMMARY_COPY } from '../data/visit-summary-copy.js';

const knownValue = value => typeof value === 'string' && value.trim() && !/^(unknown|not stated)$/i.test(value.trim()) ? value.trim() : null;

/** A place-wide value is safe only when every room gives the same answer.
 * Missing and conflicting values are never replaced by the most convenient room. */
export function sharedRoomValue(spaces, key) {
  const values = spaces.map(space => knownValue(space[key]));
  if (!values.length || values.every(value => value === null)) return { state:'unknown' };
  if (!values.every(value => value === values[0])) return { state:'varies' };
  return { state:'known', value:values[0] };
}

export function visitSummary(place, kind, locale = 'en') {
  const t = getCopy(locale), copy = VISIT_SUMMARY_COPY[locale] || VISIT_SUMMARY_COPY.en;
  const airport = kind === 'airports', spaces = place.spaces || [];
  const fields = [
    { key:airport ? 'side' : 'access', icon:airport ? 'security' : 'key', label:airport ? copy.security : t.common.access },
    { key:'hours', icon:'clock', label:t.common.hours },
  ];
  if (airport && spaces.some(space => knownValue(space.access))) fields.push({ key:'access', icon:'key', label:copy.conditions });
  return fields.map(field => {
    const summary = sharedRoomValue(spaces, field.key);
    let value, lang, dir;
    if (place.status === 'pending' || place.hold) value = t.common.checking;
    else if (summary.state === 'varies') value = copy.varies;
    else if (summary.state === 'unknown') value = t.common.notStated;
    else if (field.key === 'side') value = t.amenities.side[summary.value] || t.common.notStated;
    else {
      value = translateTerm(summary.value, locale);
      if (value === summary.value) { lang = 'en'; dir = 'ltr'; }
    }
    return { ...field, value, lang, dir };
  });
}
