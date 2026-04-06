// Shared location → region classification for jobs.
// Used at write time (scrapers, API create) so the DB can filter by region directly.

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
];

const US_CITIES = [
  "CHICAGO", "NEW YORK", "LOS ANGELES", "SAN FRANCISCO", "SEATTLE",
  "AUSTIN", "BOSTON", "DENVER", "PORTLAND", "ATLANTA", "MIAMI",
  "DALLAS", "HOUSTON", "PHOENIX", "PHILADELPHIA", "SAN DIEGO",
  "SAN JOSE", "WASHINGTON DC", "MINNEAPOLIS", "DETROIT", "CLEVELAND",
  "PITTSBURGH", "BALTIMORE", "CHARLOTTE", "NASHVILLE", "RALEIGH",
];

const NON_US_INDICATORS = [
  "AUSTRALIA", "INDIA", "CANADA", "UK", "UNITED KINGDOM", "GERMANY",
  "FRANCE", "JAPAN", "CHINA", "BRAZIL", "MEXICO", "SPAIN", "ITALY",
  "NETHERLANDS", "SINGAPORE", "IRELAND", "ISRAEL", "SWEDEN", "POLAND",
  "TORONTO", "VANCOUVER", "LONDON", "BERLIN", "PARIS", "TOKYO", "SYDNEY",
  "MELBOURNE", "BANGALORE", "MUMBAI", "DUBLIN",
];

export function hasUSLocation(location: string): boolean {
  const loc = location.toUpperCase();

  if (loc.includes("UNITED STATES") || loc.includes(", USA") || loc.includes(", US") || loc.includes("NORTH AMERICA")) {
    return true;
  }

  for (const state of US_STATES) {
    const statePattern = new RegExp(`\\b${state}\\b`);
    if (statePattern.test(loc)) return true;
  }

  for (const city of US_CITIES) {
    if (loc.includes(city)) return true;
  }

  if (loc === "REMOTE" || loc === "REMOTE, US" || loc === "US REMOTE" || loc === "REMOTE - US") {
    return true;
  }

  return false;
}

export function hasInternationalLocation(location: string): boolean {
  const loc = location.toUpperCase();
  for (const indicator of NON_US_INDICATORS) {
    if (loc.includes(indicator)) return true;
  }
  return false;
}

/** Classify a job's location into "us", "international", or "both". */
export function computeRegion(location: string): "us" | "international" | "both" {
  const isUS = hasUSLocation(location);
  const isIntl = hasInternationalLocation(location);

  if (isUS && isIntl) return "both";
  if (isIntl) return "international";
  return "us"; // default — bare "Remote" etc. assumed US
}
