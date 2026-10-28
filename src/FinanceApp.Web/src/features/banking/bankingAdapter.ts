import type { Account, BankConnection } from "../../shared/api/apiTypes";

export type AccountWire = Omit<Account, "accountId"> & {
  accountId?: string;
  id?: string;
};

export type BankConnectionWire = Omit<BankConnection, "bankConnectionId" | "accounts"> & {
  bankConnectionId?: string;
  id?: string;
  accounts: AccountWire[];
};

function requiredId(currentName: string, currentValue: string | undefined, legacyValue: string | undefined): string {
  const value = currentValue ?? legacyValue;
  if (!value) throw new Error(`The API response did not include ${currentName} or legacy id.`);
  return value;
}

export function normalizeAccount(account: AccountWire): Account {
  const { id, ...current } = account;
  return { ...current, accountId: requiredId("accountId", account.accountId, id) };
}

export function normalizeAccounts(accounts: AccountWire[]): Account[] {
  const unique = new Map<string, Account>();
  accounts.forEach((account) => {
    const normalized = normalizeAccount(account);
    unique.set(normalized.accountId, normalized);
  });
  return [...unique.values()];
}

export function normalizeConnection(connection: BankConnectionWire): BankConnection {
  const { id, ...current } = connection;
  return {
    ...current,
    bankConnectionId: requiredId("bankConnectionId", connection.bankConnectionId, id),
    accounts: normalizeAccounts(connection.accounts),
  };
}
