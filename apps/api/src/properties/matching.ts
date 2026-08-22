import type { PropertySearchWeights } from '@property-assistant/config';

export interface MatchingSearch {
  city: string | null;
  locality: string | null;
  min_rent: string | number | null;
  max_rent: string | number | null;
  bhk: number | null;
  available_from: string | null;
  furnishing: string | null;
}

export interface MatchingProperty {
  id: string;
  city: string;
  locality: string;
  rent: string | number;
  bhk: number;
  available_from: string;
  furnishing: string;
  quality_score: string | number;
  freshness_score: string | number;
  area?: string | number;
}

export interface BehavioralPreference {
  key: string;
  value: unknown;
}

export interface MatchResult<T extends MatchingProperty> {
  property: T;
  score: number;
  explanation: string[];
}

function closeness(value: number, target: number): number {
  if (target <= 0) return value === target ? 100 : 0;
  return Math.max(
    0,
    Math.min(100, 100 - (Math.abs(value - target) / target) * 100),
  );
}

function satisfiesHardRequirements(
  search: MatchingSearch,
  property: MatchingProperty,
): boolean {
  return (
    (search.city == null ||
      property.city.toLowerCase() === search.city.toLowerCase()) &&
    (search.locality == null ||
      property.locality.toLowerCase() === search.locality.toLowerCase()) &&
    (search.bhk == null || property.bhk === search.bhk) &&
    (search.min_rent == null ||
      Number(property.rent) >= Number(search.min_rent)) &&
    (search.max_rent == null ||
      Number(property.rent) <= Number(search.max_rent)) &&
    (search.available_from == null ||
      property.available_from >= search.available_from)
  );
}

export function rankProperties<T extends MatchingProperty>(
  search: MatchingSearch,
  properties: T[],
  weights: PropertySearchWeights,
  behavioralPreferences: BehavioralPreference[] = [],
): MatchResult<T>[] {
  return properties
    .filter((property) => satisfiesHardRequirements(search, property))
    .map((property) => {
      const location = search.locality
        ? property.locality.toLowerCase() === search.locality.toLowerCase()
          ? 100
          : 0
        : search.city &&
            property.city.toLowerCase() === search.city.toLowerCase()
          ? 100
          : 50;
      const rentTarget = search.max_rent ?? search.min_rent;
      const rent =
        rentTarget == null
          ? 100
          : closeness(Number(property.rent), Number(rentTarget));
      const bhk = search.bhk == null || property.bhk === search.bhk ? 100 : 0;
      const availability =
        search.available_from == null ||
        property.available_from >= search.available_from
          ? 100
          : 0;
      const furnishing =
        search.furnishing == null || property.furnishing === search.furnishing
          ? 100
          : 0;
      const quality =
        (Number(property.quality_score) + Number(property.freshness_score)) / 2;
      const behavioralMatches = behavioralPreferences.filter(
        (preference) =>
          (preference.key === 'preferred_locality' &&
            String(preference.value).toLowerCase() ===
              property.locality.toLowerCase()) ||
          (preference.key === 'preferred_furnishing' &&
            String(preference.value) === property.furnishing) ||
          (preference.key === 'preferred_rent' &&
            Math.abs(Number(property.rent) - Number(preference.value)) <=
              Number(preference.value) * 0.1) ||
          (preference.key === 'preferred_area' &&
            property.area != null &&
            Math.abs(Number(property.area) - Number(preference.value)) <=
              Number(preference.value) * 0.15),
      ).length;
      const behavioralBoost = Math.min(5, behavioralMatches * 1.5);
      const score =
        (location * weights.location +
          rent * weights.rent +
          bhk * weights.bhk +
          availability * weights.availability +
          furnishing * weights.furnishing +
          weights.amenities * 100 +
          quality * weights.quality) /
          100 +
        behavioralBoost;
      const explanation = [
        location === 100
          ? 'Matches requested location'
          : 'Matches requested city',
        rent >= 80 ? 'Fits the budget well' : 'Budget fit is less close',
        'Matches requested BHK',
        'Available for the requested date',
        furnishing === 100
          ? 'Matches furnishing preference'
          : 'Furnishing differs from preference',
        ...(behavioralBoost > 0 ? ['Matches learned preferences'] : []),
      ];
      return { property, score: Math.round(score * 100) / 100, explanation };
    })
    .sort(
      (a, b) => b.score - a.score || a.property.id.localeCompare(b.property.id),
    );
}
