import { describe, expect, it } from "vitest";
import type { FinanceTransaction } from "../../shared/api/apiTypes";
import { EMPTY_BUDGET_VALUES } from "./budgetConstants";
import {
  calculateActuals,
  isInPeriod,
  previousPeriod,
  recommendationStatus,
  relativeSavedAt,
  totalOutflowStatus,
} from "./budgetUtils";

const transaction = (overrides: Partial<FinanceTransaction>): FinanceTransaction => ({
  transactionId: "transaction-1",
  accountId: "account-1",
  plaidTransactionId: "plaid-1",
  date: "2026-10-10",
  authorizedDate: null,
  name: "Test",
  merchantName: null,
  amount: 25,
  currencyCode: "USD",
  pending: false,
  plaidPrimaryCategory: "FOOD_AND_DRINK",
  plaidDetailedCategory: "FOOD_AND_DRINK_GROCERIES",
  plaidCategoryConfidence: "HIGH",
  userCategoryId: null,
  isReviewed: false,
  notes: null,
  updatedAt: "2026-10-10T00:00:00Z",
  ...overrides,
});

describe("budget utilities", () => {
  it("matches ISO transaction dates to a month", () => {
    expect(isInPeriod("2026-10-31", 10, 2026)).toBe(true);
    expect(isInPeriod("10/31/2026", 10, 2026)).toBe(false);
  });

  it("rolls January back to December", () => {
    expect(previousPeriod(1, 2026)).toEqual({ month: 12, year: 2025 });
  });

  it("uses maximum semantics for spending targets", () => {
    expect(recommendationStatus("Fixed Necessities", 30)).toBe("favorable");
    expect(recommendationStatus("Fixed Necessities", 40)).toBe("unfavorable");
  });

  it("uses minimum semantics for savings targets", () => {
    expect(recommendationStatus("Savings & Investing", 20)).toBe("favorable");
    expect(recommendationStatus("Savings & Investing", 10)).toBe("unfavorable");
  });

  it("treats the 98–102 percent total outflow range as inclusive", () => {
    expect(totalOutflowStatus(1000, 980)).toBe("favorable");
    expect(totalOutflowStatus(1000, 1020)).toBe("favorable");
    expect(totalOutflowStatus(1000, 979)).toBe("unfavorable");
  });

  it("applies a user category override to actual spending", () => {
    const actuals = calculateActuals([transaction({})], 10, 2026, { FOOD_AND_DRINK: "Lifestyle & Fun" });
    expect(actuals["Lifestyle & Fun"]).toBe(25);
    expect(actuals["Variable Necessities"]).toBe(0);
    expect(Object.keys(actuals)).toEqual(Object.keys(EMPTY_BUDGET_VALUES));
  });

  it("formats relative save times", () => {
    const now = new Date("2026-10-26T12:00:30Z").getTime();
    expect(relativeSavedAt("2026-10-26T12:00:28Z", now)).toBe("just now");
    expect(relativeSavedAt("2026-10-26T12:00:00Z", now)).toBe("30s ago");
  });
});
