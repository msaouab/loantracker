import { format, formatDistanceToNow } from "date-fns";
import { arMA, enUS, fr } from "date-fns/locale";
import { getIntlLocale, type AppLocale } from "@/lib/locale";

const DATE_FNS_LOCALES = {
  en: enUS,
  fr,
  ar: arMA,
} as const;

export function getDateFnsLocale(locale: AppLocale) {
  return DATE_FNS_LOCALES[locale];
}

export function formatCurrency(amount: number, locale: AppLocale) {
  const formatted = new Intl.NumberFormat(getIntlLocale(locale), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return `${formatted} DH`;
}

export function formatDate(
  date: Date | string,
  locale: AppLocale,
  pattern = "MMM d, yyyy"
) {
  const value = typeof date === "string" ? new Date(date) : date;
  return format(value, pattern, { locale: getDateFnsLocale(locale) });
}

export function formatDateTime(
  date: Date | string,
  locale: AppLocale,
  pattern = "MMM d, yyyy h:mm a"
) {
  return formatDate(date, locale, pattern);
}

/** Locale-aware relative time, e.g. "5 minutes ago" / "il y a 5 minutes". */
export function formatRelativeTime(date: Date | string, locale: AppLocale) {
  const value = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(value, {
    locale: getDateFnsLocale(locale),
    addSuffix: true,
  });
}

export function formatRecoveredRetention(
  recoveredAt: string | null,
  locale: AppLocale,
  labels: {
    today: string;
    daysAgo: string | ((count: number) => string);
    oneDayAgo: string;
    deletesToday: string;
    daysLeft: string | ((count: number) => string);
    oneDayLeft: string;
  }
) {
  if (!recoveredAt) {
    return null;
  }

  const recovered = new Date(recoveredAt);
  const ms = Date.now() - recovered.getTime();
  const daysAgo = Math.floor(ms / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, 30 - daysAgo);

  const agoLabel =
    daysAgo === 0
      ? labels.today
      : daysAgo === 1
        ? labels.oneDayAgo
        : typeof labels.daysAgo === "function"
          ? labels.daysAgo(daysAgo)
          : labels.daysAgo.replace("{count}", String(daysAgo));
  const purgeLabel =
    daysLeft === 0
      ? labels.deletesToday
      : daysLeft === 1
        ? labels.oneDayLeft
        : typeof labels.daysLeft === "function"
          ? labels.daysLeft(daysLeft)
          : labels.daysLeft.replace("{count}", String(daysLeft));

  return `${agoLabel} · ${purgeLabel}`;
}
