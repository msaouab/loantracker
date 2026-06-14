import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../app/generated/prisma/client";
import { ActivityActions } from "../lib/activity-log";
import { getDatabaseUrl } from "../lib/database-url";
import { formatCurrency } from "../lib/loans";

const DEMO_EMAIL = "demo@loantracker.local";
const DEMO_PASSWORD = "Demo1234!";
const DEMO_NAME = "Demo Manager";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@loantracker.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin1234!";
const ADMIN_NAME = process.env.ADMIN_NAME ?? "System Admin";

const MANAGER2_EMAIL = "manager2@loantracker.local";
const MANAGER2_NAME = "Karim Benali";

const PENDING_EMAIL = "pending@loantracker.local";
const PENDING_NAME = "Pending User";

const FROZEN_EMAIL = "frozen@loantracker.local";
const FROZEN_NAME = "Frozen User";

const LOAN_COUNT = 100;
const MANAGER2_LOAN_COUNT = 8;

const DEMO_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const SAFARI_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15";

const firstNames = [
  "James", "Maria", "Robert", "Sarah", "Michael", "Emily", "David", "Jessica",
  "Daniel", "Ashley", "Christopher", "Amanda", "Matthew", "Jennifer", "Andrew",
  "Nicole", "Joshua", "Elizabeth", "Ryan", "Samantha", "Brandon", "Rachel",
  "Kevin", "Lauren", "Brian", "Megan", "Justin", "Hannah", "Tyler", "Victoria",
];

const lastNames = [
  "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez",
  "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas",
  "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White",
  "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
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
  const adminPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      fullName: ADMIN_NAME,
      isAdmin: true,
      isActivated: true,
      isFrozen: false,
      lastLoginAt: daysAgo(0, 9),
    },
    create: {
      email: ADMIN_EMAIL,
      password: adminPassword,
      fullName: ADMIN_NAME,
      isAdmin: true,
      isActivated: true,
      isFrozen: false,
      lastLoginAt: daysAgo(0, 9),
    },
  });

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

  const manager2 = await prisma.user.upsert({
    where: { email: MANAGER2_EMAIL },
    update: {
      fullName: MANAGER2_NAME,
      isAdmin: false,
      isActivated: true,
      isFrozen: false,
      lastLoginAt: daysAgo(1, 14),
    },
    create: {
      email: MANAGER2_EMAIL,
      password: demoPassword,
      fullName: MANAGER2_NAME,
      isActivated: true,
      isFrozen: false,
      lastLoginAt: daysAgo(1, 14),
    },
  });

  const pending = await prisma.user.upsert({
    where: { email: PENDING_EMAIL },
    update: {
      fullName: PENDING_NAME,
      isAdmin: false,
      isActivated: false,
      isFrozen: false,
    },
    create: {
      email: PENDING_EMAIL,
      password: demoPassword,
      fullName: PENDING_NAME,
      isActivated: false,
      isFrozen: false,
    },
  });

  const frozen = await prisma.user.upsert({
    where: { email: FROZEN_EMAIL },
    update: {
      fullName: FROZEN_NAME,
      isAdmin: false,
      isActivated: true,
      isFrozen: true,
      sessionVersion: 1,
    },
    create: {
      email: FROZEN_EMAIL,
      password: demoPassword,
      fullName: FROZEN_NAME,
      isActivated: true,
      isFrozen: true,
      sessionVersion: 1,
    },
  });

  const loanUserIds = [demo.id, manager2.id];
  const activityUserIds = [admin.id, demo.id, manager2.id, pending.id, frozen.id];

  await prisma.activityLog.deleteMany({
    where: { userId: { in: activityUserIds } },
  });

  await prisma.loan.deleteMany({
    where: { userId: { in: loanUserIds } },
  });

  const demoLoans: Array<{
    id: string;
    clientName: string;
    totalAmount: number;
    amountPaid: number;
  }> = [];

  for (let index = 0; index < LOAN_COUNT; index += 1) {
    const totalAmount = randomAmount(1000, 50000, index + 1);
    const paidRatio = paidRatioForIndex(index);
    const amountPaid = amountPaidForTotal(totalAmount, paidRatio);
    const loanDate = loanDateForIndex(index);
    const clientName = `${pick(firstNames, index)} ${pick(lastNames, index + 7)}`;

    const loan = await prisma.loan.create({
      data: {
        userId: demo.id,
        clientName,
        totalAmount,
        amountPaid,
        loanDate,
        description: pick(descriptions, index),
        clientTrust: index % 3 !== 0,
        deletedAt: index < 3 ? daysAgo(2) : null,
      },
    });

    demoLoans.push({
      id: loan.id,
      clientName,
      totalAmount,
      amountPaid,
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

  const manager2Loans: Array<{
    id: string;
    clientName: string;
    totalAmount: number;
  }> = [];

  for (let index = 0; index < MANAGER2_LOAN_COUNT; index += 1) {
    const totalAmount = randomAmount(2000, 15000, index + 50);
    const amountPaid = amountPaidForTotal(totalAmount, paidRatioForIndex(index + 2));
    const loanDate = daysAgo(10 + index * 4);
    const clientName = `${pick(firstNames, index + 11)} ${pick(lastNames, index + 3)}`;

    const loan = await prisma.loan.create({
      data: {
        userId: manager2.id,
        clientName,
        totalAmount,
        amountPaid,
        loanDate,
        description: pick(descriptions, index + 2),
        clientTrust: index % 2 === 0,
      },
    });

    manager2Loans.push({ id: loan.id, clientName, totalAmount });

    const installments = buildPaymentInstallments(
      totalAmount,
      amountPaid,
      loanDate,
      index + 4
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
  const deletedLoans = demoLoans.slice(0, 3);

  const activityLogs: ActivitySeed[] = [
    {
      userId: admin.id,
      action: ActivityActions.AUTH_LOGIN,
      summary: buildAuthSummary(ActivityActions.AUTH_LOGIN, "Chrome", "192.168.1.5"),
      entityType: "session",
      ipAddress: "192.168.1.5",
      browser: "Chrome",
      userAgent: DEMO_USER_AGENT,
      createdAt: daysAgo(0, 9),
    },
    {
      userId: admin.id,
      action: ActivityActions.USER_CREATED,
      summary: `Created account for ${PENDING_NAME}`,
      entityType: "user",
      entityId: pending.id,
      metadata: { email: PENDING_EMAIL, isAdmin: false },
      createdAt: daysAgo(30, 10),
    },
    {
      userId: admin.id,
      action: ActivityActions.USER_CREATED,
      summary: `Created account for ${FROZEN_NAME}`,
      entityType: "user",
      entityId: frozen.id,
      metadata: { email: FROZEN_EMAIL, isAdmin: false },
      createdAt: daysAgo(25, 11),
    },
    {
      userId: admin.id,
      action: ActivityActions.USER_CREATED,
      summary: `Created account for ${MANAGER2_NAME}`,
      entityType: "user",
      entityId: manager2.id,
      metadata: { email: MANAGER2_EMAIL, isAdmin: false },
      createdAt: daysAgo(20, 15),
    },
    {
      userId: admin.id,
      action: ActivityActions.USER_APPROVED,
      summary: `Approved account for ${MANAGER2_NAME}`,
      entityType: "user",
      entityId: manager2.id,
      metadata: { email: MANAGER2_EMAIL },
      createdAt: daysAgo(20, 15, 5),
    },
    {
      userId: admin.id,
      action: ActivityActions.USER_FROZEN,
      summary: `Froze account for ${FROZEN_NAME}`,
      entityType: "user",
      entityId: frozen.id,
      metadata: { email: FROZEN_EMAIL },
      createdAt: daysAgo(10, 16),
    },
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
    {
      userId: manager2.id,
      action: ActivityActions.AUTH_LOGIN,
      summary: buildAuthSummary(ActivityActions.AUTH_LOGIN, "Firefox", "10.0.0.42"),
      entityType: "session",
      ipAddress: "10.0.0.42",
      browser: "Firefox",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
      createdAt: daysAgo(1, 14),
    },
    {
      userId: manager2.id,
      action: ActivityActions.LOAN_CREATED,
      summary: `Created loan for ${manager2Loans[0].clientName} (${formatCurrency(manager2Loans[0].totalAmount)})`,
      entityType: "loan",
      entityId: manager2Loans[0].id,
      metadata: {
        clientName: manager2Loans[0].clientName,
        totalAmount: manager2Loans[0].totalAmount,
      },
      createdAt: daysAgo(10, 15),
    },
    {
      userId: manager2.id,
      action: ActivityActions.LOAN_CREATED,
      summary: `Created loan for ${manager2Loans[1].clientName} (${formatCurrency(manager2Loans[1].totalAmount)})`,
      entityType: "loan",
      entityId: manager2Loans[1].id,
      metadata: {
        clientName: manager2Loans[1].clientName,
        totalAmount: manager2Loans[1].totalAmount,
      },
      createdAt: daysAgo(6, 12),
    },
  ];

  await seedActivityLogs(prisma, activityLogs);

  console.log("Database seeded successfully.\n");

  console.log("Demo manager (100 loans, activity history):");
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);

  console.log("\nSecond manager (8 loans):");
  console.log(`  Email:    ${MANAGER2_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);

  console.log("\nAdmin account:");
  console.log(`  Email:    ${admin.email}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);

  console.log("\nPending approval (cannot sign in):");
  console.log(`  Email:    ${PENDING_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);

  console.log("\nFrozen account (blocked at login):");
  console.log(`  Email:    ${FROZEN_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);

  console.log("\nSeeded data summary:");
  console.log(`  Loans:         ${LOAN_COUNT + MANAGER2_LOAN_COUNT} (${LOAN_COUNT} demo + ${MANAGER2_LOAN_COUNT} manager2)`);
  console.log(`  Soft-deleted:  3 demo loans`);
  console.log(`  Activity logs: ${activityLogs.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
