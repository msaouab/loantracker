import { apiOk } from "@/lib/api-response";
import { withAdmin } from "@/lib/api-handler";
import { parseOrThrow } from "@/lib/errors";
import { ActivityActions } from "@/lib/activity-log";
import { logActivityFromRequest } from "@/lib/activity-log-service";
import { prisma } from "@/lib/db";
import {
  resetManagerPasswordByAdmin,
  serializeUser,
} from "@/lib/users-service";
import { getAdminResetPasswordSchema } from "@/lib/validations";

export const PATCH = withAdmin<{ id: string }>(async (req, adminUserId, { params }) => {
  const { id } = await params;
  const adminResetPasswordSchema = await getAdminResetPasswordSchema();
  const input = parseOrThrow(adminResetPasswordSchema, await req.json());
  const target = await prisma.user.findUnique({
    where: { id },
    select: { fullName: true, email: true },
  });

  await resetManagerPasswordByAdmin(adminUserId, id, input.newPassword);

  if (target) {
    await logActivityFromRequest(adminUserId, req, {
      action: ActivityActions.USER_PASSWORD_RESET,
      summary: `Reset password for ${target.fullName}`,
      entityType: "user",
      entityId: id,
      metadata: { email: target.email },
    });
  }

  const updated = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      email: true,
      isAdmin: true,
      isActivated: true,
      isFrozen: true,
      createdAt: true,
      lastLoginAt: true,
      lastSeenAt: true,
      _count: { select: { loans: true } },
    },
  });

  return apiOk({
    user: updated ? serializeUser(updated) : null,
  });
});
