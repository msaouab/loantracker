"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
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
  ACTIVITY_ACTION_LABELS,
  ActivityActions,
  getActivityTabs,
  isSecurityActivity,
  type ActivityAction,
  type ActivityTab,
} from "@/lib/activity-log";
import { fetchActivities, type ActivityItem } from "@/lib/activity-client";
import { ActivityEmptyState } from "@/components/activity/activity-empty-state";
import { cn } from "@/lib/utils";
import { notifyError } from "@/lib/toast";

function getActionLabel(action: string) {
  return ACTIVITY_ACTION_LABELS[action as ActivityAction] ?? action;
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

function ActivityRow({
  item,
  showActor,
}: {
  item: ActivityItem;
  showActor: boolean;
}) {
  const loanHref =
    item.entityType === "loan" && item.entityId ? `/loans/${item.entityId}` : null;

  return (
    <div className="flex gap-3 px-4 py-3 sm:px-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <ActivityActionIcon action={item.action} className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {getActionLabel(item.action)}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(item.createdAt), "MMM d, yyyy · h:mm a")}
          </span>
        </div>
        <p className="text-sm leading-snug">
          {isSecurityActivity(item.action) && item.clientInfo
            ? item.clientInfo
            : item.summary}
        </p>
        {showActor && item.actorName ? (
          <p className="text-xs text-muted-foreground">By {item.actorName}</p>
        ) : null}
        {loanHref ? (
          <Link href={loanHref} className="text-xs font-medium text-primary hover:underline">
            View loan
          </Link>
        ) : null}
      </div>
    </div>
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
  title?: string;
  description?: string;
};

export function ActivityFeed({
  admin = false,
  orgWide = false,
  userId,
  embedded = false,
  title = "Activity",
  description = "Your recent actions and sign-in history.",
}: ActivityFeedProps) {
  const tabs = getActivityTabs(admin);
  const [activeTab, setActiveTab] = useState<ActivityTab>("all");
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const categoryFilter = activeTab;

  const applyActivityData = useCallback((data: Awaited<ReturnType<typeof fetchActivities>>) => {
    setActivities(data.activities);
    setTotalPages(data.pagination.totalPages);
    setTotal(data.pagination.total);
  }, []);

  const refreshActivities = useCallback(async () => {
    setLoading(true);

    try {
      const data = await fetchActivities({
        page,
        pageSize: 20,
        admin: orgWide,
        userId,
        category: categoryFilter,
      });
      applyActivityData(data);
    } catch (err) {
      notifyError(err, "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, [orgWide, userId, applyActivityData, categoryFilter, page]);

  useEffect(() => {
    let cancelled = false;

    void fetchActivities({
      page,
      pageSize: 20,
      admin: orgWide,
      userId,
      category: categoryFilter,
    })
      .then((data) => {
        if (cancelled) return;
        applyActivityData(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        notifyError(err, "Failed to load activity");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orgWide, userId, applyActivityData, categoryFilter, page]);

  function goToPage(nextPage: number) {
    setLoading(true);
    setPage(nextPage);
  }

  function selectTab(tab: ActivityTab) {
    if (tab === activeTab) {
      return;
    }
    setLoading(true);
    setActiveTab(tab);
    setPage(1);
  }

  const tabBar = (
    <div className="overflow-x-auto px-4 py-3 sm:px-5">
      <div
        role="tablist"
        aria-label="Activity types"
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
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  const listContent = (
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
            <ActivityRow key={item.id} item={item} showActor={orgWide} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <>
          <Separator />
          <div className="flex items-center justify-between gap-3 p-4 sm:px-5">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => goToPage(Math.max(1, page - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => goToPage(page + 1)}
              >
                Next
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
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => refreshActivities()}
            disabled={loading}
            aria-label="Refresh activity"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Separator />
          {tabBar}
          <Separator />
          <div className="flex items-center justify-between px-4 py-3 sm:px-5">
            <p className="text-sm text-muted-foreground">
              {total} {total === 1 ? "event" : "events"}
            </p>
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
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="size-8 shrink-0 p-0 sm:h-8 sm:w-auto sm:gap-1.5 sm:px-3"
            onClick={() => refreshActivities()}
            disabled={loading}
            aria-label="Refresh activity"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
        <Separator />
        {tabBar}
        <Separator />
        <div className="flex items-center justify-between px-4 py-3 sm:px-5">
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? "event" : "events"}
          </p>
        </div>
        <Separator />
        {listContent}
      </div>
    </div>
  );
}
