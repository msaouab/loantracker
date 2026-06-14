import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { getDatabaseUrl } from "../lib/database-url";

const DEMO_EMAIL = "demo@loantracker.local";
const DEMO_PASSWORD = "Demo1234!";
const DEMO_NAME = "Demo Manager";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@loantracker.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin1234!";
const ADMIN_NAME = process.env.ADMIN_NAME ?? "System Admin";
const LOAN_COUNT = 100;

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

function loanDateForIndex(index: number): Date {
  const daysAgo = [3, 7, 14, 21, 35, 45, 60, 75, 90, 120][index % 10];
  const date = new Date();
  date.setDate(date.getDate() - daysAgo - (index % 5));
  date.setHours(12, 0, 0, 0);
  return date;
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

    return { amount, paidAt };
  });
}

async function main() {
  const adapter = new PrismaPg({
    connectionString: getDatabaseUrl(),
  });
  const prisma = new PrismaClient({ adapter });

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 12);
  const adminPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      fullName: ADMIN_NAME,
      isAdmin: true,
      isActivated: true,
      isFrozen: false,
    },
    create: {
      email: ADMIN_EMAIL,
      password: adminPassword,
      fullName: ADMIN_NAME,
      isAdmin: true,
      isActivated: true,
      isFrozen: false,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      fullName: DEMO_NAME,
      isActivated: true,
    },
    create: {
      email: DEMO_EMAIL,
      password: hashedPassword,
      fullName: DEMO_NAME,
      isActivated: true,
    },
  });

  await prisma.loan.deleteMany({
    where: { userId: user.id },
  });

  for (let index = 0; index < LOAN_COUNT; index += 1) {
    const totalAmount = randomAmount(1000, 50000, index + 1);
    const paidRatio = paidRatioForIndex(index);
    const amountPaid = amountPaidForTotal(totalAmount, paidRatio);
    const loanDate = loanDateForIndex(index);

    const loan = await prisma.loan.create({
      data: {
        userId: user.id,
        clientName: `${pick(firstNames, index)} ${pick(lastNames, index + 7)}`,
        totalAmount,
        amountPaid,
        loanDate,
        description: pick(descriptions, index),
        clientTrust: index % 3 !== 0,
      },
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
        })),
      });
    }
  }

  console.log(`Seeded ${LOAN_COUNT} loans for demo user:`);
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log("");
  console.log("Admin account:");
  console.log(`  Email:    ${admin.email}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`  Admin ID: ${admin.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
