import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/api-handler";
import { parseOrThrow } from "@/lib/errors";
import { deleteUser, serializeUser, updateUserStatus } from "@/lib/users-service";
import { adminUserActionSchema } from "@/lib/validations";

export const PATCH = withAdmin<{ id: string }>(async (req, adminUserId, { params }) => {
  const { id } = await params;
  const { action } = parseOrThrow(adminUserActionSchema, await req.json());
  const updated = await updateUserStatus(adminUserId, id, action);

  return NextResponse.json({ user: serializeUser(updated) });
});

export const DELETE = withAdmin<{ id: string }>(async (_req, adminUserId, { params }) => {
  const { id } = await params;
  await deleteUser(adminUserId, id);

  return NextResponse.json({ success: true });
});
