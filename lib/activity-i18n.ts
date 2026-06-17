import type { ActivityAction } from "@/lib/activity-log";

/** Maps activity action codes to next-intl keys under the `activity` namespace. */
export function getActivityActionKey(action: string): string {
  return `action_${action.replace(/\./g, "_")}` as `action_${ActivityAction}`;
}

export type ActivityTabKey =
  | "tabAll"
  | "tabSecurity"
  | "tabLoans"
  | "tabPayments"
  | "tabAccount"
  | "tabUsers";

export function getActivityTabKey(tab: string): ActivityTabKey {
  const map: Record<string, ActivityTabKey> = {
    all: "tabAll",
    security: "tabSecurity",
    loans: "tabLoans",
    payments: "tabPayments",
    account: "tabAccount",
    users: "tabUsers",
  };
  return map[tab] ?? "tabAll";
}

export function getActivityEmptyKey(tab: string, admin: boolean): string {
  if (tab === "all") return admin ? "emptyAllAdmin" : "emptyAllManager";
  const map: Record<string, string> = {
    security: "emptySecurity",
    loans: "emptyLoans",
    payments: "emptyPayments",
    account: "emptyAccount",
    users: "emptyUsers",
  };
  return map[tab] ?? "emptyAllManager";
}
