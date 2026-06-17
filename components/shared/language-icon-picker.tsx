"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LOCALE_LABELS, LOCALES, type AppLocale } from "@/lib/locale";
import { cn } from "@/lib/utils";

type LanguageIconPickerProps = {
  value: AppLocale;
  onChange: (locale: AppLocale) => void;
  disabled?: boolean;
  className?: string;
};

export function LanguageIconPicker({
  value,
  onChange,
  disabled = false,
  className,
}: LanguageIconPickerProps) {
  const t = useTranslations("common");

  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      role="radiogroup"
      aria-label={t("language")}
    >
      {LOCALES.map((code) => {
        const selected = value === code;
        const label = LOCALE_LABELS[code];

        return (
          <Tooltip key={code}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={label}
                variant={selected ? "default" : "outline"}
                size="sm"
                disabled={disabled}
                className={cn(
                  "min-w-11 font-mono text-xs tracking-wide",
                  !selected && "border-border/70 bg-background/80"
                )}
                onClick={() => onChange(code)}
              >
                {code}
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={6}>{label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
