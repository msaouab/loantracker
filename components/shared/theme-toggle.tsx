"use client";

import { useTheme } from "@/components/theme-provider";
import { useMounted } from "@/hooks/use-mounted";
import type { Theme } from "@/lib/theme";
import { useTranslations } from "next-intl";
import { Laptop, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themes = [
  { value: "light", labelKey: "light" as const, icon: Sun },
  { value: "dark", labelKey: "dark" as const, icon: Moon },
  { value: "system", labelKey: "system" as const, icon: Laptop },
] as const;

export function ThemeMenuItems() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("theme");

  return (
    <>
      <DropdownMenuLabel>{t("theme")}</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={theme}
        onValueChange={(value) => setTheme(value as Theme)}
      >
        {themes.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuRadioItem key={item.value} value={item.value}>
              <Icon className="me-2 h-4 w-4" />
              {t(item.labelKey)}
            </DropdownMenuRadioItem>
          );
        })}
      </DropdownMenuRadioGroup>
    </>
  );
}

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();
  const t = useTranslations("theme");

  const ActiveIcon =
    !mounted || theme === "system"
      ? Laptop
      : resolvedTheme === "dark"
        ? Moon
        : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          className="border-border/70 bg-background/80"
          aria-label={t("toggleAria")}
        >
          <ActiveIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {themes.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem
              key={item.value}
              onClick={() => setTheme(item.value)}
              className={theme === item.value ? "bg-accent" : undefined}
            >
              <Icon className="me-2 h-4 w-4" />
              {t(item.labelKey)}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
