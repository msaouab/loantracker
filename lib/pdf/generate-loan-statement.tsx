import { renderToBuffer } from "@react-pdf/renderer";
import { getTranslations } from "next-intl/server";
import { getOutstanding } from "@/lib/loans-core";
import { DEFAULT_LOCALE, isValidLocale, type AppLocale } from "@/lib/locale";
import { ensurePdfFonts } from "@/lib/pdf/fonts";
import { LoanStatementDocument } from "@/lib/pdf/loan-statement-document";
import type {
  LoanStatementData,
  LoanStatementLabels,
  LoanStatementPayment,
} from "@/lib/pdf/types";
import type { LoanPaymentRecord } from "@/lib/loans-service";

type LoanRecord = {
  clientName: string;
  totalAmount: number;
  amountPaid: number;
  loanDate: Date;
  description: string | null;
};

type IssuerRecord = {
  fullName: string;
  email: string;
  locale: string | null;
};

async function getStatementLabels(locale: AppLocale): Promise<LoanStatementLabels> {
  const [tPdf, tLoans] = await Promise.all([
    getTranslations({ locale, namespace: "pdf" }),
    getTranslations({ locale, namespace: "loans" }),
  ]);

  return {
    title: tPdf("statementTitle"),
    client: tPdf("client"),
    issuer: tPdf("issuer"),
    generatedOn: tPdf("generatedOn"),
    totalAmount: tLoans("totalAmount"),
    amountPaid: tLoans("amountPaid"),
    outstanding: tLoans("outstanding"),
    loanDate: tLoans("loanDate"),
    description: tLoans("noteDescription"),
    noNotes: tLoans("noNotes"),
    paymentHistory: tLoans("paymentHistory"),
    noPayments: tPdf("noPayments"),
    columnDate: tPdf("columnDate"),
    columnAmount: tPdf("columnAmount"),
    columnNote: tPdf("columnNote"),
    initialBalance: tLoans("initialBalanceNote"),
    disclaimer: tPdf("disclaimer"),
  };
}

function toStatementPayments(payments: LoanPaymentRecord[]): LoanStatementPayment[] {
  return payments.map((payment) => ({
    amount: payment.amount,
    paidAt: payment.paidAt,
    note: payment.note,
  }));
}

export async function buildLoanStatementData(
  loan: LoanRecord,
  payments: LoanPaymentRecord[],
  issuer: IssuerRecord
): Promise<LoanStatementData> {
  const locale = isValidLocale(issuer.locale) ? issuer.locale : DEFAULT_LOCALE;
  const labels = await getStatementLabels(locale);

  return {
    locale,
    labels,
    issuer: {
      fullName: issuer.fullName,
      email: issuer.email,
    },
    clientName: loan.clientName,
    totalAmount: loan.totalAmount,
    amountPaid: loan.amountPaid,
    outstanding: getOutstanding(loan.totalAmount, loan.amountPaid),
    loanDate: loan.loanDate,
    description: loan.description,
    payments: toStatementPayments(payments),
    generatedAt: new Date(),
  };
}

export async function renderLoanStatementPdf(data: LoanStatementData) {
  ensurePdfFonts();
  return renderToBuffer(<LoanStatementDocument data={data} />);
}
