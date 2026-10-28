import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Account, BankConnection, FinanceTransaction, UserCategory } from "../shared/api/apiTypes";
import { bankingApi } from "../features/banking/bankingApi";
import { transactionApi } from "../features/transactions/transactionApi";
import { categoryApi } from "../features/categories/categoryApi";

type AppDataContextValue = {
  connections: BankConnection[];
  accounts: Account[];
  transactions: FinanceTransaction[];
  categories: UserCategory[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [categories, setCategories] = useState<UserCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextConnections, nextAccounts, nextTransactions, nextCategories] = await Promise.all([
        bankingApi.getConnections(),
        bankingApi.getAccounts(),
        transactionApi.getAll(),
        categoryApi.getAll(),
      ]);
      setConnections(nextConnections);
      setAccounts(nextAccounts);
      setTransactions(nextTransactions);
      setCategories(nextCategories);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load finance data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ connections, accounts, transactions, categories, loading, error, refresh }),
    [connections, accounts, transactions, categories, loading, error, refresh],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const context = useContext(AppDataContext);
  if (!context) throw new Error("useAppData must be used inside AppDataProvider.");
  return context;
}
