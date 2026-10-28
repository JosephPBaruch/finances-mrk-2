import { describe, expect, it } from "vitest";
import type { Account } from "../../shared/api/apiTypes";
import { accountKind, summarizeAccounts } from "./accountUtils";

const makeAccount = (type: string, subtype: string, balance: number, name = "Account"): Account => ({
  accountId: crypto.randomUUID(), bankConnectionId: "bank", name, officialName: null,
  type, subtype, mask: null, currentBalance: balance, availableBalance: null,
  currencyCode: "USD", updatedAt: "2026-10-27T00:00:00Z",
});

describe("account utilities", () => {
  it("recognizes common cash, liability, wallet, and investment accounts", () => {
    expect(accountKind(makeAccount("depository", "checking", 10))).toBe("cash");
    expect(accountKind(makeAccount("credit", "credit card", 10))).toBe("credit");
    expect(accountKind(makeAccount("depository", "checking", 10, "Venmo"))).toBe("wallet");
    expect(accountKind(makeAccount("investment", "401k", 10))).toBe("investment");
  });

  it("subtracts liabilities from net worth", () => {
    expect(summarizeAccounts([
      makeAccount("depository", "savings", 10_000),
      makeAccount("credit", "credit card", 1_200),
    ])).toEqual({ assets: 10_000, liabilities: 1_200, netWorth: 8_800 });
  });
});
