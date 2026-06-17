"use client";

import { useTranslations } from "next-intl";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { THEMES, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

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

type ThemeIconPickerProps = {
  value?: Theme;
  onChange?: (theme: Theme) => void;
  disabled?: boolean;
  className?: string;
};

export function ThemeIconPicker({
  value: valueProp,
  onChange: onChangeProp,
  disabled = false,
  className,
}: ThemeIconPickerProps) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("theme");
  const value = valueProp ?? theme;
  const onChange = onChangeProp ?? setTheme;

  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      role="radiogroup"
      aria-label={t("theme")}
    >
      {THEMES.map((item) => {
        const selected = value === item;
        const Icon = THEME_ICONS[item];
        const label = t(THEME_LABEL_KEYS[item]);

        return (
          <Tooltip key={item}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={label}
                variant={selected ? "default" : "outline"}
                size="icon-sm"
                disabled={disabled}
                className={cn(!selected && "border-border/70 bg-background/80")}
                onClick={() => onChange(item)}
              >
                <Icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={6}>{label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
