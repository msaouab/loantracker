export const ActivityActions = {
  AUTH_LOGIN: "auth.login",
  AUTH_PASSWORD_CHANGED: "auth.password_changed",
  PROFILE_UPDATED: "profile.updated",
  LOAN_CREATED: "loan.created",
  LOAN_UPDATED: "loan.updated",
  LOAN_DELETED: "loan.deleted",
  LOAN_RESTORED: "loan.restored",
  LOANS_PURGED: "loans.purged",
  RECOVERED_LOANS_PURGED: "loans.recovered_purged",
  PAYMENT_ADDED: "payment.added",
  PAYMENT_UPDATED: "payment.updated",
  PAYMENT_DELETED: "payment.deleted",
  USER_APPROVED: "user.approved",
  USER_FROZEN: "user.frozen",
  USER_UNFROZEN: "user.unfrozen",
  USER_DELETED: "user.deleted",
  USER_CREATED: "user.created",
} as const;

export type ActivityAction = (typeof ActivityActions)[keyof typeof ActivityActions];

export const ACTIVITY_ACTION_LABELS: Record<ActivityAction, string> = {
  [ActivityActions.AUTH_LOGIN]: "Sign in",
  [ActivityActions.AUTH_PASSWORD_CHANGED]: "Password changed",
  [ActivityActions.PROFILE_UPDATED]: "Profile updated",
  [ActivityActions.LOAN_CREATED]: "Loan created",
  [ActivityActions.LOAN_UPDATED]: "Loan updated",
  [ActivityActions.LOAN_DELETED]: "Loan deleted",
  [ActivityActions.LOAN_RESTORED]: "Loan restored",
  [ActivityActions.LOANS_PURGED]: "Expired deleted loans purged",
  [ActivityActions.RECOVERED_LOANS_PURGED]: "Expired recovered loans purged",
  [ActivityActions.PAYMENT_ADDED]: "Payment recorded",
  [ActivityActions.PAYMENT_UPDATED]: "Payment updated",
  [ActivityActions.PAYMENT_DELETED]: "Payment deleted",
  [ActivityActions.USER_APPROVED]: "User approved",
  [ActivityActions.USER_FROZEN]: "User frozen",
  [ActivityActions.USER_UNFROZEN]: "User unfrozen",
  [ActivityActions.USER_DELETED]: "User deleted",
  [ActivityActions.USER_CREATED]: "User created",
};

export function isSecurityActivity(action: string) {
  return action === ActivityActions.AUTH_LOGIN || action === ActivityActions.AUTH_PASSWORD_CHANGED;
}

export type ActivityTab = "all" | "security" | "loans" | "payments" | "account" | "users";

export type ActivityTabOption = {
  id: ActivityTab;
  label: string;
};

const ACTIVITY_TAB_CONFIG: Record<
  ActivityTab,
  { label: string; emptyDescription: string; adminOnly?: boolean }
> = {
  all: {
    label: "All",
    emptyDescription:
      "Your sign-ins, loan updates, payments, and account changes will appear here.",
  },
  security: {
    label: "Security",
    emptyDescription: "Sign-in and password change events will appear here.",
  },
  loans: {
    label: "Loans",
    emptyDescription:
      "Loan create, update, delete, restore, and purge events will appear here.",
  },
  payments: {
    label: "Payments",
    emptyDescription: "Payment recorded, updated, and deleted events will appear here.",
  },
  account: {
    label: "Account",
    emptyDescription: "Profile and account changes will appear here.",
  },
  users: {
    label: "Users",
    emptyDescription: "User management actions will appear here.",
    adminOnly: true,
  },
};

export function getActionsForTab(tab: ActivityTab): ActivityAction[] | undefined {
  switch (tab) {
    case "all":
      return undefined;
    case "security":
      return [ActivityActions.AUTH_LOGIN, ActivityActions.AUTH_PASSWORD_CHANGED];
    case "loans":
      return [
        ActivityActions.LOAN_CREATED,
        ActivityActions.LOAN_UPDATED,
        ActivityActions.LOAN_DELETED,
        ActivityActions.LOAN_RESTORED,
        ActivityActions.LOANS_PURGED,
        ActivityActions.RECOVERED_LOANS_PURGED,
      ];
    case "payments":
      return [
        ActivityActions.PAYMENT_ADDED,
        ActivityActions.PAYMENT_UPDATED,
        ActivityActions.PAYMENT_DELETED,
      ];
    case "account":
      return [ActivityActions.PROFILE_UPDATED];
    case "users":
      return [
        ActivityActions.USER_APPROVED,
        ActivityActions.USER_FROZEN,
        ActivityActions.USER_UNFROZEN,
        ActivityActions.USER_DELETED,
        ActivityActions.USER_CREATED,
      ];
  }
}

export function getActivityTabs(admin = false): ActivityTabOption[] {
  return (Object.keys(ACTIVITY_TAB_CONFIG) as ActivityTab[])
    .filter((tab) => !ACTIVITY_TAB_CONFIG[tab].adminOnly || admin)
    .map((tab) => ({
      id: tab,
      label: ACTIVITY_TAB_CONFIG[tab].label,
    }));
}

export function getActivityTabEmptyDescription(tab: ActivityTab, admin = false) {
  if (tab === "all" && admin) {
    return "Actions performed across user accounts will appear here.";
  }

  return ACTIVITY_TAB_CONFIG[tab].emptyDescription;
}
