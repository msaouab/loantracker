import { request } from "@/lib/api-client";

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export async function registerUser(payload: RegisterPayload) {
  return request<{ success: boolean }>(
    "/api/auth/register",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Registration failed"
  );
}
