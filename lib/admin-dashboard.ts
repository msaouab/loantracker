import { prisma } from "@/lib/db";

export type AdminDashboardStats = {
  totalManagers: number;
  pendingCount: number;
  activeCount: number;
  frozenCount: number;
  updatedAt: string;
};

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const managerFilter = { isAdmin: false } as const;

  const [totalManagers, pendingCount, activeCount, frozenCount] =
    await Promise.all([
      prisma.user.count({ where: managerFilter }),
      prisma.user.count({
        where: { ...managerFilter, isActivated: false },
      }),
      prisma.user.count({
        where: { ...managerFilter, isActivated: true, isFrozen: false },
      }),
      prisma.user.count({
        where: { ...managerFilter, isFrozen: true },
      }),
    ]);

  return {
    totalManagers,
    pendingCount,
    activeCount,
    frozenCount,
    updatedAt: new Date().toISOString(),
  };
}
