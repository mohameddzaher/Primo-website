// ============================================
// Reverse geocoding for the "Use My Location" button
// ============================================
// This used to be a stub that wrote `city: 'Riyadh'` for every customer
// regardless of their coordinates — someone in Jeddah got a Riyadh address,
// which would quietly ship the order to the wrong city.
//
// Strategy:
//   1. Ask a real reverse-geocoder (OpenStreetMap Nominatim — no API key).
//   2. If that fails or times out, fall back to the nearest known Saudi city
//      computed offline, so the button still does something truthful.
//   3. Never invent a district. If we can't resolve one, leave it blank for the
//      customer to fill in.

export interface ResolvedAddress {
  fullAddress?: string;
  city?: string;
  area?: string;
  /** true when the city came from the offline fallback rather than a lookup */
  approximate?: boolean;
}

/** Major Saudi cities, for the offline fallback. */
const SAUDI_CITIES: { en: string; ar: string; lat: number; lon: number }[] = [
  { en: 'Riyadh', ar: 'الرياض', lat: 24.7136, lon: 46.6753 },
  { en: 'Jeddah', ar: 'جدة', lat: 21.4858, lon: 39.1925 },
  { en: 'Mecca', ar: 'مكة المكرمة', lat: 21.3891, lon: 39.8579 },
  { en: 'Medina', ar: 'المدينة المنورة', lat: 24.5247, lon: 39.5692 },
  { en: 'Dammam', ar: 'الدمام', lat: 26.4207, lon: 50.0888 },
  { en: 'Khobar', ar: 'الخبر', lat: 26.2794, lon: 50.2083 },
  { en: 'Dhahran', ar: 'الظهران', lat: 26.2361, lon: 50.0393 },
  { en: 'Taif', ar: 'الطائف', lat: 21.2703, lon: 40.4158 },
  { en: 'Buraidah', ar: 'بريدة', lat: 26.3260, lon: 43.9750 },
  { en: 'Tabuk', ar: 'تبوك', lat: 28.3835, lon: 36.5662 },
  { en: 'Abha', ar: 'أبها', lat: 18.2164, lon: 42.5053 },
  { en: 'Khamis Mushait', ar: 'خميس مشيط', lat: 18.3060, lon: 42.7297 },
  { en: 'Hail', ar: 'حائل', lat: 27.5114, lon: 41.7208 },
  { en: 'Najran', ar: 'نجران', lat: 17.4917, lon: 44.1322 },
  { en: 'Jubail', ar: 'الجبيل', lat: 27.0174, lon: 49.6225 },
  { en: 'Yanbu', ar: 'ينبع', lat: 24.0895, lon: 38.0618 },
  { en: 'Al Ahsa', ar: 'الأحساء', lat: 25.3833, lon: 49.5833 },
];

/** Great-circle distance in km. */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Nearest Saudi city, but only when the point is plausibly near one. */
function nearestSaudiCity(lat: number, lon: number, locale: string): string | undefined {
  let best: (typeof SAUDI_CITIES)[number] | undefined;
  let bestKm = Infinity;

  for (const c of SAUDI_CITIES) {
    const km = haversineKm(lat, lon, c.lat, c.lon);
    if (km < bestKm) {
      bestKm = km;
      best = c;
    }
  }

  // Beyond ~150 km we are guessing; better to leave the field empty than to
  // put a confidently wrong city on a delivery address.
  if (!best || bestKm > 150) return undefined;
  return locale === 'ar' ? best.ar : best.en;
}

/**
 * Resolve coordinates into a postal-ish address.
 * Never throws — the caller gets whatever could be determined.
 */
export async function resolveAddress(
  lat: number,
  lon: number,
  locale: string = 'en'
): Promise<ResolvedAddress> {
  // 1) Real lookup
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1&accept-language=${locale === 'ar' ? 'ar' : 'en'}`,
      { signal: controller.signal, headers: { Accept: 'application/json' } }
    );
    clearTimeout(timeout);

    if (res.ok) {
      const data: any = await res.json();
      const a = data?.address || {};

      const city =
        a.city || a.town || a.village || a.municipality || a.state_district || a.county;
      const area = a.suburb || a.neighbourhood || a.city_district || a.quarter;
      const street = [a.road, a.house_number].filter(Boolean).join(' ');

      // Prefer a readable street line; fall back to the display name.
      const fullAddress = street || data?.display_name || undefined;

      if (city || area || fullAddress) {
        return { fullAddress, city, area };
      }
    }
  } catch {
    // Network failure, timeout, or the service is unavailable — fall through.
  }

  // 2) Offline fallback: nearest known city, no invented district.
  const city = nearestSaudiCity(lat, lon, locale);
  return {
    city,
    approximate: true,
  };
}
