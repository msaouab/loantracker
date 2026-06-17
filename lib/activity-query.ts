import type { Prisma } from "@/app/generated/prisma/client";
import type { ActivityTab } from "@/lib/activity-log";
import { endOfDay, parseDateParam, startOfDay } from "@/lib/dates";

const ACTIVITY_TABS: ActivityTab[] = [
  "all",
  "security",
  "loans",
  "payments",
  "account",
  "users",
];

export function parseActivityCategory(value: string | null): ActivityTab | undefined {
  if (!value) {
    return undefined;
  }

  const category = value.trim() as ActivityTab;
  return ACTIVITY_TABS.includes(category) && category !== "all" ? category : undefined;
}

export function parseActivitySearch(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export function parseActivityUserIds(
  values: string | string[] | null | undefined
): string[] | undefined {
  const raw = Array.isArray(values) ? values : values ? [values] : [];
  const ids = [...new Set(raw.map((value) => value.trim()).filter(Boolean))];
  return ids.length ? ids : undefined;
}

export function getActivityDateWhere(
  dateFrom: string | null | undefined,
  dateTo: string | null | undefined
): Prisma.ActivityLogWhereInput | undefined {
  const from = parseDateParam(dateFrom ?? null);
  const to = parseDateParam(dateTo ?? null);

  if (!from && !to) {
    return undefined;
  }

  const createdAt: Prisma.DateTimeFilter = {};

  if (from) {
    createdAt.gte = startOfDay(from);
  }

  if (to) {
    createdAt.lte = endOfDay(to);
  }

  return { createdAt };
}
