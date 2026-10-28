import AccountBalanceRounded from "@mui/icons-material/AccountBalanceRounded";
import CreditCardRounded from "@mui/icons-material/CreditCardRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import SavingsRounded from "@mui/icons-material/SavingsRounded";
import ShowChartRounded from "@mui/icons-material/ShowChartRounded";
import WalletRounded from "@mui/icons-material/WalletRounded";
import {
  Alert, Box, Button, Card, CardContent, Chip, LinearProgress, MenuItem, Stack, TextField, Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useAppData } from "../../app/AppDataProvider";
import { useNotification } from "../../shared/notifications/NotificationProvider";
import { bankingApi } from "../banking/bankingApi";
import { formatCurrency } from "../budgets/budgetUtils";
import {
  accountBalance, accountDisplayType, accountKind, accountKindLabel, summarizeAccounts, type AccountKind,
} from "./accountUtils";
import "./AccountsPage.scss";

const kinds: Array<AccountKind | "all"> = ["all", "cash", "savings", "wallet", "credit", "investment", "loan", "other"];

const kindIcon = (kind: AccountKind) => {
  if (kind === "credit") return <CreditCardRounded />;
  if (kind === "savings") return <SavingsRounded />;
  if (kind === "investment") return <ShowChartRounded />;
  if (kind === "wallet") return <WalletRounded />;
  return <AccountBalanceRounded />;
};

export default function AccountsPage() {
  const { accounts, connections, loading, error, refresh } = useAppData();
  const { notify } = useNotification();
  const [filter, setFilter] = useState<AccountKind | "all">("all");
  const [refreshing, setRefreshing] = useState(false);
  const totals = useMemo(() => summarizeAccounts(accounts), [accounts]);
  const connectionNames = useMemo(
    () => new Map(connections.map((connection) => [connection.bankConnectionId, connection.institutionName ?? "Connected institution"])),
    [connections],
  );
  const visibleAccounts = filter === "all" ? accounts : accounts.filter((account) => accountKind(account) === filter);

  const refreshBalances = async () => {
    setRefreshing(true);
    try {
      await Promise.all([...new Set(accounts.map((account) => account.bankConnectionId))].map(bankingApi.refreshConnectionAccounts));
      await refresh();
      notify("Account balances refreshed.", "success");
    } catch (requestError) {
      notify(requestError instanceof Error ? requestError.message : "Unable to refresh balances.", "error");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="page accounts">
      <header className="page__header">
        <Box>
          <span className="page__eyebrow">Everything you own and owe</span>
          <Typography component="h1" className="page__title">Accounts</Typography>
          <p className="page__subtitle">Balances across cash, cards, wallets, savings, investments, and loans in one place.</p>
        </Box>
        <Button variant="contained" startIcon={<RefreshRounded />} disabled={refreshing || accounts.length === 0} onClick={() => void refreshBalances()}>
          {refreshing ? "Refreshing…" : "Refresh balances"}
        </Button>
      </header>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      <Box className="accounts__totals">
        {[
          ["Estimated net worth", totals.netWorth, "net"],
          ["Total assets", totals.assets, "asset"],
          ["Total liabilities", totals.liabilities, "liability"],
          ["Connected accounts", accounts.length, "count"],
        ].map(([label, value, tone]) => (
          <Card key={label} className={`accounts__total accounts__total--${tone}`}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">{label}</Typography>
              <Typography variant="h4" mt={0.6}>{tone === "count" ? value : formatCurrency(Number(value))}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2} mb={2} flexWrap="wrap">
        <Box>
          <Typography variant="h6" fontWeight={750}>Your accounts</Typography>
          <Typography variant="body2" color="text.secondary">Current and available balances from Plaid</Typography>
        </Box>
        <TextField select label="Account type" value={filter} onChange={(event) => setFilter(event.target.value as AccountKind | "all")} sx={{ minWidth: 210 }}>
          {kinds.map((kind) => <MenuItem key={kind} value={kind}>{kind === "all" ? "All account types" : accountKindLabel(kind)}</MenuItem>)}
        </TextField>
      </Stack>
      {visibleAccounts.length === 0 && !loading ? (
        <Card><CardContent className="empty-state"><Box><Typography variant="h6">No accounts to show</Typography><Typography color="text.secondary" mt={1}>Connect a bank or choose another account type.</Typography></Box></CardContent></Card>
      ) : (
        <Box className="accounts__grid">
          {visibleAccounts.map((account) => {
            const kind = accountKind(account);
            return (
              <Card key={account.accountId} className="accounts__card">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
                    <Box className={`accounts__icon accounts__icon--${kind}`}>{kindIcon(kind)}</Box>
                    <Chip size="small" variant="outlined" label={accountDisplayType(account)} />
                  </Stack>
                  <Typography variant="h6" fontWeight={750} mt={2}>{account.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {connectionNames.get(account.bankConnectionId)}{account.mask ? ` · ••${account.mask}` : ""}
                  </Typography>
                  <Typography className="accounts__balance" variant="h4" mt={2}>{formatCurrency(accountBalance(account))}</Typography>
                  <Stack direction="row" justifyContent="space-between" mt={1.5}>
                    <Typography variant="caption" color="text.secondary">Current balance</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {account.availableBalance === null ? "Available unavailable" : `${formatCurrency(account.availableBalance)} available`}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </div>
  );
}
