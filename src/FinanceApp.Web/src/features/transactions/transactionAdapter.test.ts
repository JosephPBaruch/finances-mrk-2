import { describe, expect, it } from "vitest";
import { normalizeTransaction, type TransactionWire } from "./transactionAdapter";

const legacyTransaction: TransactionWire = {
  id: "d85cf52e-3951-4e08-a806-df2f3f54de20",
  financialAccountId: "9f549322-188a-460d-8729-5c144064ca40",
  plaidTransactionId: "plaid-transaction",
  date: "2026-10-26",
  authorizedDate: null,
  name: "United Airlines",
  merchantName: "United Airlines",
  amount: 500,
  currencyCode: "USD",
  pending: false,
  plaidPrimaryCategory: "TRAVEL",
  plaidDetailedCategory: "TRAVEL_FLIGHTS",
  plaidCategoryConfidence: "VERY_HIGH",
  userCategoryId: null,
  isReviewed: false,
  notes: null,
  updatedAt: "2026-10-27T02:26:40.241599+00:00",
};

describe("transaction adapter", () => {
  it("normalizes legacy id fields used by older API versions", () => {
    const normalized = normalizeTransaction(legacyTransaction);

    expect(normalized.transactionId).toBe(legacyTransaction.id);
    expect(normalized.accountId).toBe(legacyTransaction.financialAccountId);
  });

  it("prefers the current API field names", () => {
    const normalized = normalizeTransaction({
      ...legacyTransaction,
      transactionId: "current-transaction",
      accountId: "current-account",
    });

    expect(normalized.transactionId).toBe("current-transaction");
    expect(normalized.accountId).toBe("current-account");
  });
});
