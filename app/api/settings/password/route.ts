import { NextResponse } from "next/server";
import { withUser } from "@/lib/api-handler";
import { parseOrThrow } from "@/lib/errors";
import { ActivityActions } from "@/lib/activity-log";
import {
  buildAuthSummary,
  logActivityFromRequest,
} from "@/lib/activity-log-service";
import { getClientInfo } from "@/lib/client-info";
import { changeUserPassword } from "@/lib/user-settings-service";
import { changePasswordSchema } from "@/lib/validations";

export const PATCH = withUser(async (req, userId) => {
  const input = parseOrThrow(changePasswordSchema, await req.json());
  const clientInfo = getClientInfo(req);
  await changeUserPassword(userId, input.currentPassword, input.newPassword);

  await logActivityFromRequest(userId, req, {
    action: ActivityActions.AUTH_PASSWORD_CHANGED,
    summary: buildAuthSummary(ActivityActions.AUTH_PASSWORD_CHANGED, clientInfo),
    entityType: "session",
  });

  return NextResponse.json({ success: true });
});
