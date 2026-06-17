export const LOCALES = ["en", "fr", "ar"] as const;
export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
};

export function isValidLocale(value: string | null | undefined): value is AppLocale {
  return LOCALES.includes(value as AppLocale);
}

export function getDirection(locale: AppLocale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Pick the best supported locale from Accept-Language. */
export function negotiateLocale(acceptLanguage: string | null): AppLocale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const preferences = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, qPart] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: qPart ? Number(qPart) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of preferences) {
    const primary = tag.split("-")[0];
    if (isValidLocale(primary)) return primary;
    if (isValidLocale(tag)) return tag;
  }

  return DEFAULT_LOCALE;
}

export function getIntlLocale(locale: AppLocale): string {
  switch (locale) {
    case "fr":
      return "fr-MA";
    case "ar":
      return "ar-MA";
    default:
      return "en-US";
  }
}
