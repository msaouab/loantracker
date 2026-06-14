import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { AppError, NotFoundError } from "@/lib/errors";
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
  if (!target) throw new NotFoundError("User not found");
  if (target.isAdmin) {
    throw new AppError("Admin accounts cannot be modified here", 400);
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
    throw new AppError("Email already registered", 409);
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
  if (!updated) throw new NotFoundError("User not found");
  return updated;
}

export async function deleteUser(adminId: string, id: string) {
  assertNotSelf(adminId, id, "delete");
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new NotFoundError("User not found");
  if (target.isAdmin) {
    throw new AppError("Admin accounts cannot be deleted", 400);
  }
  await prisma.user.delete({ where: { id } });
}
