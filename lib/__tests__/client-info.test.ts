import { describe, expect, it } from "vitest";
import {
  formatClientInfo,
  getClientInfo,
  parseBrowser,
  parseBrowserVersion,
  parseDeviceType,
  parseLanguage,
  parseOs,
} from "@/lib/client-info";

const CHROME_MAC_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const SAFARI_IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1";

function makeRequest(headers: Record<string, string>) {
  return new Request("https://example.com/api/auth/callback/credentials", {
    method: "POST",
    headers,
  });
}

describe("client-info parsers", () => {
  it("parses Chrome on macOS as desktop", () => {
    expect(parseBrowser(CHROME_MAC_UA)).toBe("Chrome");
    expect(parseBrowserVersion(CHROME_MAC_UA, "Chrome")).toBe("120");
    expect(parseOs(CHROME_MAC_UA, null)).toBe("macOS");
    expect(parseDeviceType(CHROME_MAC_UA, null)).toBe("desktop");
  });

  it("parses Safari on iPhone as mobile iOS", () => {
    expect(parseBrowser(SAFARI_IOS_UA)).toBe("Safari");
    expect(parseOs(SAFARI_IOS_UA, null)).toBe("iOS");
    expect(parseDeviceType(SAFARI_IOS_UA, null)).toBe("mobile");
  });

  it("prefers client hint platform when present", () => {
    expect(parseOs(CHROME_MAC_UA, '"Windows"')).toBe("Windows");
    expect(parseDeviceType(CHROME_MAC_UA, "?1")).toBe("mobile");
  });

  it("parses the first accept-language tag", () => {
    expect(parseLanguage("fr-MA,fr;q=0.9,en-US;q=0.8")).toBe("fr-MA");
  });

  it("formats a full device label including the anonymized IP", () => {
    expect(
      formatClientInfo({
        browser: "Chrome",
        browserVersion: "120",
        os: "macOS",
        deviceType: "desktop",
        language: "fr-MA",
        ipAddress: "203.0.113.0",
      })
    ).toBe("Chrome 120 · macOS · Desktop · fr-MA · 203.0.113.0");
  });
});

describe("getClientInfo", () => {
  it("collects browser, OS, device, language, IP, and user agent", () => {
    const info = getClientInfo(
      makeRequest({
        "user-agent": CHROME_MAC_UA,
        "accept-language": "fr-MA,fr;q=0.9",
        "x-forwarded-for": "203.0.113.45",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
      })
    );

    expect(info.browser).toBe("Chrome");
    expect(info.browserVersion).toBe("120");
    expect(info.os).toBe("macOS");
    expect(info.deviceType).toBe("desktop");
    expect(info.language).toBe("fr-MA");
    expect(info.ipAddress).toBe("203.0.113.0");
    expect(info.userAgent).toContain("Chrome/120");
  });
});
