import type { FinanceTransaction, PagedResponse } from "../../shared/api/apiTypes";

export type TransactionWire = Omit<FinanceTransaction, "transactionId" | "accountId"> & {
  transactionId?: string;
  id?: string;
  accountId?: string;
  financialAccountId?: string;
};

export type TransactionPageWire = Omit<PagedResponse<TransactionWire>, "items"> & {
  items: TransactionWire[];
};

function requiredId(currentName: string, currentValue: string | undefined, legacyName: string, legacyValue: string | undefined): string {
  const value = currentValue ?? legacyValue;
  if (!value) throw new Error(`The API response did not include ${currentName} or legacy ${legacyName}.`);
  return value;
}

export function normalizeTransaction(transaction: TransactionWire): FinanceTransaction {
  const { id, financialAccountId, ...current } = transaction;
  return {
    ...current,
    transactionId: requiredId("transactionId", transaction.transactionId, "id", id),
    accountId: requiredId("accountId", transaction.accountId, "financialAccountId", financialAccountId),
  };
}

export function normalizeTransactionPage(page: TransactionPageWire): PagedResponse<FinanceTransaction> {
  return { ...page, items: page.items.map(normalizeTransaction) };
}
