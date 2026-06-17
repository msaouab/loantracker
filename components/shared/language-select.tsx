"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LOCALE_LABELS, LOCALES, type AppLocale } from "@/lib/locale";
import { notifyError, notifySuccess } from "@/lib/toast";
import { request } from "@/lib/api-client";

export function LanguageSelect({ initialLocale }: { initialLocale: AppLocale }) {
  const t = useTranslations("common");
  const ts = useTranslations("settings");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const value = locale || initialLocale;

  async function handleChange(nextLocale: string) {
    if (nextLocale === value || pending) return;

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
    <div className="space-y-2">
      <Label>{t("language")}</Label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between" disabled={pending}>
            {LOCALE_LABELS[value]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
          <DropdownMenuRadioGroup value={value} onValueChange={handleChange}>
            {LOCALES.map((code) => (
              <DropdownMenuRadioItem key={code} value={code}>
                {LOCALE_LABELS[code]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <p className="text-xs text-muted-foreground">{t("languageDescription")}</p>
    </div>
  );
}
