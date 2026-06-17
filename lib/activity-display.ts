import type { ActivityItem } from "@/lib/activity-client";
import { ActivityActions } from "@/lib/activity-log";
import {
  deviceMetadataFromRecord,
  type DeviceType,
} from "@/lib/client-info";
import { formatCurrency } from "@/lib/format";
import type { AppLocale } from "@/lib/locale";

type ActivityTranslator = (
  key: string,
  values?: Record<string, string | number | Date>
) => string;

type DeviceLabels = {
  desktop: string;
  mobile: string;
  tablet: string;
};

function metaString(metadata: Record<string, unknown> | null, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : null;
}

function metaNumber(metadata: Record<string, unknown> | null, key: string) {
  const value = metadata?.[key];
  return typeof value === "number" ? value : null;
}

function matchSummary(summary: string, pattern: RegExp) {
  return summary.match(pattern);
}

function extractClientName(item: ActivityItem) {
  const fromMeta = metaString(item.metadata, "clientName");
  if (fromMeta) return fromMeta;

  const patterns = [
    /^(?:Created|Deleted|Updated|Restored) loan for (.+?)(?:\s*\(|$)/,
    /^Recorded (?:final )?payment for (.+?)(?:\s*\(|$)/,
    /^Recorded .+ payment for (.+)$/,
    /^Updated payment to .+ for (.+)$/,
    /^Deleted .+ payment for (.+)$/,
  ];

  for (const pattern of patterns) {
    const match = matchSummary(item.summary, pattern);
    if (match?.[1]) return match[1].trim();
  }

  return null;
}

function extractAmountFromSummary(summary: string) {
  const patterns = [
    /^Recorded (.+?) payment for /,
    /^Updated payment to (.+?) for /,
    /^Deleted (.+?) payment for /,
  ];

  for (const pattern of patterns) {
    const match = summary.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  return null;
}

function extractDisplayName(item: ActivityItem) {
  const fromMeta = metaString(item.metadata, "fullName");
  if (fromMeta) return fromMeta;

  const patterns = [
    /^Approved account for (.+)$/,
    /^Froze account for (.+)$/,
    /^Unfroze account for (.+)$/,
    /^Deleted account for (.+)$/,
    /^Created account for (.+)$/,
    /^Reset password for (.+)$/,
    /^Changed display name to "(.+)"$/,
    /^Updated (.+):/,
  ];

  for (const pattern of patterns) {
    const match = matchSummary(item.summary, pattern);
    if (match?.[1]) return match[1].trim();
  }

  return null;
}

function formatLanguageTag(language: string, locale: AppLocale) {
  try {
    const primary = language.split("-")[0];
    const display = new Intl.DisplayNames([locale], { type: "language" }).of(primary);
    return display ?? language;
  } catch {
    return language;
  }
}

function formatDeviceType(
  deviceType: DeviceType | null | undefined,
  labels: DeviceLabels
) {
  if (!deviceType) return null;
  return labels[deviceType];
}

export function formatActivityClientInfo(
  item: ActivityItem,
  locale: AppLocale,
  labels: DeviceLabels
) {
  const device = deviceMetadataFromRecord(item.metadata);
  const browser = item.browser ?? device.browser;
  const browserVersion = device.browserVersion;
  const parts: string[] = [];

  if (browser) {
    parts.push(browserVersion ? `${browser} ${browserVersion}` : browser);
  }

  if (device.os) {
    parts.push(device.os);
  }

  const deviceLabel = formatDeviceType(device.deviceType, labels);
  if (deviceLabel) {
    parts.push(deviceLabel);
  }

  if (device.language) {
    parts.push(formatLanguageTag(device.language, locale));
  }

  if (item.ipAddress) {
    parts.push(item.ipAddress);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

export function formatActivitySummary(
  item: ActivityItem,
  locale: AppLocale,
  t: ActivityTranslator
) {
  const metadata = item.metadata;
  const clientName = extractClientName(item);
  const displayName = extractDisplayName(item);
  const totalAmount = metaNumber(metadata, "totalAmount");
  const previousName = metaString(metadata, "previousName");
  const purgedCount = metaNumber(metadata, "count");

  switch (item.action) {
    case ActivityActions.LOAN_CREATED:
      if (clientName && totalAmount != null) {
        return t("summaryLoanCreated", {
          clientName,
          amount: formatCurrency(totalAmount, locale),
        });
      }
      break;
    case ActivityActions.LOAN_DELETED:
      if (clientName && totalAmount != null) {
        return t("summaryLoanDeleted", {
          clientName,
          amount: formatCurrency(totalAmount, locale),
        });
      }
      break;
    case ActivityActions.LOAN_UPDATED:
      if (clientName) {
        return t("summaryLoanUpdated", { clientName });
      }
      break;
    case ActivityActions.LOAN_RESTORED:
      if (clientName && totalAmount != null) {
        return t("summaryLoanRestored", {
          clientName,
          amount: formatCurrency(totalAmount, locale),
        });
      }
      if (clientName) {
        return t("summaryLoanRestoredNoAmount", { clientName });
      }
      break;
    case ActivityActions.PAYMENT_ADDED: {
      const amount =
        extractAmountFromSummary(item.summary) ??
        (metaNumber(metadata, "amount") != null
          ? formatCurrency(metaNumber(metadata, "amount")!, locale)
          : null);
      if (clientName && amount) {
        return t("summaryPaymentAdded", { clientName, amount });
      }
      break;
    }
    case ActivityActions.PAYMENT_UPDATED: {
      const amount = extractAmountFromSummary(item.summary);
      if (clientName && amount) {
        return t("summaryPaymentUpdated", { clientName, amount });
      }
      break;
    }
    case ActivityActions.PAYMENT_DELETED: {
      const amount = extractAmountFromSummary(item.summary);
      if (clientName && amount) {
        return t("summaryPaymentDeleted", { clientName, amount });
      }
      break;
    }
    case ActivityActions.PROFILE_UPDATED:
      if (displayName) {
        return t("summaryProfileUpdated", { name: displayName });
      }
      if (previousName) {
        return t("summaryProfileUpdated", { name: previousName });
      }
      break;
    case ActivityActions.USER_APPROVED:
      if (displayName) return t("summaryUserApproved", { name: displayName });
      break;
    case ActivityActions.USER_FROZEN:
      if (displayName) return t("summaryUserFrozen", { name: displayName });
      break;
    case ActivityActions.USER_UNFROZEN:
      if (displayName) return t("summaryUserUnfrozen", { name: displayName });
      break;
    case ActivityActions.USER_DELETED:
      if (displayName) return t("summaryUserDeleted", { name: displayName });
      break;
    case ActivityActions.USER_CREATED:
      if (displayName) return t("summaryUserCreated", { name: displayName });
      break;
    case ActivityActions.USER_PASSWORD_RESET:
      if (displayName) return t("summaryUserPasswordReset", { name: displayName });
      break;
    case ActivityActions.LOANS_PURGED:
      if (purgedCount != null) {
        return t("summaryLoansPurged", { count: purgedCount });
      }
      break;
    case ActivityActions.RECOVERED_LOANS_PURGED:
      if (purgedCount != null) {
        return t("summaryRecoveredLoansPurged", { count: purgedCount });
      }
      break;
  }

  return item.summary;
}
