import { describe, expect, it } from "vitest";
import type { AccountWire } from "./bankingAdapter";
import { normalizeAccounts } from "./bankingAdapter";

const account = (id: string): AccountWire => ({
  accountId: id,
  bankConnectionId: "connection-1",
  name: "Checking",
  officialName: null,
  type: "depository",
  subtype: "checking",
  mask: "1234",
  currentBalance: 100,
  availableBalance: 80,
  currencyCode: "USD",
  updatedAt: "2026-10-27T00:00:00Z",
});

describe("normalizeAccounts", () => {
  it("de-duplicates repeated API accounts by stable account ID", () => {
    expect(normalizeAccounts([account("a"), account("a"), account("b"), account("a")])).toHaveLength(2);
  });
});
