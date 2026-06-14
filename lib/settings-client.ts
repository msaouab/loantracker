import { request } from "@/lib/api-client";

export async function updateProfile(fullName: string) {
  return request<{ user: { id: string; fullName: string; email: string } }>(
    "/api/settings/profile",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName }),
    },
    "Failed to update profile"
  );
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  await request(
    "/api/settings/password",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Failed to change password"
  );
}
