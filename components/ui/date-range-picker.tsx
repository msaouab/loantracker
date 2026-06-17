"use client";

import { ArrowRight, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";

type DateRangePickerProps = {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onClear: () => void;
  label?: string;
  className?: string;
};

export function DateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
  onClear,
  label,
  className,
}: DateRangePickerProps) {
  const t = useTranslations("common");
  const hasRange = Boolean(from || to);
  const rangeLabel = label ?? t("dateRange");

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2",
        className
      )}
    >
      <span className="text-sm font-medium text-muted-foreground">{rangeLabel}</span>
      <div className="flex min-w-0 items-center rounded-lg border border-border/70 bg-muted/20">
        <DatePicker
          id="date-range-from"
          value={from}
          onChange={onFromChange}
          placeholder={t("dateFrom")}
          max={to || undefined}
          variant="inline"
          className="min-w-30 flex-1 sm:min-w-35"
        />

        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" aria-hidden />

        <DatePicker
          id="date-range-to"
          value={to}
          onChange={onToChange}
          placeholder={t("dateTo")}
          min={from || undefined}
          variant="inline"
          className="min-w-30 flex-1 sm:min-w-35"
        />

        {hasRange ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="me-1 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onClear}
            aria-label={t("clearDateRange")}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
