"use client";

import Link from "next/link";
import { CircleCheck, Receipt, SearchX } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { LoanStatus } from "@/lib/loan-status";
import { cn } from "@/lib/utils";

type LoanEmptyStateProps = {
  status: LoanStatus;
  message: string;
  hasActiveFilters: boolean;
  onClearFilters?: () => void;
};

const iconStyles = {
  filtered: {
    icon: SearchX,
    wrapper: "bg-muted text-muted-foreground",
    ring: "ring-muted/60",
  },
  active: {
    icon: Receipt,
    wrapper: "bg-primary/10 text-primary",
    ring: "ring-primary/20",
  },
  recovered: {
    icon: CircleCheck,
    wrapper: "bg-success/10 text-success",
    ring: "ring-success/25",
  },
} as const;

function getVariant(status: LoanStatus, hasActiveFilters: boolean) {
  if (hasActiveFilters) return "filtered";
  if (status === "completed") return "recovered";
  return "active";
}

export function LoanEmptyState({
  status,
  message,
  hasActiveFilters,
  onClearFilters,
}: LoanEmptyStateProps) {
  const t = useTranslations("loans");
  const variant = getVariant(status, hasActiveFilters);
  const { icon: Icon, wrapper, ring } = iconStyles[variant];

  const title = hasActiveFilters
    ? t("noMatching")
    : status === "completed"
      ? t("nothingRecovered")
      : t("noActive");

  const description = hasActiveFilters ? t("filteredDescription") : message;

  return (
    <div className="surface-card overflow-hidden">
      <div className="flex flex-col items-center justify-center px-6 py-14 text-center sm:py-16">
        <div
          className={cn(
            "mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ring-4",
            wrapper,
            ring
          )}
        >
          <Icon className="h-7 w-7" strokeWidth={1.75} />
        </div>

        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {hasActiveFilters && onClearFilters ? (
            <Button variant="outline" onClick={onClearFilters}>
              {t("clearFilters")}
            </Button>
          ) : null}

          {!hasActiveFilters && status === "active" ? (
            <Button variant="outline" asChild>
              <Link href="/loans/recovered">{t("viewRecovered")}</Link>
            </Button>
          ) : null}

          {!hasActiveFilters && status === "completed" ? (
            <Button variant="outline" asChild>
              <Link href="/loans">{t("viewActiveLoans")}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
