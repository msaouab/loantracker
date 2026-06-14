import "server-only";
import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";

/** Bumps sessionVersion to invalidate all outstanding JWTs for this user. */
export async function bumpSessionVersion(
  userId: string,
  data?: Omit<Prisma.UserUpdateInput, "sessionVersion">
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      sessionVersion: { increment: 1 },
      ...data,
    },
  });
}
