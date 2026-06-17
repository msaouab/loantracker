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

const DATE_PATTERNS = {
  en: {
    date: "MMM d, yyyy",
    dateTime: "MMM d, yyyy h:mm a",
  },
  fr: {
    date: "MMM d, yyyy",
    dateTime: "MMM d, yyyy HH:mm",
  },
  ar: {
    date: "d MMMM yyyy",
    dateTime: "d MMMM yyyy h:mm a",
  },
} as const satisfies Record<AppLocale, { date: string; dateTime: string }>;

function formatArabicDate(value: Date) {
  return new Intl.DateTimeFormat(getIntlLocale("ar"), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

function formatArabicDateTime(value: Date, pattern: string) {
  const date = formatArabicDate(value);
  const time = new Intl.DateTimeFormat(getIntlLocale("ar"), {
    hour: "numeric",
    minute: "2-digit",
  }).format(value);

  return pattern.includes("·") ? `${date} · ${time}` : `${date} ${time}`;
}

export function getDateDisplayPattern(locale: AppLocale) {
  return DATE_PATTERNS[locale].date;
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
  pattern: string = DATE_PATTERNS[locale].date
) {
  const value = typeof date === "string" ? new Date(date) : date;

  if (locale === "ar") {
    return formatArabicDate(value);
  }

  return format(value, pattern, { locale: getDateFnsLocale(locale) });
}

export function formatDateTime(
  date: Date | string,
  locale: AppLocale,
  pattern: string = DATE_PATTERNS[locale].dateTime
) {
  const value = typeof date === "string" ? new Date(date) : date;

  if (locale === "ar") {
    return formatArabicDateTime(value, pattern);
  }

  return format(value, pattern, { locale: getDateFnsLocale(locale) });
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
