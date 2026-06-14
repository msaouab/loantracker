import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export class AccountNotActivatedError extends Error {
  code = "account_not_activated" as const;

  constructor() {
    super("Account not activated");
    this.name = "AccountNotActivatedError";
  }
}

export class AccountFrozenError extends Error {
  code = "account_frozen" as const;

  constructor() {
    super("Account is frozen");
    this.name = "AccountFrozenError";
  }
}

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  sessionVersion: number;
};

export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthenticatedUser | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return null;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return null;
  }

  if (!user.isActivated) {
    throw new AccountNotActivatedError();
  }

  if (user.isFrozen) {
    throw new AccountFrozenError();
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.fullName,
    isAdmin: user.isAdmin,
    sessionVersion: user.sessionVersion,
  };
}
