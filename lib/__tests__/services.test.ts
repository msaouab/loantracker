import { describe, expect, it } from "vitest";
import { anonymizeIp } from "@/lib/ip-anonymization";
import { computeRecoveredAt } from "@/lib/loan-recovery";
import {
  countUniqueAdminClients,
  countUniqueClients,
  mergeSnapshotTotals,
  mergeTopClients,
} from "@/lib/user-stats-helpers";

describe("anonymizeIp", () => {
  it("masks the last IPv4 octet", () => {
    expect(anonymizeIp("203.0.113.45")).toBe("203.0.113.0");
  });

  it("truncates IPv6 addresses", () => {
    expect(anonymizeIp("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe(
      "2001:0db8:85a3:0000:xxxx"
    );
  });
});

describe("computeRecoveredAt", () => {
  it("sets recoveredAt when a loan becomes fully paid", () => {
    const recoveredAt = computeRecoveredAt(1000, 1000, null);
    expect(recoveredAt).toBeInstanceOf(Date);
  });

  it("clears recoveredAt when payment drops below total", () => {
    expect(computeRecoveredAt(500, 1000, new Date())).toBeNull();
  });

  it("preserves the original recoveredAt timestamp", () => {
    const original = new Date("2026-01-01T00:00:00.000Z");
    expect(computeRecoveredAt(1000, 1000, original)).toBe(original);
  });
});

describe("user stats helpers", () => {
  it("merges snapshot totals across users", () => {
    const merged = mergeSnapshotTotals([
      {
        purgedLoanCount: 1,
        purgedTotalAmount: 1000,
        purgedAmountRecovered: 1000,
        purgedRecoveredCount: 1,
        purgedTrustedCount: 1,
        purgedNotTrustedCount: 0,
        purgedClientNames: ["Ali"],
        purgedClientTotals: { Ali: 1000 },
      },
      {
        purgedLoanCount: 2,
        purgedTotalAmount: 2500,
        purgedAmountRecovered: 2500,
        purgedRecoveredCount: 2,
        purgedTrustedCount: 0,
        purgedNotTrustedCount: 2,
        purgedClientNames: ["Sara"],
        purgedClientTotals: { Sara: 2500 },
      },
    ]);

    expect(merged.purgedTotalAmount).toBe(3500);
    expect(merged.purgedRecoveredCount).toBe(3);
    expect(merged.purgedClientNames).toEqual(["Ali", "Sara"]);
  });

  it("counts unique clients for a single user", () => {
    expect(countUniqueClients(["Ali", "Sara"], ["Sara", "Omar"])).toBe(3);
  });

  it("counts unique clients per manager in admin view", () => {
    expect(
      countUniqueAdminClients(
        [
          { userId: "u1", clientName: "Ali" },
          { userId: "u2", clientName: "Ali" },
        ],
        [{ userId: "u1", clientNames: ["Sara"] }]
      )
    ).toBe(3);
  });

  it("merges live and purged top clients", () => {
    expect(
      mergeTopClients(
        [{ name: "Ali", amount: 1000 }],
        { Sara: 2000, Ali: 500 }
      )
    ).toEqual([
      { name: "Sara", amount: 2000 },
      { name: "Ali", amount: 1500 },
    ]);
  });
});
