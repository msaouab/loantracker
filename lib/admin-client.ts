import { request } from "@/lib/api-client";
import type { DashboardStats } from "@/lib/dashboard";
import type { AccountStatus } from "@/lib/users";
import type {
  AdminCreateUserInput,
  AdminResetPasswordInput,
  AdminUpdateUserProfileInput,
  AdminUserAction,
} from "@/lib/validations";

export type {
  AdminCreateUserInput,
  AdminResetPasswordInput,
  AdminUpdateUserProfileInput,
  AdminUserAction,
};

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  isAdmin: boolean;
  isActivated: boolean;
  isFrozen: boolean;
  status: AccountStatus;
  createdAt: string;
  lastLoginAt: string | null;
  loanCount: number;
};

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const data = await request<{ users: AdminUser[] }>(
    "/api/admin/users",
    {},
    "Failed to load users"
  );
  return data.users;
}

export async function fetchAdminUser(
  userId: string
): Promise<{ user: AdminUser; stats: DashboardStats }> {
  return request(
    `/api/admin/users/${userId}`,
    {},
    "Failed to load user"
  );
}

export async function updateAdminUserProfile(
  userId: string,
  input: AdminUpdateUserProfileInput
): Promise<AdminUser> {
  const data = await request<{ user: AdminUser }>(
    `/api/admin/users/${userId}/profile`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Failed to update user"
  );
  return data.user;
}

export async function resetAdminUserPassword(
  userId: string,
  input: AdminResetPasswordInput
): Promise<void> {
  await request(
    `/api/admin/users/${userId}/password`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Failed to reset password"
  );
}

export async function createAdminUser(
  input: AdminCreateUserInput
): Promise<AdminUser> {
  const data = await request<{ user: AdminUser }>(
    "/api/admin/users",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Failed to create user"
  );
  return data.user;
}

export async function updateAdminUser(
  userId: string,
  action: AdminUserAction
): Promise<void> {
  await request(
    `/api/admin/users/${userId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    },
    "Failed to update user"
  );
}

export async function deleteAdminUser(userId: string): Promise<void> {
  await request(
    `/api/admin/users/${userId}`,
    { method: "DELETE" },
    "Failed to delete user"
  );
}
