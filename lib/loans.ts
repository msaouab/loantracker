export function getOutstanding(totalAmount: number, amountPaid: number) {
  return Math.max(0, totalAmount - amountPaid);
}

type LoanRecord = {
  id: string;
  clientName: string;
  totalAmount: number;
  amountPaid: number;
  loanDate: Date;
  description: string | null;
  clientTrust: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function serializeLoan(loan: LoanRecord) {
  return {
    id: loan.id,
    clientName: loan.clientName,
    totalAmount: loan.totalAmount,
    amountPaid: loan.amountPaid,
    outstanding: getOutstanding(loan.totalAmount, loan.amountPaid),
    loanDate: loan.loanDate.toISOString(),
    description: loan.description,
    clientTrust: loan.clientTrust,
    createdAt: loan.createdAt.toISOString(),
    updatedAt: loan.updatedAt.toISOString(),
  };
}

export function formatCurrency(amount: number) {
  const formatted = new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return `${formatted} DH`;
}
