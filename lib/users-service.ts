import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { AppError, ConflictError, NotFoundError } from "@/lib/errors";
import { getErrorMessage } from "@/lib/server-errors";
import { isOnline } from "@/lib/presence";
import { bumpSessionVersion } from "@/lib/session-revocation";
import { getAccountStatus } from "@/lib/users";
import type { AdminCreateUserInput } from "@/lib/validations";

export const userAdminSelect = {
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
} as const;

type UserAdminRecord = {
  id: string;
  fullName: string;
  email: string;
  isAdmin: boolean;
  isActivated: boolean;
  isFrozen: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
  lastSeenAt: Date | null;
  _count: { loans: number };
};

export function serializeUser(user: UserAdminRecord) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    isAdmin: user.isAdmin,
    isActivated: user.isActivated,
    isFrozen: user.isFrozen,
    status: getAccountStatus(user),
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    lastSeenAt: user.lastSeenAt?.toISOString() ?? null,
    isOnline: isOnline(user.lastSeenAt),
    loanCount: user._count.loans,
  };
}

async function findUserWithCounts(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: userAdminSelect,
  });
}

function assertNotSelf(adminId: string, targetId: string, action: "modify" | "delete") {
  if (targetId === adminId) {
    throw new AppError(
      action === "delete"
        ? "You cannot delete your own account"
        : "You cannot modify your own account",
      400
    );
  }
}

async function getModifiableUserOrThrow(targetId: string) {
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) throw new NotFoundError(await getErrorMessage("userNotFound"));
  if (target.isAdmin) {
    throw new AppError(await getErrorMessage("adminCannotModify"), 400);
  }
  return target;
}

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: [{ isActivated: "asc" }, { createdAt: "desc" }],
    select: userAdminSelect,
  });
}

export async function createUser(input: AdminCreateUserInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError(await getErrorMessage("emailRegistered"), {
      email: [await getErrorMessage("emailRegistered")],
    });
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);

  return prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      password: hashedPassword,
      isAdmin: input.isAdmin,
      isActivated: true,
      isFrozen: false,
    },
    select: userAdminSelect,
  });
}

export async function updateUserStatus(
  adminId: string,
  id: string,
  action: "approve" | "freeze" | "unfreeze"
) {
  assertNotSelf(adminId, id, "modify");
  await getModifiableUserOrThrow(id);

  if (action === "approve") {
    await prisma.user.update({
      where: { id },
      data: { isActivated: true, isFrozen: false },
    });
  } else if (action === "freeze") {
    await bumpSessionVersion(id, { isFrozen: true });
  } else {
    await prisma.user.update({
      where: { id },
      data: { isFrozen: false },
    });
  }

  const updated = await findUserWithCounts(id);
  if (!updated) throw new NotFoundError(await getErrorMessage("userNotFound"));
  return updated;
}

export async function getManagerForAdmin(id: string) {
  const user = await findUserWithCounts(id);
  if (!user) throw new NotFoundError(await getErrorMessage("userNotFound"));
  if (user.isAdmin) {
    throw new AppError(await getErrorMessage("adminCannotView"), 400);
  }
  return user;
}

export async function updateManagerProfileByAdmin(
  adminId: string,
  id: string,
  input: { fullName: string; email: string }
) {
  assertNotSelf(adminId, id, "modify");
  await getModifiableUserOrThrow(id);

  const emailTaken = await prisma.user.findFirst({
    where: { email: input.email, NOT: { id } },
    select: { id: true },
  });
  if (emailTaken) {
    throw new ConflictError(await getErrorMessage("emailRegistered"), {
      email: [await getErrorMessage("emailRegistered")],
    });
  }

  return prisma.user.update({
    where: { id },
    data: {
      fullName: input.fullName,
      email: input.email,
    },
    select: userAdminSelect,
  });
}

export async function resetManagerPasswordByAdmin(
  adminId: string,
  id: string,
  newPassword: string
) {
  assertNotSelf(adminId, id, "modify");
  await getModifiableUserOrThrow(id);

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await bumpSessionVersion(id, { password: hashedPassword });
}

export async function deleteUser(adminId: string, id: string) {
  assertNotSelf(adminId, id, "delete");
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new NotFoundError(await getErrorMessage("userNotFound"));
  if (target.isAdmin) {
    throw new AppError(await getErrorMessage("adminCannotDelete"), 400);
  }
  await prisma.user.delete({ where: { id } });
}
