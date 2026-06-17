import { request } from "@/lib/api-client";

export type ActivityItem = {
  id: string;
  userId: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  summary: string;
  ipAddress: string | null;
  userAgent: string | null;
  browser: string | null;
  clientInfo: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actorName: string | null;
  actorEmail: string | null;
};

export type ActivityListResponse = {
  activities: ActivityItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

import type { ActivityTab } from "@/lib/activity-log";

export async function fetchActivities(params: {
  page?: number;
  pageSize?: number;
  category?: ActivityTab;
  admin?: boolean;
  /** Route to a specific user's activity feed (admin user profile). */
  userId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  /** Org-wide admin feed: filter by one or more actor user ids. */
  actorUserIds?: string[];
}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
  if (params.category && params.category !== "all") {
    searchParams.set("category", params.category);
  }
  if (params.search) searchParams.set("search", params.search);
  if (params.dateFrom) searchParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) searchParams.set("dateTo", params.dateTo);
  if (params.actorUserIds?.length) {
    for (const actorUserId of params.actorUserIds) {
      searchParams.append("userId", actorUserId);
    }
  }

  const base = params.userId
    ? `/api/admin/users/${params.userId}/activity`
    : params.admin
      ? "/api/admin/activity"
      : "/api/activity";
  const query = searchParams.toString();
  const url = query ? `${base}?${query}` : base;

  return request<ActivityListResponse>(url, {}, "Failed to load activity");
}
