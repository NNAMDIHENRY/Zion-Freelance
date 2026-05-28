import worldCountries from "./world-countries.json";

export type CountryOption = { code: string; label: string };

export const WORLD_COUNTRY_OPTIONS: CountryOption[] = worldCountries as CountryOption[];

/** @deprecated Use WORLD_COUNTRY_OPTIONS — kept for imports that expect COUNTRY_OPTIONS */
export const COUNTRY_OPTIONS = WORLD_COUNTRY_OPTIONS;

export const COUNTRY_PHONE_PREFIX: Record<string, string> = {
  US: "+1",
  GB: "+44",
  CA: "+1",
  AU: "+61",
  NG: "+234",
  GH: "+233",
  KE: "+254",
  ZA: "+27",
  IN: "+91",
  PK: "+92",
  BD: "+880",
  PH: "+63",
  DE: "+49",
  FR: "+33",
  NL: "+31",
  ES: "+34",
  IT: "+39",
  BR: "+55",
  MX: "+52",
  AE: "+971",
  SG: "+65"
};

export function phonePrefixForCountryLabel(label: string) {
  const match = WORLD_COUNTRY_OPTIONS.find((c) => c.label === label);
  if (!match) return "";
  return COUNTRY_PHONE_PREFIX[match.code] ?? "";
}

export function countryLabelForCode(code: string) {
  return WORLD_COUNTRY_OPTIONS.find((c) => c.code === code)?.label ?? "";
}

export const REFERRAL_SOURCE_OPTIONS = [
  "Search engine (Google, Bing, etc.)",
  "Social media",
  "Friend or colleague",
  "Blog or article",
  "YouTube or podcast",
  "Online ad",
  "Conference or event",
  "Other"
] as const;
