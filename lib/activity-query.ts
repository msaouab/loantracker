import type { ActivityTab } from "@/lib/activity-log";

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
