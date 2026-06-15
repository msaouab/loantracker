/** Browser-safe IP location types and formatters (no database imports). */

export type IpLocation = {
  ip: string;
  status: string;
  country: string | null;
  countryCode: string | null;
  /** Human-readable region name (ip-api `regionName`). */
  region: string | null;
  /** Region code (ip-api `region`). */
  regionCode: string | null;
  city: string | null;
  zip: string | null;
  lat: number | null;
  lon: number | null;
  timezone: string | null;
  isp: string | null;
  org: string | null;
  /** Autonomous-system label (ip-api `as`). */
  asn: string | null;
};

/** ip-api.com JSON shape for admin display and export. */
export type IpApiLocationPayload = {
  query: string;
  status: string;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  regionName: string | null;
  city: string | null;
  zip: string | null;
  lat: number | null;
  lon: number | null;
  timezone: string | null;
  isp: string | null;
  org: string | null;
  as: string | null;
};

/** Skip loopback / private / link-local ranges ip-api can't resolve. */
export function isPublicIp(ip: string | null | undefined): ip is string {
  if (!ip) return false;
  if (ip === "127.0.0.1" || ip === "::1" || ip === "0.0.0.0") return false;
  if (/^10\./.test(ip)) return false;
  if (/^192\.168\./.test(ip)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return false;
  if (/^169\.254\./.test(ip)) return false;
  if (/^fe80:/i.test(ip)) return false;
  if (/^f[cd][0-9a-f]{2}:/i.test(ip)) return false;
  return true;
}

export function formatLocationLabel(loc: IpLocation | undefined | null): string | null {
  if (!loc || loc.status !== "success") return null;
  const parts = [loc.city, loc.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

/** Rich place label for admin activity views. */
export function formatAdminLocationSummary(payload: IpApiLocationPayload): string {
  const place = [payload.city, payload.regionName, payload.country].filter(Boolean).join(", ");
  if (place && payload.zip) {
    return `${place} (${payload.zip})`;
  }
  return place || payload.country || "Unknown location";
}

/** Google Maps URL from cached ip-api coordinates or place name. */
export function toGoogleMapsUrl(payload: IpApiLocationPayload): string | null {
  if (payload.lat != null && payload.lon != null) {
    return `https://www.google.com/maps?q=${payload.lat},${payload.lon}`;
  }

  const query = [payload.city, payload.regionName, payload.country].filter(Boolean).join(", ");
  if (!query) {
    return null;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** ip-api.com-compatible JSON for admin display and export. */
export function toIpApiLocationPayload(loc: IpLocation): IpApiLocationPayload {
  return {
    query: loc.ip,
    status: loc.status,
    country: loc.country,
    countryCode: loc.countryCode,
    region: loc.regionCode,
    regionName: loc.region,
    city: loc.city,
    zip: loc.zip,
    lat: loc.lat,
    lon: loc.lon,
    timezone: loc.timezone,
    isp: loc.isp,
    org: loc.org,
    as: loc.asn,
  };
}
