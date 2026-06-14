import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/api-handler";
import { parseOrThrow } from "@/lib/errors";
import { createUser, listUsers, serializeUser } from "@/lib/users-service";
import { adminCreateUserSchema } from "@/lib/validations";

export const GET = withAdmin(async () => {
  const users = await listUsers();

  return NextResponse.json({
    users: users.map(serializeUser),
  });
});

export const POST = withAdmin(async (req) => {
  const input = parseOrThrow(adminCreateUserSchema, await req.json());
  const user = await createUser(input);

  return NextResponse.json({ user: serializeUser(user) }, { status: 201 });
});
