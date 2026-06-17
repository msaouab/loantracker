"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  CircleUser,
  KeyRound,
  LogIn,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Shield,
  Trash2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  formatActivityClientInfo,
  formatActivitySummary,
} from "@/lib/activity-display";
import {
  getActivityActionKey,
  getActivityTabKey,
} from "@/lib/activity-i18n";
import {
  ActivityActions,
  getActivityTabs,
  isSecurityActivity,
  type ActivityTab,
} from "@/lib/activity-log";
import { fetchActivities, type ActivityItem } from "@/lib/activity-client";
import { fetchAdminUsers, type AdminUser } from "@/lib/admin-client";
import { ActivityEmptyState } from "@/components/activity/activity-empty-state";
import {
  ActivityFilters,
  type ActivityFilterValues,
} from "@/components/activity/activity-filters";
import { Dropdown } from "@/components/ui/dropdown";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import type { AppLocale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { notifyError } from "@/lib/toast";

const ACTIVITY_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
type ActivityPageSize = (typeof ACTIVITY_PAGE_SIZE_OPTIONS)[number];
const DEFAULT_ACTIVITY_PAGE_SIZE: ActivityPageSize = 20;

function ActivityTablePagination({
  page,
  totalPages,
  total,
  pageSize,
  loading,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: ActivityPageSize;
  loading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: ActivityPageSize) => void;
}) {
  const t = useTranslations("activity");
  const tc = useTranslations("common");

  if (total <= 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <Button
        variant="outline"
        className="w-full sm:w-auto"
        disabled={page <= 1 || loading}
        onClick={() => onPageChange(page - 1)}
      >
        {tc("previous")}
      </Button>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
        <div className="flex items-center justify-center gap-2 sm:justify-start">
          <span
            id="activity-page-size-label"
            className="text-sm whitespace-nowrap text-muted-foreground"
          >
            {t("rowsPerPage")}
          </span>
          <Dropdown
            id="activity-page-size"
            aria-label={t("rowsPerPage")}
            value={String(pageSize)}
            options={ACTIVITY_PAGE_SIZE_OPTIONS.map((size) => ({
              value: String(size),
              label: String(size),
            }))}
            onValueChange={(value) => {
              onPageSizeChange(Number(value) as ActivityPageSize);
            }}
            className="h-8 w-16"
            disabled={loading}
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {t("pageOf", { page, totalPages })}
        </span>
      </div>

      <Button
        variant="outline"
        className="w-full sm:w-auto"
        disabled={page >= totalPages || loading}
        onClick={() => onPageChange(page + 1)}
      >
        {tc("next")}
      </Button>
    </div>
  );
}

function ActivityActionIcon({
  action,
  className,
}: {
  action: string;
  className?: string;
}) {
  switch (action) {
    case ActivityActions.AUTH_LOGIN:
      return <LogIn className={className} />;
    case ActivityActions.AUTH_PASSWORD_CHANGED:
      return <KeyRound className={className} />;
    case ActivityActions.PROFILE_UPDATED:
      return <CircleUser className={className} />;
    case ActivityActions.LOAN_CREATED:
    case ActivityActions.USER_CREATED:
      return <Plus className={className} />;
    case ActivityActions.LOAN_RESTORED:
      return <RotateCcw className={className} />;
    case ActivityActions.LOAN_UPDATED:
    case ActivityActions.PAYMENT_UPDATED:
      return <Pencil className={className} />;
    case ActivityActions.LOAN_DELETED:
    case ActivityActions.LOANS_PURGED:
    case ActivityActions.RECOVERED_LOANS_PURGED:
    case ActivityActions.PAYMENT_DELETED:
    case ActivityActions.USER_DELETED:
      return <Trash2 className={className} />;
    case ActivityActions.PAYMENT_ADDED:
      return <Wallet className={className} />;
    case ActivityActions.USER_APPROVED:
    case ActivityActions.USER_FROZEN:
    case ActivityActions.USER_UNFROZEN:
      return <Shield className={className} />;
    default:
      return <RefreshCw className={className} />;
  }
}

function getActivityDisplay(
  item: ActivityItem,
  locale: AppLocale,
  t: ReturnType<typeof useTranslations<"activity">>
) {
  const deviceLabels = {
    desktop: t("deviceDesktop"),
    mobile: t("deviceMobile"),
    tablet: t("deviceTablet"),
  };
  const clientInfo = formatActivityClientInfo(item, locale, deviceLabels);
  const summary = formatActivitySummary(item, locale, t);

  return {
    actionLabel: t(getActivityActionKey(item.action)),
    details: isSecurityActivity(item.action) ? clientInfo : summary,
    loanHref:
      item.entityType === "loan" && item.entityId ? `/loans/${item.entityId}` : null,
  };
}

function ActivityRow({
  item,
  showActor,
}: {
  item: ActivityItem;
  showActor: boolean;
}) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("activity");
  const { actionLabel, details, loanHref } = getActivityDisplay(item, locale, t);

  return (
    <div className="flex gap-3 px-4 py-3 sm:px-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <ActivityActionIcon action={item.action} className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {actionLabel}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDateTime(item.createdAt, locale, "MMM d, yyyy · h:mm a")}
          </span>
        </div>
        <p className="text-sm leading-snug">{details}</p>
        {showActor && item.actorName ? (
          <p className="text-xs text-muted-foreground">
            {t("byActor", { actorName: item.actorName })}
          </p>
        ) : null}
        {loanHref ? (
          <Link href={loanHref} className="text-xs font-medium text-primary hover:underline">
            {t("viewLoan")}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function ActivityTableRow({
  item,
  showActor,
}: {
  item: ActivityItem;
  showActor: boolean;
}) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("activity");
  const { actionLabel, details, loanHref } = getActivityDisplay(item, locale, t);

  return (
    <TableRow>
      <TableCell className="w-12 p-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground"
          aria-label={actionLabel}
        >
          <ActivityActionIcon action={item.action} className="h-4 w-4" />
        </span>
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {formatDateTime(item.createdAt, locale, "MMM d, yyyy · h:mm a")}
      </TableCell>
      <TableCell className="font-medium">{actionLabel}</TableCell>
      <TableCell className="max-w-md">
        <p className="text-sm leading-snug">{details}</p>
        {loanHref ? (
          <Link href={loanHref} className="text-xs font-medium text-primary hover:underline">
            {t("viewLoan")}
          </Link>
        ) : null}
      </TableCell>
      {showActor ? (
        <TableCell className="whitespace-nowrap">
          {item.actorName ?? "—"}
        </TableCell>
      ) : null}
    </TableRow>
  );
}

type ActivityFeedProps = {
  /** Admin role → admin-scoped tabs (no loans/payments, adds users). */
  admin?: boolean;
  /** Org-wide audit view → fetch all users' activity and show the actor. */
  orgWide?: boolean;
  /** Admin view of a specific user's activity (manager-style tabs + location copy). */
  userId?: string;
  embedded?: boolean;
  layout?: "list" | "table";
  title?: string;
  description?: string;
};

export function ActivityFeed({
  admin = false,
  orgWide = false,
  userId,
  embedded = false,
  layout = "list",
  title,
  description,
}: ActivityFeedProps) {
  const t = useTranslations("activity");
  const tc = useTranslations("common");
  const tabs = getActivityTabs(admin);
  const [activeTab, setActiveTab] = useState<ActivityTab>("all");
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<ActivityPageSize>(DEFAULT_ACTIVITY_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ActivityFilterValues>({
    search: "",
    dateFrom: "",
    dateTo: "",
    actorUserIds: [],
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [managers, setManagers] = useState<AdminUser[]>([]);

  const displayTitle = title ?? t("title");
  const displayDescription = description ?? t("description");

  const categoryFilter = activeTab;
  const showActor = orgWide;
  const showAdminFilters = orgWide && !userId && layout === "table";
  const tableColumnCount = showActor ? 5 : 4;
  const hasActiveFilters = Boolean(
    filters.search ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.actorUserIds.length > 0
  );

  const fetchParams = useMemo(
    () => ({
      page,
      pageSize,
      admin: orgWide,
      userId,
      category: categoryFilter,
      search: debouncedSearch || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      actorUserIds:
        showAdminFilters && filters.actorUserIds.length > 0
          ? filters.actorUserIds
          : undefined,
    }),
    [
      page,
      pageSize,
      orgWide,
      userId,
      categoryFilter,
      debouncedSearch,
      filters.dateFrom,
      filters.dateTo,
      filters.actorUserIds,
      showAdminFilters,
    ]
  );

  const applyActivityData = useCallback((data: Awaited<ReturnType<typeof fetchActivities>>) => {
    setActivities(data.activities);
    setTotalPages(data.pagination.totalPages);
    setTotal(data.pagination.total);
  }, []);

  const refreshActivities = useCallback(async () => {
    setLoading(true);

    try {
      const data = await fetchActivities(fetchParams);
      applyActivityData(data);
    } catch (err) {
      notifyError(err, t("failedLoad"));
    } finally {
      setLoading(false);
    }
  }, [fetchParams, applyActivityData, t]);

  useEffect(() => {
    if (!showAdminFilters) {
      return;
    }

    let cancelled = false;

    fetchAdminUsers()
      .then((users) => {
        if (!cancelled) {
          setManagers(users);
        }
      })
      .catch(() => {
        // User filter stays on "All users" if the list fails to load.
      });

    return () => {
      cancelled = true;
    };
  }, [showAdminFilters]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [filters.search]);

  useEffect(() => {
    let cancelled = false;

    void fetchActivities(fetchParams)
      .then((data) => {
        if (cancelled) return;
        applyActivityData(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        notifyError(err, t("failedLoad"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchParams, applyActivityData, t]);

  function goToPage(nextPage: number) {
    setLoading(true);
    setPage(nextPage);
  }

  function changePageSize(nextPageSize: ActivityPageSize) {
    if (nextPageSize === pageSize) {
      return;
    }

    setLoading(true);
    setPageSize(nextPageSize);
    setPage(1);
  }

  function selectTab(tab: ActivityTab) {
    if (tab === activeTab) {
      return;
    }
    setLoading(true);
    setActiveTab(tab);
    setPage(1);
  }

  function sameUserIds(a: string[], b: string[]) {
    if (a.length !== b.length) {
      return false;
    }

    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((id, index) => id === sortedB[index]);
  }

  function handleFiltersChange(next: ActivityFilterValues) {
    const searchOnly =
      next.search !== filters.search &&
      next.dateFrom === filters.dateFrom &&
      next.dateTo === filters.dateTo &&
      sameUserIds(next.actorUserIds, filters.actorUserIds);

    setFilters(next);
    setPage(1);

    if (!searchOnly) {
      setLoading(true);
    }
  }

  const adminFiltersBar = showAdminFilters ? (
    <ActivityFilters
      values={filters}
      users={managers}
      onChange={handleFiltersChange}
    />
  ) : null;

  const eventsCountLabel = `${t("eventsCount", { count: total })}${
    hasActiveFilters ? t("matchingFilters") : ""
  }`;

  const tabBar = (
    <div className="overflow-x-auto px-4 py-3 sm:px-5">
      <div
        role="tablist"
        aria-label={t("tablistAria")}
        className="inline-flex min-w-full gap-0.5 rounded-lg border border-border/70 bg-muted/50 p-0.5 sm:min-w-0"
      >
        {tabs.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => selectTab(tab.id)}
              className={cn(
                "shrink-0 rounded-md px-2.5 py-1.5 text-sm font-medium transition-all sm:px-3",
                selected
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t(getActivityTabKey(tab.id))}
            </button>
          );
        })}
      </div>
    </div>
  );

  const listContent =
    layout === "table" ? (
      <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12" />
              <TableHead>{t("columnWhen")}</TableHead>
              <TableHead>{t("columnAction")}</TableHead>
              <TableHead>{t("columnDetails")}</TableHead>
              {showActor ? <TableHead>{t("columnUser")}</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && activities.length === 0
              ? Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: tableColumnCount }).map((__, cellIndex) => (
                      <TableCell key={cellIndex} className={cellIndex === 0 ? "w-12 p-2" : undefined}>
                        <Skeleton
                          className={cn(
                            "h-5 w-full max-w-32",
                            cellIndex === 0 && "h-8 w-8 max-w-none rounded-lg"
                          )}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : null}

            {!loading && activities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={tableColumnCount} className="h-32 p-0">
                  <ActivityEmptyState admin={admin} tab={activeTab} />
                </TableCell>
              </TableRow>
            ) : null}

            {!loading
              ? activities.map((item) => (
                  <ActivityTableRow
                    key={item.id}
                    item={item}
                    showActor={showActor}
                  />
                ))
              : activities.length > 0
                ? Array.from({ length: Math.min(pageSize, 5) }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: tableColumnCount }).map((__, cellIndex) => (
                        <TableCell
                          key={cellIndex}
                          className={cellIndex === 0 ? "w-12 p-2" : undefined}
                        >
                          <Skeleton
                            className={cn(
                              "h-5 w-full max-w-32",
                              cellIndex === 0 && "h-8 w-8 max-w-none rounded-lg"
                            )}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : null}
          </TableBody>
        </Table>

        <ActivityTablePagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          loading={loading}
          onPageChange={goToPage}
          onPageSizeChange={changePageSize}
        />
      </>
    ) : (
    <>
      {loading && activities.length === 0 ? (
        <div className="space-y-0 divide-y divide-border/60">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex gap-3 px-4 py-3 sm:px-5">
              <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full max-w-md animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <ActivityEmptyState admin={admin} tab={activeTab} />
      ) : (
        <div className="divide-y divide-border/60">
          {activities.map((item) => (
            <ActivityRow key={item.id} item={item} showActor={showActor} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <>
          <Separator />
          <div className="flex items-center justify-between gap-3 p-4 sm:px-5">
            <p className="text-sm text-muted-foreground">
              {t("pageOf", { page, totalPages })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => goToPage(Math.max(1, page - 1))}
              >
                {tc("previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => goToPage(page + 1)}
              >
                {tc("next")}
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </>
    );

  if (embedded) {
    return (
      <Card
        id="activity"
        className="surface-card border-0 ring-1 ring-foreground/10"
      >
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div className="space-y-1">
            <CardTitle>{displayTitle}</CardTitle>
            <CardDescription>{displayDescription}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => refreshActivities()}
            disabled={loading}
            aria-label={t("refreshAria")}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            <span className="hidden sm:inline">{tc("refresh")}</span>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Separator />
          {tabBar}
          {showAdminFilters ? (
            <>
              <Separator />
              {adminFiltersBar}
            </>
          ) : null}
          <Separator />
          <div className="flex items-center justify-between px-4 py-3 sm:px-5">
            <p className="text-sm text-muted-foreground">{eventsCountLabel}</p>
          </div>
          <Separator />
          {listContent}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="surface-card overflow-hidden">
        <div className="flex items-start justify-between gap-3 p-4 sm:items-center sm:px-5 sm:py-2.5">
          <div className="min-w-0 space-y-0.5">
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">{displayTitle}</h1>
            <p className="text-sm text-muted-foreground">{displayDescription}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="size-8 shrink-0 p-0 sm:h-8 sm:w-auto sm:gap-1.5 sm:px-3"
            onClick={() => refreshActivities()}
            disabled={loading}
            aria-label={t("refreshAria")}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            <span className="hidden sm:inline">{tc("refresh")}</span>
          </Button>
        </div>
        <Separator />
        {tabBar}
        {showAdminFilters ? (
          <>
            <Separator />
            {adminFiltersBar}
          </>
        ) : null}
        <Separator />
        <div className="flex items-center justify-between px-4 py-3 sm:px-5">
          <p className="text-sm text-muted-foreground">{eventsCountLabel}</p>
        </div>
        <Separator />
        {listContent}
      </div>
    </div>
  );
}
