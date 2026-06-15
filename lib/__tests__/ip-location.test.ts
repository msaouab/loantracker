import { describe, expect, it } from "vitest";
import {
  formatAdminLocationSummary,
  formatLocationLabel,
  isPublicIp,
  toGoogleMapsUrl,
  toIpApiLocationPayload,
  type IpLocation,
} from "@/lib/ip-location-shared";

const sampleLocation: IpLocation = {
  ip: "24.48.0.1",
  status: "success",
  country: "Canada",
  countryCode: "CA",
  region: "Quebec",
  regionCode: "QC",
  city: "Montreal",
  zip: "H1K",
  lat: 45.6085,
  lon: -73.5493,
  timezone: "America/Toronto",
  isp: "Le Groupe Videotron Ltee",
  org: "Videotron Ltee",
  asn: "AS5769 Videotron Ltee",
};

describe("ip-location", () => {
  it("maps cached location to ip-api JSON shape", () => {
    expect(toIpApiLocationPayload(sampleLocation)).toEqual({
      query: "24.48.0.1",
      status: "success",
      country: "Canada",
      countryCode: "CA",
      region: "QC",
      regionName: "Quebec",
      city: "Montreal",
      zip: "H1K",
      lat: 45.6085,
      lon: -73.5493,
      timezone: "America/Toronto",
      isp: "Le Groupe Videotron Ltee",
      org: "Videotron Ltee",
      as: "AS5769 Videotron Ltee",
    });
  });

  it("formats a human-readable location label", () => {
    expect(formatLocationLabel(sampleLocation)).toBe("Montreal, Canada");
    expect(formatLocationLabel({ ...sampleLocation, status: "fail" })).toBeNull();
  });

  it("formats admin location summary with zip", () => {
    expect(formatAdminLocationSummary(toIpApiLocationPayload(sampleLocation))).toBe(
      "Montreal, Quebec, Canada (H1K)"
    );
  });

  it("builds Google Maps URLs from coordinates or place name", () => {
    expect(toGoogleMapsUrl(toIpApiLocationPayload(sampleLocation))).toBe(
      "https://www.google.com/maps?q=45.6085,-73.5493"
    );
    expect(
      toGoogleMapsUrl({
        query: "1.2.3.4",
        status: "success",
        country: "Morocco",
        countryCode: "MA",
        region: null,
        regionName: null,
        city: null,
        zip: null,
        lat: null,
        lon: null,
        timezone: null,
        isp: null,
        org: null,
        as: null,
      })
    ).toBe("https://www.google.com/maps/search/?api=1&query=Morocco");
  });

  it("skips private and loopback IPs", () => {
    expect(isPublicIp("127.0.0.1")).toBe(false);
    expect(isPublicIp("192.168.1.1")).toBe(false);
    expect(isPublicIp("10.0.0.1")).toBe(false);
    expect(isPublicIp("24.48.0.1")).toBe(true);
  });
});
