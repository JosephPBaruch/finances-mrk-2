import type { Account } from "../../shared/api/apiTypes";

export type AccountKind = "cash" | "credit" | "savings" | "investment" | "loan" | "wallet" | "other";

const normalized = (value: string | null | undefined) => (value ?? "").trim().toLowerCase().replaceAll("_", " ");

export function accountKind(account: Account): AccountKind {
  const type = normalized(account.type);
  const subtype = normalized(account.subtype);
  const name = normalized(`${account.name} ${account.officialName ?? ""}`);

  if (type === "credit" || subtype.includes("credit card")) return "credit";
  if (type === "loan" || ["mortgage", "student", "auto"].some((value) => subtype.includes(value))) return "loan";
  if (type === "investment" || ["401k", "403b", "ira", "brokerage", "pension"].some((value) => subtype.includes(value))) return "investment";
  if (name.includes("venmo") || name.includes("paypal") || subtype.includes("cash management")) return "wallet";
  if (subtype.includes("saving") || name.includes("hysa") || name.includes("high yield")) return "savings";
  if (type === "depository" || subtype.includes("checking") || subtype.includes("debit")) return "cash";
  return "other";
}

export function accountKindLabel(kind: AccountKind): string {
  return {
    cash: "Checking & debit",
    credit: "Credit card",
    savings: "Savings & HYSA",
    investment: "Investments & retirement",
    loan: "Loans",
    wallet: "Digital wallet",
    other: "Other",
  }[kind];
}

export function accountDisplayType(account: Account): string {
  const subtype = normalized(account.subtype);
  if (subtype === "401k") return "401(k)";
  if (subtype === "hysa") return "HYSA";
  if (subtype) return subtype.replace(/\b\w/g, (letter) => letter.toUpperCase());
  return accountKindLabel(accountKind(account));
}

export function accountBalance(account: Account): number {
  return account.currentBalance ?? account.availableBalance ?? 0;
}

export function accountNetValue(account: Account): number {
  const balance = accountBalance(account);
  return ["credit", "loan"].includes(accountKind(account)) ? -Math.abs(balance) : balance;
}

export function summarizeAccounts(accounts: Account[]) {
  return accounts.reduce(
    (summary, account) => {
      const value = accountBalance(account);
      const liability = ["credit", "loan"].includes(accountKind(account));
      if (liability) summary.liabilities += Math.abs(value);
      else summary.assets += value;
      summary.netWorth += accountNetValue(account);
      return summary;
    },
    { assets: 0, liabilities: 0, netWorth: 0 },
  );
}
