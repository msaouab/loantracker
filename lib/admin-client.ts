import { request } from "@/lib/api-client";
import type { AccountStatus } from "@/lib/users";
import type { AdminCreateUserInput, AdminUserAction } from "@/lib/validations";

export type { AdminCreateUserInput, AdminUserAction };

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
