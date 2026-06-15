import { anonymizeIp } from "@/lib/ip-anonymization";

export type DeviceType = "desktop" | "mobile" | "tablet";

export type DeviceMetadata = {
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  deviceType: DeviceType | null;
  language: string | null;
};

export type ClientInfo = DeviceMetadata & {
  ipAddress: string | null;
  userAgent: string | null;
};

const MAX_USER_AGENT_LENGTH = 512;

export function getClientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }

  return req.headers.get("x-real-ip") ?? null;
}

export function parseBrowser(userAgent: string | null): string | null {
  if (!userAgent) {
    return null;
  }

  if (userAgent.includes("Edg/")) {
    return "Edge";
  }
  if (userAgent.includes("Firefox/")) {
    return "Firefox";
  }
  if (userAgent.includes("Chrome/") || userAgent.includes("CriOS/")) {
    return "Chrome";
  }
  if (userAgent.includes("Safari/") && !userAgent.includes("Chrome/")) {
    return "Safari";
  }
  if (userAgent.includes("OPR/") || userAgent.includes("Opera")) {
    return "Opera";
  }

  return "Unknown browser";
}

export function parseBrowserVersion(
  userAgent: string | null,
  browser: string | null
): string | null {
  if (!userAgent || !browser) {
    return null;
  }

  switch (browser) {
    case "Edge": {
      const match = userAgent.match(/Edg\/(\d+)/);
      return match?.[1] ?? null;
    }
    case "Firefox": {
      const match = userAgent.match(/Firefox\/(\d+)/);
      return match?.[1] ?? null;
    }
    case "Chrome": {
      const match = userAgent.match(/Chrome\/(\d+)/);
      return match?.[1] ?? null;
    }
    case "Safari": {
      const match = userAgent.match(/Version\/(\d+(?:\.\d+)?)/);
      return match?.[1]?.split(".")[0] ?? null;
    }
    case "Opera": {
      const match = userAgent.match(/OPR\/(\d+)/);
      return match?.[1] ?? null;
    }
    default:
      return null;
  }
}

export function parseOs(userAgent: string | null, platformHint?: string | null): string | null {
  const platform = platformHint?.replace(/^"|"$/g, "").trim();
  if (platform) {
    return platform;
  }

  if (!userAgent) {
    return null;
  }

  if (/Windows NT/.test(userAgent)) {
    return "Windows";
  }
  if (/CrOS/.test(userAgent)) {
    return "Chrome OS";
  }
  if (/Android/.test(userAgent)) {
    return "Android";
  }
  if (/iPhone|iPad|iPod/.test(userAgent)) {
    return "iOS";
  }
  if (/Mac OS X|Macintosh/.test(userAgent)) {
    return "macOS";
  }
  if (/Linux/.test(userAgent)) {
    return "Linux";
  }

  return null;
}

export function parseDeviceType(
  userAgent: string | null,
  mobileHint?: string | null
): DeviceType | null {
  if (mobileHint === "?1") {
    return "mobile";
  }
  if (mobileHint === "?0") {
    return "desktop";
  }

  if (!userAgent) {
    return null;
  }

  if (/iPad|Tablet|PlayBook|Silk\//i.test(userAgent)) {
    return "tablet";
  }
  if (/Mobile|iPhone|iPod|Android.*Mobile|IEMobile|BlackBerry|Opera Mini/i.test(userAgent)) {
    return "mobile";
  }

  return "desktop";
}

export function parseLanguage(acceptLanguage: string | null): string | null {
  if (!acceptLanguage) {
    return null;
  }

  const first = acceptLanguage.split(",")[0]?.trim();
  if (!first) {
    return null;
  }

  return first.split(";")[0]?.trim() || null;
}

function truncateUserAgent(userAgent: string | null): string | null {
  if (!userAgent) {
    return null;
  }

  return userAgent.length > MAX_USER_AGENT_LENGTH
    ? userAgent.slice(0, MAX_USER_AGENT_LENGTH)
    : userAgent;
}

export function getClientInfo(req: Request): ClientInfo {
  const userAgent = truncateUserAgent(req.headers.get("user-agent"));
  const rawIp = getClientIp(req);
  const browser = parseBrowser(userAgent);

  return {
    ipAddress: rawIp ? anonymizeIp(rawIp) : null,
    userAgent,
    browser,
    browserVersion: parseBrowserVersion(userAgent, browser),
    os: parseOs(userAgent, req.headers.get("sec-ch-ua-platform")),
    deviceType: parseDeviceType(userAgent, req.headers.get("sec-ch-ua-mobile")),
    language: parseLanguage(req.headers.get("accept-language")),
  };
}

export function clientInfoToDeviceMetadata(clientInfo: ClientInfo): DeviceMetadata {
  return {
    browser: clientInfo.browser,
    browserVersion: clientInfo.browserVersion,
    os: clientInfo.os,
    deviceType: clientInfo.deviceType,
    language: clientInfo.language,
  };
}

function formatDeviceType(deviceType: DeviceType | null | undefined): string | null {
  if (!deviceType) {
    return null;
  }

  return deviceType.charAt(0).toUpperCase() + deviceType.slice(1);
}

function formatBrowserLabel(
  browser: string | null | undefined,
  browserVersion: string | null | undefined
): string | null {
  if (!browser) {
    return null;
  }

  return browserVersion ? `${browser} ${browserVersion}` : browser;
}

export function formatClientInfo(
  clientInfo: Partial<ClientInfo>,
  options?: { includeIp?: boolean }
): string | null {
  const parts: string[] = [];

  const browserLabel = formatBrowserLabel(clientInfo.browser, clientInfo.browserVersion);
  if (browserLabel) {
    parts.push(browserLabel);
  }
  if (clientInfo.os) {
    parts.push(clientInfo.os);
  }
  const deviceLabel = formatDeviceType(clientInfo.deviceType ?? null);
  if (deviceLabel) {
    parts.push(deviceLabel);
  }
  if (clientInfo.language) {
    parts.push(clientInfo.language);
  }
  if (options?.includeIp && clientInfo.ipAddress) {
    parts.push(clientInfo.ipAddress);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

export function isDeviceType(value: unknown): value is DeviceType {
  return value === "desktop" || value === "mobile" || value === "tablet";
}

export function deviceMetadataFromRecord(
  metadata: Record<string, unknown> | null | undefined
): Partial<DeviceMetadata> {
  const device = metadata?.device;
  if (!device || typeof device !== "object" || Array.isArray(device)) {
    return {};
  }

  const record = device as Record<string, unknown>;

  return {
    browser: typeof record.browser === "string" ? record.browser : null,
    browserVersion:
      typeof record.browserVersion === "string" ? record.browserVersion : null,
    os: typeof record.os === "string" ? record.os : null,
    deviceType: isDeviceType(record.deviceType) ? record.deviceType : null,
    language: typeof record.language === "string" ? record.language : null,
  };
}
