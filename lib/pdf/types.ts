import type { AppLocale } from "@/lib/locale";

export type LoanStatementPayment = {
  amount: number;
  paidAt: Date;
  note: string | null;
};

export type LoanStatementLabels = {
  title: string;
  client: string;
  issuer: string;
  generatedOn: string;
  totalAmount: string;
  amountPaid: string;
  outstanding: string;
  loanDate: string;
  description: string;
  noNotes: string;
  paymentHistory: string;
  noPayments: string;
  columnDate: string;
  columnAmount: string;
  columnNote: string;
  initialBalance: string;
  disclaimer: string;
};

export type LoanStatementData = {
  locale: AppLocale;
  labels: LoanStatementLabels;
  issuer: {
    fullName: string;
    email: string;
  };
  clientName: string;
  totalAmount: number;
  amountPaid: number;
  outstanding: number;
  loanDate: Date;
  description: string | null;
  payments: LoanStatementPayment[];
  generatedAt: Date;
};
