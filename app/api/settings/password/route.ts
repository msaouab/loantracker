import { apiOk } from "@/lib/api-response";
import { withUser } from "@/lib/api-handler";
import { parseOrThrow } from "@/lib/errors";
import { ActivityActions } from "@/lib/activity-log";
import {
  buildAuthSummary,
  logActivityFromRequest,
} from "@/lib/activity-log-service";
import { changeUserPassword } from "@/lib/user-settings-service";
import { getChangePasswordSchema } from "@/lib/validations";

export const PATCH = withUser(async (req, userId) => {
  const changePasswordSchema = await getChangePasswordSchema();
  const input = parseOrThrow(changePasswordSchema, await req.json());
  await changeUserPassword(userId, input.currentPassword, input.newPassword);

  await logActivityFromRequest(userId, req, {
    action: ActivityActions.AUTH_PASSWORD_CHANGED,
    summary: buildAuthSummary(ActivityActions.AUTH_PASSWORD_CHANGED),
    entityType: "session",
  });

  return apiOk({ success: true });
});
