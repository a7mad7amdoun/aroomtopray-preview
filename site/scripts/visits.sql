-- Daily page-view totals written by functions/api/visit.js. One row per day, page and approximate place; no visitor data.
-- Apply once:  npx wrangler d1 execute <database> --remote --file site/scripts/visits.sql
CREATE TABLE IF NOT EXISTS visits (
  day TEXT NOT NULL,
  host TEXT NOT NULL,
  path TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT NOT NULL,
  city TEXT NOT NULL,
  device TEXT NOT NULL,
  referrer TEXT NOT NULL,
  n INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (day, host, path, country, region, city, device, referrer)
) WITHOUT ROWID;
