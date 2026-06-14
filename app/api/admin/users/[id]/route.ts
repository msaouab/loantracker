import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/api-handler";
import { parseOrThrow } from "@/lib/errors";
import { ActivityActions } from "@/lib/activity-log";
import { logActivityFromRequest } from "@/lib/activity-log-service";
import { prisma } from "@/lib/db";
import { deleteUser, serializeUser, updateUserStatus } from "@/lib/users-service";
import { adminUserActionSchema } from "@/lib/validations";

const adminActionLabels: Record<
  "approve" | "freeze" | "unfreeze",
  { action: string; summary: (name: string) => string }
> = {
  approve: {
    action: ActivityActions.USER_APPROVED,
    summary: (name) => `Approved account for ${name}`,
  },
  freeze: {
    action: ActivityActions.USER_FROZEN,
    summary: (name) => `Froze account for ${name}`,
  },
  unfreeze: {
    action: ActivityActions.USER_UNFROZEN,
    summary: (name) => `Unfroze account for ${name}`,
  },
};

export const PATCH = withAdmin<{ id: string }>(async (req, adminUserId, { params }) => {
  const { id } = await params;
  const { action } = parseOrThrow(adminUserActionSchema, await req.json());
  const updated = await updateUserStatus(adminUserId, id, action);
  const label = adminActionLabels[action];

  await logActivityFromRequest(adminUserId, req, {
    action: label.action,
    summary: label.summary(updated.fullName),
    entityType: "user",
    entityId: id,
    metadata: { email: updated.email },
  });

  return NextResponse.json({ user: serializeUser(updated) });
});

export const DELETE = withAdmin<{ id: string }>(async (req, adminUserId, { params }) => {
  const { id } = await params;
  const target = await prisma.user.findUnique({
    where: { id },
    select: { fullName: true, email: true },
  });
  await deleteUser(adminUserId, id);

  if (target) {
    await logActivityFromRequest(adminUserId, req, {
      action: ActivityActions.USER_DELETED,
      summary: `Deleted account for ${target.fullName}`,
      entityType: "user",
      entityId: id,
      metadata: { email: target.email },
    });
  }

  return NextResponse.json({ success: true });
});
