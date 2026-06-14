import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/api-handler";
import { parseOrThrow } from "@/lib/errors";
import { ActivityActions } from "@/lib/activity-log";
import { logActivityFromRequest } from "@/lib/activity-log-service";
import { createUser, listUsers, serializeUser } from "@/lib/users-service";
import { adminCreateUserSchema } from "@/lib/validations";

export const GET = withAdmin(async () => {
  const users = await listUsers();

  return NextResponse.json({
    users: users.map(serializeUser),
  });
});

export const POST = withAdmin(async (req, adminUserId) => {
  const input = parseOrThrow(adminCreateUserSchema, await req.json());
  const user = await createUser(input);

  await logActivityFromRequest(adminUserId, req, {
    action: ActivityActions.USER_CREATED,
    summary: `Created account for ${user.fullName}`,
    entityType: "user",
    entityId: user.id,
    metadata: { email: user.email, isAdmin: user.isAdmin },
  });

  return NextResponse.json({ user: serializeUser(user) }, { status: 201 });
});
