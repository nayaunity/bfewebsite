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
  "SWITZERLAND", "AUSTRIA", "DENMARK", "NORWAY", "FINLAND", "BELGIUM",
  "PORTUGAL", "CZECH", "ROMANIA", "HUNGARY", "SOUTH KOREA", "KOREA",
  "TAIWAN", "INDONESIA", "PHILIPPINES", "MALAYSIA", "THAILAND", "VIETNAM",
  "NEW ZEALAND", "ARGENTINA", "COLOMBIA", "CHILE", "PERU",
  "SOUTH AFRICA", "NIGERIA", "KENYA", "GHANA", "EGYPT", "MOROCCO",
  "RWANDA", "TANZANIA", "CAMEROON", "PAKISTAN", "BANGLADESH",
  "UNITED ARAB EMIRATES", "UAE", "DUBAI", "ABU DHABI", "QATAR", "DOHA",
  "SAUDI ARABIA", "RIYADH", "BAHRAIN", "KUWAIT",
  "EMEA", "APAC", "LATAM", "EUROPE", "ASIA",
  "TORONTO", "VANCOUVER", "MONTREAL", "LONDON", "BERLIN", "PARIS",
  "TOKYO", "SYDNEY", "MELBOURNE", "BANGALORE", "MUMBAI", "DUBLIN",
  "AMSTERDAM", "STOCKHOLM", "COPENHAGEN", "OSLO", "HELSINKI",
  "ZURICH", "GENEVA", "MUNICH", "HAMBURG", "FRANKFURT",
  "LISBON", "MADRID", "BARCELONA", "ROME", "MILAN",
  "SEOUL", "HONG KONG", "SHANGHAI", "BEIJING", "SHENZHEN",
  "SAO PAULO", "BUENOS AIRES", "BOGOTA",
  "CAPE TOWN", "JOHANNESBURG", "LAGOS", "NAIROBI", "ACCRA",
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

/** Check if a user is US-based given their countryOfResidence field. */
export function isUserUS(countryOfResidence: string | null | undefined): boolean {
  if (!countryOfResidence) return true; // Default assumption: US
  const c = countryOfResidence.toLowerCase();
  // Word-boundary match so "Mauritius", "Belarus", "Cyprus", "Australia"
  // (which all contain the substring "us") aren't classified as US.
  return c.includes("united states") || c.includes("america") || /\b(us|usa)\b/.test(c);
}

/** Classify a job's location into "us", "international", or "both". */
export function computeRegion(location: string): "us" | "international" | "both" {
  const isUS = hasUSLocation(location);
  const isIntl = hasInternationalLocation(location);

  if (isUS && isIntl) return "both";
  if (isIntl) return "international";
  return "us"; // default — bare "Remote" etc. assumed US
}

// Lowercase tokens we expect to see in a job's `location` string for each
// non-US country we have users in. Used by the matcher to allow non-US users
// to see jobs in their own country while blocking jobs from other countries.
// Keys are lowercase normalized country names.
const COUNTRY_TOKENS: Record<string, string[]> = {
  canada: ["canada", "toronto", "vancouver", "montreal", "ottawa", "calgary", "edmonton", "ontario", "quebec", "alberta", "british columbia"],
  "united kingdom": ["united kingdom", "uk", "england", "scotland", "wales", "london", "manchester", "edinburgh", "bristol", "birmingham", "leeds", "glasgow"],
  india: ["india", "bangalore", "bengaluru", "mumbai", "delhi", "hyderabad", "chennai", "pune", "kolkata", "gurgaon", "noida"],
  australia: ["australia", "sydney", "melbourne", "brisbane", "perth", "adelaide", "canberra"],
  germany: ["germany", "deutschland", "berlin", "munich", "münchen", "hamburg", "frankfurt", "cologne", "köln"],
  france: ["france", "paris", "lyon", "marseille", "toulouse"],
  ireland: ["ireland", "dublin", "cork"],
  netherlands: ["netherlands", "amsterdam", "rotterdam", "utrecht", "hague"],
  singapore: ["singapore"],
  nigeria: ["nigeria", "lagos", "abuja", "ibadan", "port harcourt"],
  kenya: ["kenya", "nairobi", "mombasa"],
  ghana: ["ghana", "accra", "kumasi"],
  "south africa": ["south africa", "johannesburg", "cape town", "pretoria", "durban"],
  "united arab emirates": ["united arab emirates", "uae", "dubai", "abu dhabi"],
  rwanda: ["rwanda", "kigali"],
  tanzania: ["tanzania", "dar es salaam", "dodoma"],
  cameroon: ["cameroon", "yaoundé", "yaounde", "douala"],
  morocco: ["morocco", "casablanca", "rabat"],
  pakistan: ["pakistan", "karachi", "lahore", "islamabad"],
  belgium: ["belgium", "brussels", "antwerp"],
  mauritius: ["mauritius", "port louis"],
  palestine: ["palestine", "gaza", "ramallah", "west bank"],
};

/**
 * Returns lowercase tokens that should appear in a job's `location` string
 * for a job to be considered eligible for a user residing in `country`.
 * Falls back to the lowercased country string itself for countries not in
 * the explicit map.
 */
export function getUserCountryTokens(country: string | null | undefined): string[] {
  if (!country) return [];
  const normalized = country.trim().toLowerCase();
  if (COUNTRY_TOKENS[normalized]) return COUNTRY_TOKENS[normalized];
  for (const [key, tokens] of Object.entries(COUNTRY_TOKENS)) {
    if (normalized.includes(key)) return tokens;
  }
  return [normalized];
}
