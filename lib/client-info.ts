import { anonymizeIp } from "@/lib/ip-anonymization";

export type ClientInfo = {
  ipAddress: string | null;
  userAgent: string | null;
  browser: string | null;
};

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

export function getClientInfo(req: Request): ClientInfo {
  const userAgent = req.headers.get("user-agent");
  const rawIp = getClientIp(req);

  return {
    ipAddress: rawIp ? anonymizeIp(rawIp) : null,
    userAgent: null,
    browser: parseBrowser(userAgent),
  };
}

export function formatClientInfo(clientInfo: ClientInfo): string | null {
  const parts: string[] = [];

  if (clientInfo.browser) {
    parts.push(clientInfo.browser);
  }
  if (clientInfo.ipAddress) {
    parts.push(clientInfo.ipAddress);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}
