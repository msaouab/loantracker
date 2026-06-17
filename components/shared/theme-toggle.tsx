"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useTheme } from "@/components/theme-provider";
import { ThemeIconPicker } from "@/components/shared/theme-icon-picker";
import { Dropdown } from "@/components/ui/dropdown";
import { DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { THEMES, type Theme } from "@/lib/theme";

const THEME_ICONS = {
  light: Sun,
  dark: Moon,
  system: Laptop,
} as const;

const THEME_LABEL_KEYS = {
  light: "light",
  dark: "dark",
  system: "system",
} as const satisfies Record<Theme, "light" | "dark" | "system">;

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
  const { theme, setTheme } = useTheme();
  const t = useTranslations("theme");

  const options = useMemo(
    () =>
      THEMES.map((item) => ({
        value: item,
        label: t(THEME_LABEL_KEYS[item]),
        icon: THEME_ICONS[item],
      })),
    [t]
  );

  return (
    <Dropdown
      trigger="icon"
      align="end"
      matchTriggerWidth={false}
      value={theme}
      options={options}
      aria-label={t("theme")}
      getTriggerIcon={(selected) =>
        THEME_ICONS[(selected?.value as Theme | undefined) ?? theme]
      }
      onValueChange={(next) => setTheme(next as Theme)}
    />
  );
}
