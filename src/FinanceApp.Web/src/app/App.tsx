import { CssBaseline, StyledEngineProvider, ThemeProvider } from "@mui/material";
import { lazy, Suspense, useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { NotificationProvider } from "../shared/notifications/NotificationProvider";
import { AppDataProvider } from "./AppDataProvider";
import { AppShell } from "./AppShell";
import { createAppTheme } from "./appTheme";
import { AuthProvider, useAuth } from "../features/auth/AuthProvider";
import { AuthPage } from "../features/auth/AuthPage";

const SummaryPage = lazy(() => import("../features/analytics/SummaryPage"));
const AccountsPage = lazy(() => import("../features/accounts/AccountsPage"));
const TransactionsPage = lazy(() => import("../features/transactions/TransactionsPage"));
const CategoriesPage = lazy(() => import("../features/categories/CategoriesPage"));
const BudgetPage = lazy(() => import("../features/budgets/BudgetPage"));

function FinanceWorkspace({ darkMode, onToggleTheme }: { darkMode: boolean; onToggleTheme: () => void }) {
  const { status, loading } = useAuth();
  if (loading || !status || !status.isAuthenticated) return <AuthPage />;

  return (
    <NotificationProvider>
      <AppDataProvider>
        <BrowserRouter>
          <Suspense fallback={<div className="route-loading">Loading your finances…</div>}>
            <Routes>
              <Route element={<AppShell darkMode={darkMode} onToggleTheme={onToggleTheme} />}>
                <Route path="/summary" element={<SummaryPage />} />
                <Route path="/accounts" element={<AccountsPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/budget" element={<BudgetPage />} />
                <Route path="*" element={<Navigate to="/transactions" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AppDataProvider>
    </NotificationProvider>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") !== "false");
  const theme = useMemo(() => createAppTheme(darkMode ? "dark" : "light"), [darkMode]);
  const toggleTheme = () => {
    setDarkMode((current) => {
      localStorage.setItem("darkMode", String(!current));
      return !current;
    });
  };

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <FinanceWorkspace darkMode={darkMode} onToggleTheme={toggleTheme} />
        </AuthProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
