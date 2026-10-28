import { describe, expect, it } from "vitest";
import type { FinanceTransaction } from "../../shared/api/apiTypes";
import { needsCategoryReview } from "./confidenceUtils";

const transaction = (confidence: string | null, userCategoryId: string | null = null) => ({
  transactionId: "transaction", accountId: "account", plaidTransactionId: "plaid", date: "2026-10-27",
  authorizedDate: null, name: "Coffee", merchantName: null, amount: 4, currencyCode: "USD", pending: false,
  plaidPrimaryCategory: "FOOD_AND_DRINK", plaidDetailedCategory: null, plaidCategoryConfidence: confidence,
  userCategoryId, userCategoryName: null, isReviewed: false, notes: null, updatedAt: "2026-10-27T00:00:00Z",
}) satisfies FinanceTransaction;

describe("needsCategoryReview", () => {
  it("flags low or missing Plaid confidence unless the user assigned a category", () => {
    expect(needsCategoryReview(transaction("LOW"))).toBe(true);
    expect(needsCategoryReview(transaction(null))).toBe(true);
    expect(needsCategoryReview(transaction("LOW", "category"))).toBe(false);
    expect(needsCategoryReview(transaction("VERY_HIGH"))).toBe(false);
  });
});
