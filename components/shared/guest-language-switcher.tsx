"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useTransition } from "react";
import { Dropdown } from "@/components/ui/dropdown";
import { LOCALE_LABELS, LOCALES, type AppLocale } from "@/lib/locale";
import { notifyError, notifySuccess } from "@/lib/toast";

/** Language picker for unauthenticated pages (cookie only, no API). */
export function GuestLanguageSwitcher() {
  const ts = useTranslations("settings");
  const tc = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const options = useMemo(
    () =>
      LOCALES.map((code) => ({
        value: code,
        label: LOCALE_LABELS[code],
      })),
    []
  );

  async function handleChange(nextLocale: AppLocale) {
    if (nextLocale === locale || pending) return;

    try {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: nextLocale }),
      });
      notifySuccess(ts("localeUpdated"));
      startTransition(() => router.refresh());
    } catch (error) {
      notifyError(error, ts("failedUpdateLocale"));
    }
  }

  return (
    <Dropdown
      trigger="icon"
      icon={Languages}
      align="end"
      matchTriggerWidth={false}
      value={locale}
      options={options}
      disabled={pending}
      aria-label={tc("language")}
      onValueChange={(next) => handleChange(next as AppLocale)}
    />
  );
}
