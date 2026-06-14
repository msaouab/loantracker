import { describe, expect, it } from "vitest";
import { toErrorResponse } from "@/lib/error-response";
import { apiOk } from "@/lib/api-response";
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
import { getActivityTabs } from "@/lib/activity-log";

async function readJson(response: Response) {
  return response.json() as Promise<{ error: unknown }>;
}

describe("toErrorResponse (unified envelope)", () => {
  it("maps validation errors to a fields payload", async () => {
    const response = toErrorResponse(
      new ValidationError({ email: ["Invalid email"] })
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({
      success: false,
      error: {
        message: "Validation failed",
        code: "validation_error",
        fields: { email: ["Invalid email"] },
      },
    });
  });

  it("maps typed app errors to a message + code", async () => {
    const response = toErrorResponse(new UnauthorizedError());

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({
      success: false,
      error: { message: "Unauthorized", code: "unauthorized" },
    });
  });

  it("maps forbidden and not-found errors", async () => {
    expect(toErrorResponse(new ForbiddenError()).status).toBe(403);
    expect(toErrorResponse(new NotFoundError("Loan not found")).status).toBe(404);
  });

  it("maps unknown errors to 500", async () => {
    const response = toErrorResponse(new AppError("Bad gateway", 502));

    expect(response.status).toBe(502);
    await expect(readJson(response)).resolves.toEqual({
      success: false,
      error: { message: "Bad gateway", code: "error" },
    });
  });
});

describe("apiOk (unified envelope)", () => {
  it("wraps payloads as { success: true, data }", async () => {
    const response = apiOk({ loan: { id: "l1" } }, { status: 201 });
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { loan: { id: "l1" } },
    });
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

describe("getActivityTabs role scoping", () => {
  it("shows loans/payments to managers but not the users tab", () => {
    const ids = getActivityTabs(false).map((tab) => tab.id);
    expect(ids).toContain("loans");
    expect(ids).toContain("payments");
    expect(ids).not.toContain("users");
  });

  it("shows the users tab to admins but hides loans/payments", () => {
    const ids = getActivityTabs(true).map((tab) => tab.id);
    expect(ids).toContain("users");
    expect(ids).toContain("security");
    expect(ids).toContain("account");
    expect(ids).not.toContain("loans");
    expect(ids).not.toContain("payments");
  });
});
