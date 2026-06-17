"use client";

import { useMemo } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Dropdown } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import type { AdminUser } from "@/lib/admin-client";
import { cn } from "@/lib/utils";

export type ActivityFilterValues = {
  search: string;
  dateFrom: string;
  dateTo: string;
  actorUserIds: string[];
};

type ActivityFiltersProps = {
  values: ActivityFilterValues;
  users: AdminUser[];
  loadingUsers?: boolean;
  onChange: (values: ActivityFilterValues) => void;
  className?: string;
};

export function ActivityFilters({
  values,
  users,
  loadingUsers = false,
  onChange,
  className,
}: ActivityFiltersProps) {
  const t = useTranslations("activity");

  const userOptions = useMemo(
    () =>
      users
        .filter((user) => !user.isAdmin)
        .map((user) => ({ value: user.id, label: user.fullName })),
    [users]
  );

  function patch(partial: Partial<ActivityFilterValues>) {
    onChange({ ...values, ...partial });
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:px-5",
        className
      )}
    >
      <div className="relative min-w-0 flex-1 sm:min-w-48 sm:max-w-md">
        <Search className="absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-10 border-border/70 bg-muted/20 ps-9"
          placeholder={t("searchPlaceholder")}
          value={values.search}
          onChange={(event) => patch({ search: event.target.value })}
        />
      </div>

      <DateRangePicker
        from={values.dateFrom}
        to={values.dateTo}
        onFromChange={(dateFrom) => patch({ dateFrom })}
        onToChange={(dateTo) => patch({ dateTo })}
        onClear={() => patch({ dateFrom: "", dateTo: "" })}
      />

      <div className="min-w-0 flex-1 sm:max-w-56">
        <Dropdown
          mode="multiple"
          id="activity-user-filter"
          aria-label={t("filterUser")}
          values={values.actorUserIds}
          options={userOptions}
          placeholder={t("filterAllUsers")}
          clearLabel={t("filterAllUsers")}
          disabled={loadingUsers}
          onValuesChange={(actorUserIds) => patch({ actorUserIds })}
          getTriggerLabel={(selected) => {
            if (selected.length === 0) {
              return t("filterAllUsers");
            }

            if (selected.length === 1) {
              return String(selected[0].label);
            }

            return t("filterUsersSelected", { count: selected.length });
          }}
        />
      </div>
    </div>
  );
}
