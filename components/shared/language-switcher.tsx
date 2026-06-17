"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LanguageIconPicker } from "@/components/shared/language-icon-picker";
import type { AppLocale } from "@/lib/locale";
import { notifyError, notifySuccess } from "@/lib/toast";
import { request } from "@/lib/api-client";

export function LanguageMenuItems() {
  const t = useTranslations("common");
  const ts = useTranslations("settings");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleChange(nextLocale: AppLocale) {
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
      <div className="px-2 pb-2">
        <LanguageIconPicker
          value={locale}
          onChange={handleChange}
          disabled={pending}
        />
      </div>
      <DropdownMenuSeparator />
    </>
  );
}
