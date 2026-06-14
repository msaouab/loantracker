import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../app/generated/prisma/client";
import { ActivityActions } from "../lib/activity-log";
import { getDatabaseUrl } from "../lib/database-url";
import { computeRecoveredAt } from "../lib/loan-recovery";
import { formatCurrency } from "../lib/loans";

const DEMO_EMAIL = "demo@loantracker.local";
const DEMO_PASSWORD = "Demo@123!";
const DEMO_NAME = "Demo Manager";

const LOAN_COUNT = 20;
const DELETED_LOAN_COUNT = 3;

const DEMO_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const SAFARI_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15";

const firstNames = [
  "Youssef", "Fatima", "Mohamed", "Aicha", "Omar", "Khadija", "Amine", "Salma",
  "Hassan", "Nadia", "Karim", "Laila", "Rachid", "Sanae", "Mehdi", "Imane",
  "Adil", "Houda", "Tarik", "Zineb",
];

const lastNames = [
  "Alaoui", "Benali", "Idrissi", "Tazi", "Fassi", "Berrada", "Chraibi", "Amrani",
  "Bennani", "El Fassi", "Ouazzani", "Lahlou", "Sqalli", "Bensaid", "Ziani",
  "Mernissi", "Kettani", "Sefrioui", "Bouazzaoui", "Cherkaoui",
];

const descriptions = [
  "Business expansion loan",
  "Inventory purchase",
  "Equipment financing",
  "Working capital",
  "Seasonal stock funding",
  "Store renovation",
  "Vehicle purchase",
  "Emergency bridge loan",
  "Supplier payment advance",
  "New product launch",
  null,
  null,
];

const paymentNotes = [
  "Initial balance",
  "First installment",
  "Partial payment",
  "Final payment",
  null,
];

type ActivitySeed = {
  userId: string;
  action: string;
  summary: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  browser?: string;
  userAgent?: string;
  createdAt: Date;
};

function pick<T>(items: T[], index: number): T {
  return items[index % items.length];
}

function randomAmount(min: number, max: number, seed: number): number {
  const step = 1000;
  const steps = Math.floor((max - min) / step);
  const stepIndex = (seed * 7919 + 104729) % (steps + 1);
  return min + stepIndex * step;
}

function amountPaidForTotal(totalAmount: number, ratio: number): number {
  return Math.round(totalAmount * ratio);
}

function daysAgo(days: number, hours = 12, minutes = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function loanDateForIndex(index: number): Date {
  const daysBack = [3, 7, 14, 21, 35, 45, 60, 75, 90, 120][index % 10];
  return daysAgo(daysBack + (index % 5));
}

function paidRatioForIndex(index: number): number {
  const ratios = [0, 0.2, 0.25, 0.5, 0.75, 1, 1, 0.3, 0.4, 0.6];
  return ratios[index % ratios.length];
}

function buildPaymentInstallments(
  totalAmount: number,
  amountPaid: number,
  loanDate: Date,
  index: number
) {
  if (amountPaid <= 0) {
    return [];
  }

  const installmentCount = amountPaid >= totalAmount ? 2 : [1, 2, 3][index % 3];
  const baseAmount = Math.floor(amountPaid / installmentCount);
  let remainder = amountPaid - baseAmount * installmentCount;

  return Array.from({ length: installmentCount }, (_, paymentIndex) => {
    const amount = baseAmount + (remainder > 0 ? 1 : 0);
    if (remainder > 0) {
      remainder -= 1;
    }

    const paidAt = new Date(loanDate);
    paidAt.setDate(paidAt.getDate() + paymentIndex * 7);

    return {
      amount,
      paidAt,
      note: pick(paymentNotes, index + paymentIndex),
    };
  });
}

function buildAuthSummary(
  action: typeof ActivityActions.AUTH_LOGIN | typeof ActivityActions.AUTH_PASSWORD_CHANGED,
  browser: string,
  ipAddress: string
) {
  const clientLabel = `${browser} · ${ipAddress}`;
  if (action === ActivityActions.AUTH_LOGIN) {
    return `Signed in from ${clientLabel}`;
  }
  return `Password changed from ${clientLabel}`;
}

async function seedActivityLogs(prisma: PrismaClient, logs: ActivitySeed[]) {
  if (logs.length === 0) {
    return;
  }

  await prisma.activityLog.createMany({
    data: logs.map((log) => ({
      userId: log.userId,
      action: log.action,
      summary: log.summary,
      entityType: log.entityType ?? null,
      entityId: log.entityId ?? null,
      metadata: log.metadata
        ? (log.metadata as Prisma.InputJsonValue)
        : undefined,
      ipAddress: log.ipAddress ?? null,
      userAgent: log.userAgent ?? null,
      browser: log.browser ?? null,
      createdAt: log.createdAt,
    })),
  });
}

async function main() {
  const adapter = new PrismaPg({
    connectionString: getDatabaseUrl(),
  });
  const prisma = new PrismaClient({ adapter });

  const demoPassword = await bcrypt.hash(DEMO_PASSWORD, 12);

  const demo = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      fullName: DEMO_NAME,
      isAdmin: false,
      isActivated: true,
      isFrozen: false,
      lastLoginAt: daysAgo(0, 8, 30),
    },
    create: {
      email: DEMO_EMAIL,
      password: demoPassword,
      fullName: DEMO_NAME,
      isActivated: true,
      isFrozen: false,
      lastLoginAt: daysAgo(0, 8, 30),
    },
  });

  await prisma.activityLog.deleteMany({
    where: { userId: demo.id },
  });

  await prisma.loan.deleteMany({
    where: { userId: demo.id },
  });

  const demoLoans: Array<{
    id: string;
    clientName: string;
    totalAmount: number;
    amountPaid: number;
    recoveredAt: Date | null;
    deletedAt: Date | null;
  }> = [];

  for (let index = 0; index < LOAN_COUNT; index += 1) {
    const totalAmount = randomAmount(1000, 50000, index + 1);
    const paidRatio = paidRatioForIndex(index);
    const amountPaid = amountPaidForTotal(totalAmount, paidRatio);
    const loanDate = loanDateForIndex(index);
    const clientName = `${pick(firstNames, index)} ${pick(lastNames, index + 7)}`;
    const deletedAt = index < DELETED_LOAN_COUNT ? daysAgo(2) : null;
    const recoveredSeed =
      amountPaid >= totalAmount && !deletedAt ? daysAgo(4 + (index % 6)) : null;
    const recoveredAt = computeRecoveredAt(
      amountPaid,
      totalAmount,
      recoveredSeed
    );

    const loan = await prisma.loan.create({
      data: {
        userId: demo.id,
        clientName,
        totalAmount,
        amountPaid,
        loanDate,
        description: pick(descriptions, index),
        clientTrust: index % 3 !== 0,
        deletedAt,
        recoveredAt,
      },
    });

    demoLoans.push({
      id: loan.id,
      clientName,
      totalAmount,
      amountPaid,
      recoveredAt,
      deletedAt,
    });

    const installments = buildPaymentInstallments(
      totalAmount,
      amountPaid,
      loanDate,
      index
    );

    if (installments.length > 0) {
      await prisma.loanPayment.createMany({
        data: installments.map((installment) => ({
          loanId: loan.id,
          amount: installment.amount,
          paidAt: installment.paidAt,
          note: installment.note,
        })),
      });
    }
  }

  const sampleLoan = demoLoans[5];
  const samplePaymentLoan = demoLoans[8];
  const deletedLoans = demoLoans.filter((loan) => loan.deletedAt != null);
  const recoveredLoans = demoLoans.filter(
    (loan) => loan.recoveredAt != null && loan.deletedAt == null
  );

  const activityLogs: ActivitySeed[] = [
    {
      userId: demo.id,
      action: ActivityActions.AUTH_LOGIN,
      summary: buildAuthSummary(ActivityActions.AUTH_LOGIN, "Chrome", "192.168.1.10"),
      entityType: "session",
      ipAddress: "192.168.1.10",
      browser: "Chrome",
      userAgent: DEMO_USER_AGENT,
      createdAt: daysAgo(14, 9),
    },
    {
      userId: demo.id,
      action: ActivityActions.AUTH_PASSWORD_CHANGED,
      summary: buildAuthSummary(ActivityActions.AUTH_PASSWORD_CHANGED, "Chrome", "192.168.1.10"),
      entityType: "session",
      ipAddress: "192.168.1.10",
      browser: "Chrome",
      userAgent: DEMO_USER_AGENT,
      createdAt: daysAgo(13, 18),
    },
    {
      userId: demo.id,
      action: ActivityActions.PROFILE_UPDATED,
      summary: `Changed display name to "${DEMO_NAME}"`,
      entityType: "profile",
      metadata: { previousName: "Demo User" },
      createdAt: daysAgo(12, 10),
    },
    {
      userId: demo.id,
      action: ActivityActions.LOAN_CREATED,
      summary: `Created loan for ${sampleLoan.clientName} (${formatCurrency(sampleLoan.totalAmount)})`,
      entityType: "loan",
      entityId: sampleLoan.id,
      metadata: {
        clientName: sampleLoan.clientName,
        totalAmount: sampleLoan.totalAmount,
      },
      createdAt: daysAgo(11, 14),
    },
    {
      userId: demo.id,
      action: ActivityActions.PAYMENT_ADDED,
      summary: `Recorded ${formatCurrency(Math.min(samplePaymentLoan.amountPaid, 5000))} payment for ${samplePaymentLoan.clientName}`,
      entityType: "loan",
      entityId: samplePaymentLoan.id,
      createdAt: daysAgo(8, 11),
    },
    {
      userId: demo.id,
      action: ActivityActions.LOAN_UPDATED,
      summary: `Updated loan for ${sampleLoan.clientName}`,
      entityType: "loan",
      entityId: sampleLoan.id,
      createdAt: daysAgo(5, 16),
    },
    ...deletedLoans.map((loan, index) => ({
      userId: demo.id,
      action: ActivityActions.LOAN_DELETED,
      summary: `Deleted loan for ${loan.clientName} (${formatCurrency(loan.totalAmount)})`,
      entityType: "loan",
      entityId: loan.id,
      metadata: {
        clientName: loan.clientName,
        totalAmount: loan.totalAmount,
      },
      createdAt: daysAgo(2, 10 + index),
    })),
    ...(recoveredLoans[0]
      ? [
          {
            userId: demo.id,
            action: ActivityActions.PAYMENT_ADDED,
            summary: `Recorded final payment for ${recoveredLoans[0].clientName} (${formatCurrency(recoveredLoans[0].totalAmount)})`,
            entityType: "loan",
            entityId: recoveredLoans[0].id,
            metadata: {
              clientName: recoveredLoans[0].clientName,
              totalAmount: recoveredLoans[0].totalAmount,
            },
            createdAt: daysAgo(4, 9),
          },
        ]
      : []),
    {
      userId: demo.id,
      action: ActivityActions.AUTH_LOGIN,
      summary: buildAuthSummary(ActivityActions.AUTH_LOGIN, "Safari", "192.168.1.24"),
      entityType: "session",
      ipAddress: "192.168.1.24",
      browser: "Safari",
      userAgent: SAFARI_USER_AGENT,
      createdAt: daysAgo(1, 8),
    },
    {
      userId: demo.id,
      action: ActivityActions.AUTH_LOGIN,
      summary: buildAuthSummary(ActivityActions.AUTH_LOGIN, "Chrome", "127.0.0.1"),
      entityType: "session",
      ipAddress: "127.0.0.1",
      browser: "Chrome",
      userAgent: DEMO_USER_AGENT,
      createdAt: daysAgo(0, 8, 30),
    },
  ];

  await seedActivityLogs(prisma, activityLogs);

  const activeLoans = demoLoans.filter(
    (loan) => loan.deletedAt == null && loan.recoveredAt == null
  );

  console.log("Database seeded successfully.\n");

  console.log("Demo manager:");
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);

  console.log("\nSeeded data summary:");
  console.log(`  Loans:         ${LOAN_COUNT}`);
  console.log(`  Active:        ${activeLoans.length}`);
  console.log(`  Recovered:     ${recoveredLoans.length}`);
  console.log(`  Soft-deleted:  ${deletedLoans.length}`);
  console.log(`  Activity logs: ${activityLogs.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
