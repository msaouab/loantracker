import { prisma } from "@/lib/db";
import {
  isPublicIp,
  type IpLocation,
} from "@/lib/ip-location-shared";

export type { IpApiLocationPayload, IpLocation } from "@/lib/ip-location-shared";
export {
  formatAdminLocationSummary,
  formatLocationLabel,
  isPublicIp,
  toGoogleMapsUrl,
  toIpApiLocationPayload,
} from "@/lib/ip-location-shared";

/**
 * IP geolocation via ip-api.com, optimized for its free tier
 * (45 req/min, HTTP-only, temp-bans on overage):
 *   - DB-backed cache keyed by IP → each network is fetched at most once per TTL.
 *   - Only called for security events, off the request path (`after()`).
 *   - Private/loopback IPs are skipped; failures never throw.
 */

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const FETCH_TIMEOUT_MS = 2500;
const API_FIELDS =
  "status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query";

function readString(data: Record<string, unknown>, key: string): string | null {
  const value = data[key];
  return typeof value === "string" ? value : null;
}

function readNumber(data: Record<string, unknown>, key: string): number | null {
  const value = data[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function mapRowToIpLocation(row: {
  ip: string;
  status: string;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  regionCode: string | null;
  city: string | null;
  zip: string | null;
  lat: number | null;
  lon: number | null;
  timezone: string | null;
  isp: string | null;
  org: string | null;
  asn: string | null;
}): IpLocation {
  return {
    ip: row.ip,
    status: row.status,
    country: row.country,
    countryCode: row.countryCode,
    region: row.region,
    regionCode: row.regionCode,
    city: row.city,
    zip: row.zip,
    lat: row.lat,
    lon: row.lon,
    timezone: row.timezone,
    isp: row.isp,
    org: row.org,
    asn: row.asn,
  };
}

function mapApiResponse(ip: string, data: Record<string, unknown>): IpLocation {
  const ok = data.status === "success";
  return {
    ip,
    status: ok ? "success" : "fail",
    country: ok ? readString(data, "country") : null,
    countryCode: ok ? readString(data, "countryCode") : null,
    region: ok ? readString(data, "regionName") : null,
    regionCode: ok ? readString(data, "region") : null,
    city: ok ? readString(data, "city") : null,
    zip: ok ? readString(data, "zip") : null,
    lat: ok ? readNumber(data, "lat") : null,
    lon: ok ? readNumber(data, "lon") : null,
    timezone: ok ? readString(data, "timezone") : null,
    isp: ok ? readString(data, "isp") : null,
    org: ok ? readString(data, "org") : null,
    asn: ok ? readString(data, "as") : null,
  };
}

async function fetchFromApi(ip: string): Promise<IpLocation | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=${API_FIELDS}&lang=en`,
      { signal: controller.signal }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    return mapApiResponse(ip, data);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function toPersistenceData(fetched: IpLocation) {
  return {
    status: fetched.status,
    country: fetched.country,
    countryCode: fetched.countryCode,
    region: fetched.region,
    regionCode: fetched.regionCode,
    city: fetched.city,
    zip: fetched.zip,
    lat: fetched.lat,
    lon: fetched.lon,
    timezone: fetched.timezone,
    isp: fetched.isp,
    org: fetched.org,
    asn: fetched.asn,
    fetchedAt: new Date(),
  };
}

/**
 * Ensure an IP's geolocation is cached. Cache-first: only calls ip-api on a
 * miss or stale entry. Safe to call fire-and-forget (e.g. inside `after()`).
 */
export async function ensureIpLocation(ip: string): Promise<void> {
  if (!isPublicIp(ip)) return;
  try {
    const existing = await prisma.ipLocation.findUnique({ where: { ip } });
    if (existing && Date.now() - existing.fetchedAt.getTime() < CACHE_TTL_MS) {
      return;
    }

    const fetched = await fetchFromApi(ip);
    if (!fetched) return;

    const data = toPersistenceData(fetched);
    await prisma.ipLocation.upsert({
      where: { ip },
      create: { ip, ...data },
      update: data,
    });
  } catch (error) {
    console.error("ip-location lookup failed:", error);
  }
}

/** Batch-read cached locations (read path — never calls the API). */
export async function getCachedIpLocations(
  ips: Array<string | null | undefined>
): Promise<Map<string, IpLocation>> {
  const unique = [...new Set(ips.filter(isPublicIp))];
  const map = new Map<string, IpLocation>();
  if (unique.length === 0) return map;

  const rows = await prisma.ipLocation.findMany({ where: { ip: { in: unique } } });
  for (const row of rows) {
    map.set(row.ip, mapRowToIpLocation(row));
  }
  return map;
}
