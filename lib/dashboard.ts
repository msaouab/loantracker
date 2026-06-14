import { prisma } from "@/lib/db";
import { getOutstanding } from "@/lib/loans";

export async function getDashboardStats(userId: string) {
  const loans = await prisma.loan.findMany({
    where: { userId, deletedAt: null },
    orderBy: { loanDate: "desc" },
  });

  const totalLoanAmount = loans.reduce(
    (sum, loan) => sum + loan.totalAmount,
    0
  );
  const amountRecovered = loans.reduce(
    (sum, loan) => sum + loan.amountPaid,
    0
  );
  const outstanding = loans.reduce(
    (sum, loan) => sum + getOutstanding(loan.totalAmount, loan.amountPaid),
    0
  );

  const uniqueClients = new Set(loans.map((loan) => loan.clientName)).size;

  let trusted = 0;
  let notTrusted = 0;

  const clientTotals = new Map<string, number>();

  for (const loan of loans) {
    if (loan.clientTrust) {
      trusted += 1;
    } else {
      notTrusted += 1;
    }

    const current = clientTotals.get(loan.clientName) ?? 0;
    clientTotals.set(loan.clientName, current + loan.totalAmount);
  }

  const topClients = Array.from(clientTotals.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const recoveredCount = loans.filter(
    (loan) => loan.amountPaid >= loan.totalAmount
  ).length;
  const activeCount = loans.length - recoveredCount;

  const recoveryRate =
    totalLoanAmount > 0 ? (amountRecovered / totalLoanAmount) * 100 : 0;

  return {
    totalClients: uniqueClients,
    totalLoanAmount,
    amountRecovered,
    outstanding,
    activeCount,
    recoveredCount,
    ifAllRecovered: totalLoanAmount,
    recoveryRate,
    trustDistribution: { trusted, notTrusted },
    recoveryProgress: { recovered: amountRecovered, outstanding },
    topClients,
    updatedAt: new Date().toISOString(),
  };
}
