"use client";

import { useTranslations } from "next-intl";
import { ThemeIconPicker } from "@/components/shared/theme-icon-picker";
import { DropdownMenuLabel } from "@/components/ui/dropdown-menu";

export function ThemeMenuItems() {
  const t = useTranslations("theme");

  return (
    <>
      <DropdownMenuLabel>{t("theme")}</DropdownMenuLabel>
      <div className="px-2 pb-2">
        <ThemeIconPicker />
      </div>
    </>
  );
}

export function ThemeToggle() {
  return <ThemeIconPicker />;
}
