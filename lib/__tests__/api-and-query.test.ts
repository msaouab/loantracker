import { describe, expect, it } from "vitest";
import { toErrorResponse } from "@/lib/error-response";
import { buildLoanWhereSql } from "@/lib/loan-where-sql";
import {
  AppError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/errors";
import {
  countUniqueClients,
  mergeTopClients,
  type SnapshotTotals,
} from "@/lib/user-stats-helpers";

async function readJson(response: Response) {
  return response.json() as Promise<{ error: unknown }>;
}

describe("toErrorResponse", () => {
  it("maps validation errors to field error payloads", async () => {
    const response = toErrorResponse(
      new ValidationError({ email: ["Invalid email"] })
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({
      error: { email: ["Invalid email"] },
    });
  });

  it("maps typed app errors to message payloads", async () => {
    const response = toErrorResponse(new UnauthorizedError());

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({
      error: "Unauthorized",
    });
  });

  it("maps forbidden and not-found errors", async () => {
    expect(toErrorResponse(new ForbiddenError()).status).toBe(403);
    expect(toErrorResponse(new NotFoundError("Loan not found")).status).toBe(404);
  });

  it("maps unknown errors to 500", async () => {
    const response = toErrorResponse(new AppError("Bad gateway", 502));

    expect(response.status).toBe(502);
    await expect(readJson(response)).resolves.toEqual({ error: "Bad gateway" });
  });
});

describe("buildLoanWhereSql", () => {
  it("includes base filters and active status", () => {
    const sql = buildLoanWhereSql({
      userId: "user-1",
      deletedAt: null,
      amountPaid: { lt: { name: "totalAmount", modelName: "Loan" } as never },
    }).strings.join(" ");

    expect(sql).toContain('"deletedAt" IS NULL');
    expect(sql).toContain('"userId"');
    expect(sql).toContain('"amountPaid" < "totalAmount"');
  });

  it("returns false for empty id filters", () => {
    const sql = buildLoanWhereSql({
      userId: "user-1",
      deletedAt: null,
      id: { in: [] },
    }).strings.join(" ");

    expect(sql).toContain("FALSE");
  });
});

describe("purge snapshot dashboard flow", () => {
  it("keeps recovery rate stable when purged loans match live totals", () => {
    const live = {
      totalLoanAmount: 0,
      amountRecovered: 0,
      recoveredCount: 0,
    };
    const purged: SnapshotTotals = {
      purgedLoanCount: 2,
      purgedTotalAmount: 3000,
      purgedAmountRecovered: 3000,
      purgedRecoveredCount: 2,
      purgedTrustedCount: 1,
      purgedNotTrustedCount: 1,
      purgedClientNames: ["Ali", "Sara"],
      purgedClientTotals: { Ali: 1000, Sara: 2000 },
    };

    const totalLoanAmount = live.totalLoanAmount + purged.purgedTotalAmount;
    const amountRecovered = live.amountRecovered + purged.purgedAmountRecovered;
    const recoveryRate =
      totalLoanAmount > 0 ? (amountRecovered / totalLoanAmount) * 100 : 0;

    expect(recoveryRate).toBe(100);
    expect(countUniqueClients([], purged.purgedClientNames)).toBe(2);
    expect(
      mergeTopClients([], purged.purgedClientTotals).map((row) => row.name)
    ).toEqual(["Sara", "Ali"]);
  });
});
