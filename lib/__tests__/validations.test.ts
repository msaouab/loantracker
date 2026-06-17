import { describe, expect, it } from "vitest";
import { createCreateLoanSchema } from "@/lib/validations";

const messages = {
  fullNameRequired: "Full name is required",
  invalidEmail: "Invalid email address",
  passwordMin: "Password must be at least 8 characters",
  passwordRequired: "Password is required",
  passwordsMismatch: "Passwords do not match",
  clientNameRequired: "Client name is required",
  totalAmountInt: "Total amount must be a whole number",
  totalAmountPositive: "Total amount must be greater than 0",
  amountPaidInt: "Amount paid must be a whole number",
  amountPaidNegative: "Amount paid cannot be negative",
  amountPaidExceedsTotal: "Amount paid cannot exceed total amount",
  paymentAmountInt: "Payment amount must be a whole number",
  paymentAmountPositive: "Payment amount must be greater than 0",
  currentPasswordRequired: "Current password is required",
  currentPasswordIncorrect: "Current password is incorrect",
  newPasswordDifferent: "New password must be different from your current password",
};

const schema = createCreateLoanSchema(messages);

const baseLoan = {
  clientName: "Ali",
  totalAmount: 1000,
  clientTrust: true,
};

describe("createCreateLoanSchema", () => {
  it("defaults missing amountPaid to 0", () => {
    const result = schema.safeParse(baseLoan);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amountPaid).toBe(0);
    }
  });

  it("coerces empty amountPaid to 0", () => {
    const result = schema.safeParse({ ...baseLoan, amountPaid: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amountPaid).toBe(0);
    }
  });

  it("rejects amountPaid greater than totalAmount", () => {
    const result = schema.safeParse({ ...baseLoan, amountPaid: 1500 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.amountPaid).toContain(
        messages.amountPaidExceedsTotal
      );
    }
  });

  it("accepts amountPaid equal to totalAmount", () => {
    const result = schema.safeParse({ ...baseLoan, amountPaid: 1000 });
    expect(result.success).toBe(true);
  });
});
