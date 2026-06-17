"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { LanguageIconPicker } from "@/components/shared/language-icon-picker";
import type { AppLocale } from "@/lib/locale";
import { notifyError, notifySuccess } from "@/lib/toast";

/** Language picker for unauthenticated pages (cookie only, no API). */
export function GuestLanguageSwitcher() {
  const ts = useTranslations("settings");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

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
    <LanguageIconPicker
      value={locale}
      onChange={handleChange}
      disabled={pending}
    />
  );
}
