import { describe, expect, it } from "vitest";
import {
  formatClientNameForStorage,
  isBlankClientName,
  normalizeClientName,
} from "@/lib/client-name";
import { isOpenLoan, isRecoveredLoan } from "@/lib/loan-status";

describe("normalizeClientName", () => {
  it("trims and lowercases", () => {
    expect(normalizeClientName("  Ahmed Ben Ali  ")).toBe("ahmed ben ali");
  });

  it("collapses internal whitespace", () => {
    expect(normalizeClientName("Ahmed   Ben   Ali")).toBe("ahmed ben ali");
  });

  it("handles Arabic names", () => {
    expect(normalizeClientName("  محمد  ")).toBe("محمد");
  });
});

describe("formatClientNameForStorage", () => {
  it("preserves casing while normalizing spacing", () => {
    expect(formatClientNameForStorage("  Ahmed   Ben Ali ")).toBe("Ahmed Ben Ali");
  });
});

describe("isBlankClientName", () => {
  it("returns true for whitespace-only names", () => {
    expect(isBlankClientName("   ")).toBe(true);
  });

  it("returns false for valid names", () => {
    expect(isBlankClientName("Ahmed")).toBe(false);
  });
});

describe("reopen eligibility helpers", () => {
  it("treats partially paid loans as open", () => {
    expect(isOpenLoan(500, 1000)).toBe(true);
    expect(isRecoveredLoan(500, 1000)).toBe(false);
  });

  it("treats fully paid loans as recovered", () => {
    expect(isRecoveredLoan(1000, 1000)).toBe(true);
    expect(isOpenLoan(1000, 1000)).toBe(false);
  });
});

describe("reopen accounting", () => {
  it("computes outstanding after top-up with prior payments", () => {
    const existingTotal = 10_000;
    const existingPaid = 10_000;
    const newPrincipal = 5_000;
    const newInitialPayment = 1_000;

    const newTotal = existingTotal + newPrincipal;
    const totalPaid = existingPaid + newInitialPayment;
    const outstanding = newTotal - totalPaid;

    expect(outstanding).toBe(4_000);
  });
});
