"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Languages } from "lucide-react";
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LOCALE_LABELS, LOCALES, type AppLocale } from "@/lib/locale";
import { notifyError, notifySuccess } from "@/lib/toast";
import { request } from "@/lib/api-client";

export function LanguageMenuItems() {
  const t = useTranslations("common");
  const ts = useTranslations("settings");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleChange(nextLocale: string) {
    if (nextLocale === locale || pending) return;

    try {
      await request<{ locale: string }>(
        "/api/settings/locale",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: nextLocale }),
        },
        ts("failedUpdateLocale")
      );
      notifySuccess(ts("localeUpdated"));
      startTransition(() => router.refresh());
    } catch (error) {
      notifyError(error, ts("failedUpdateLocale"));
    }
  }

  return (
    <>
      <DropdownMenuLabel>{t("language")}</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={locale} onValueChange={handleChange}>
        {LOCALES.map((code) => (
          <DropdownMenuRadioItem key={code} value={code} disabled={pending}>
            <Languages className="me-2 h-4 w-4" />
            {LOCALE_LABELS[code]}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
      <DropdownMenuSeparator />
    </>
  );
}
