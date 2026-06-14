export type AccountStatus = "pending" | "active" | "frozen";

export function getAccountStatus(user: {
  isActivated: boolean;
  isFrozen: boolean;
}): AccountStatus {
  if (user.isFrozen) {
    return "frozen";
  }
  if (!user.isActivated) {
    return "pending";
  }
  return "active";
}

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  pending: "Pending approval",
  active: "Active",
  frozen: "Frozen",
};
