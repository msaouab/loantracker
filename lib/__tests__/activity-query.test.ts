import { describe, expect, it } from "vitest";
import {
  getActivityDateWhere,
  parseActivityCategory,
  parseActivitySearch,
  parseActivityUserIds,
} from "@/lib/activity-query";
import { endOfDay, startOfDay } from "@/lib/dates";

describe("parseActivityCategory", () => {
  it("returns undefined for all or missing values", () => {
    expect(parseActivityCategory(null)).toBeUndefined();
    expect(parseActivityCategory("all")).toBeUndefined();
  });

  it("parses known categories", () => {
    expect(parseActivityCategory("security")).toBe("security");
    expect(parseActivityCategory("users")).toBe("users");
  });
});

describe("parseActivitySearch", () => {
  it("trims and drops empty search", () => {
    expect(parseActivitySearch("  loan  ")).toBe("loan");
    expect(parseActivitySearch("   ")).toBeUndefined();
    expect(parseActivitySearch(null)).toBeUndefined();
  });
});

describe("parseActivityUserIds", () => {
  it("deduplicates and trims user ids", () => {
    expect(parseActivityUserIds([" user-1 ", "user-2", "user-1"])).toEqual([
      "user-1",
      "user-2",
    ]);
  });

  it("returns undefined when no ids are provided", () => {
    expect(parseActivityUserIds(null)).toBeUndefined();
    expect(parseActivityUserIds([])).toBeUndefined();
    expect(parseActivityUserIds(["", "   "])).toBeUndefined();
  });
});

describe("getActivityDateWhere", () => {
  it("builds a createdAt range when dates are provided", () => {
    const where = getActivityDateWhere("2026-06-01", "2026-06-17");
    const from = startOfDay(new Date(2026, 5, 1));
    const to = endOfDay(new Date(2026, 5, 17));

    expect(where?.createdAt).toEqual({
      gte: from,
      lte: to,
    });
  });

  it("returns undefined when no dates are provided", () => {
    expect(getActivityDateWhere(null, null)).toBeUndefined();
  });
});
