import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { bumpSessionVersion } from "@/lib/session-revocation";

export async function updateUserProfile(userId: string, fullName: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found");

  return prisma.user.update({
    where: { id: userId },
    data: { fullName },
    select: { id: true, fullName: true, email: true },
  });
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found");

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    throw new ValidationError({ currentPassword: ["Current password is incorrect"] });
  }

  if (currentPassword === newPassword) {
    throw new ValidationError({
      newPassword: ["New password must be different from your current password"],
    });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await bumpSessionVersion(userId, { password: hashedPassword });
}
