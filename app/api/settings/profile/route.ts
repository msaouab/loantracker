import { apiOk } from "@/lib/api-response";
import { withUser } from "@/lib/api-handler";
import { parseOrThrow } from "@/lib/errors";
import { ActivityActions } from "@/lib/activity-log";
import { logActivityFromRequest } from "@/lib/activity-log-service";
import { prisma } from "@/lib/db";
import { updateUserProfile } from "@/lib/user-settings-service";
import { getUpdateProfileSchema } from "@/lib/validations";

export const PATCH = withUser(async (req, userId) => {
  const updateProfileSchema = await getUpdateProfileSchema();
  const input = parseOrThrow(updateProfileSchema, await req.json());
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true },
  });
  const user = await updateUserProfile(userId, input.fullName);

  if (existing && existing.fullName !== user.fullName) {
    await logActivityFromRequest(userId, req, {
      action: ActivityActions.PROFILE_UPDATED,
      summary: `Changed display name to "${user.fullName}"`,
      entityType: "profile",
      metadata: { previousName: existing.fullName },
    });
  }

  return apiOk({
    fullName: user.fullName,
    email: user.email,
  });
});
