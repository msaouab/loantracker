import { describe, expect, it } from "vitest";
import { computeDashboardStats } from "@/lib/dashboard-stats";

const bi = (value: number) => BigInt(value);

function metrics(overrides: Partial<Record<string, bigint>> = {}) {
  return {
    open_clients: bi(2),
    full_budget: bi(3000),
    open_amount_paid: bi(1000),
    outstanding: bi(2000),
    active_count: bi(2),
    recovered_count: bi(1),
    recovered_amount: bi(5000),
    open_trusted_count: bi(1),
    open_not_trusted_count: bi(1),
    ...overrides,
  };
}

describe("computeDashboardStats", () => {
  it("uses open-loan totals only for active recovery metrics", () => {
    const stats = computeDashboardStats(
      metrics(),
      [
        { name: "Ali", amount: bi(2000) },
        { name: "Sara", amount: bi(1000) },
      ],
      ["Omar"]
    );

    expect(stats.totalLoanAmount).toBe(3000);
    expect(stats.amountRecovered).toBe(1000);
    expect(stats.outstanding).toBe(2000);
    expect(stats.recoveryRate).toBeCloseTo(33.3, 1);
    expect(stats.recoveryProgress).toEqual({ recovered: 1000, outstanding: 2000 });
    expect(stats.ifAllRecovered).toBe(3000);
    expect(stats.recoveredClients).toBe(1);
    expect(stats.recoveredAmount).toBe(5000);
    expect(stats.recoveredLoanCount).toBe(1);
  });

  it("merges purged recovered history into recovered KPIs", () => {
    const stats = computeDashboardStats(
      metrics({
        recovered_count: bi(1),
        recovered_amount: bi(2000),
      }),
      [],
      ["Ali"],
      {
        purgedAmountRecovered: 3000,
        purgedRecoveredCount: 2,
        purgedClientNames: ["Sara", "Omar"],
      }
    );

    expect(stats.recoveredClients).toBe(3);
    expect(stats.recoveredAmount).toBe(5000);
    expect(stats.recoveredLoanCount).toBe(3);
  });

  it("deduplicates recovered clients across live and purged history", () => {
    const stats = computeDashboardStats(metrics(), [], ["Ali"], {
      purgedAmountRecovered: 1000,
      purgedRecoveredCount: 1,
      purgedClientNames: ["Ali", "Sara"],
    });

    expect(stats.recoveredClients).toBe(2);
  });

  it("returns zero recovery rate when there are no open loans", () => {
    const stats = computeDashboardStats(
      metrics({
        open_clients: bi(0),
        full_budget: bi(0),
        open_amount_paid: bi(0),
        outstanding: bi(0),
        active_count: bi(0),
        open_trusted_count: bi(0),
        open_not_trusted_count: bi(0),
      }),
      [],
      []
    );

    expect(stats.recoveryRate).toBe(0);
    expect(stats.totalLoanAmount).toBe(0);
  });
});
