// Straight-line (great-circle) distance in km, rounded to 0.1. Not a road or travel distance.
export function km(lat1, lon1, lat2, lon2) {
  const R = 6371, r = (d) => (d * Math.PI) / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lon2 - lon1) / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)) * 10) / 10;
}
