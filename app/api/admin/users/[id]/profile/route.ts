import { apiOk } from "@/lib/api-response";
import { withAdmin } from "@/lib/api-handler";
import { parseOrThrow } from "@/lib/errors";
import { ActivityActions } from "@/lib/activity-log";
import { logActivityFromRequest } from "@/lib/activity-log-service";
import { prisma } from "@/lib/db";
import {
  serializeUser,
  updateManagerProfileByAdmin,
} from "@/lib/users-service";
import { adminUpdateUserProfileSchema } from "@/lib/validations";

export const PATCH = withAdmin<{ id: string }>(async (req, adminUserId, { params }) => {
  const { id } = await params;
  const input = parseOrThrow(adminUpdateUserProfileSchema, await req.json());
  const existing = await prisma.user.findUnique({
    where: { id },
    select: { fullName: true, email: true },
  });
  const updated = await updateManagerProfileByAdmin(adminUserId, id, input);

  if (existing) {
    const changes: string[] = [];
    if (existing.fullName !== updated.fullName) {
      changes.push(`name to "${updated.fullName}"`);
    }
    if (existing.email !== updated.email) {
      changes.push(`email to ${updated.email}`);
    }

    if (changes.length > 0) {
      await logActivityFromRequest(adminUserId, req, {
        action: ActivityActions.USER_UPDATED,
        summary: `Updated ${updated.fullName}: ${changes.join(", ")}`,
        entityType: "user",
        entityId: id,
        metadata: {
          previousName: existing.fullName,
          previousEmail: existing.email,
        },
      });
    }
  }

  return apiOk({ user: serializeUser(updated) });
});
