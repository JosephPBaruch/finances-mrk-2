import AccountBalanceRounded from "@mui/icons-material/AccountBalanceRounded";
import CreditCardRounded from "@mui/icons-material/CreditCardRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import SavingsRounded from "@mui/icons-material/SavingsRounded";
import ShowChartRounded from "@mui/icons-material/ShowChartRounded";
import WalletRounded from "@mui/icons-material/WalletRounded";
import {
  Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, LinearProgress, MenuItem, Paper, Stack, TextField, Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useAppData } from "../../app/AppDataProvider";
import type { BankConnection } from "../../shared/api/apiTypes";
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
  const [disconnecting, setDisconnecting] = useState(false);
  const [connectionToRemove, setConnectionToRemove] = useState<BankConnection | null>(null);
  const totals = useMemo(() => summarizeAccounts(accounts), [accounts]);
  const visibleConnections = useMemo(() => connections.map((connection) => ({
    connection,
    accounts: connection.accounts.filter((account) => filter === "all" || accountKind(account) === filter),
  })).filter((group) => group.accounts.length > 0), [connections, filter]);

  const refreshBalances = async () => {
    setRefreshing(true);
    try {
      await Promise.all(connections.map((connection) => bankingApi.refreshConnectionAccounts(connection.bankConnectionId)));
      await refresh();
      notify("Account balances refreshed.", "success");
    } catch (requestError) {
      notify(requestError instanceof Error ? requestError.message : "Unable to refresh balances.", "error");
    } finally {
      setRefreshing(false);
    }
  };

  const disconnect = async () => {
    if (!connectionToRemove) return;
    setDisconnecting(true);
    try {
      await bankingApi.removeConnection(connectionToRemove.bankConnectionId);
      setConnectionToRemove(null);
      await refresh();
      notify("Bank connection removed.", "success");
    } catch (requestError) {
      notify(requestError instanceof Error ? requestError.message : "Unable to remove the bank connection.", "error");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="page accounts">
      <header className="page__header">
        <Box>
          <span className="page__eyebrow">Everything you own and owe</span>
          <Typography component="h1" className="page__title">Accounts</Typography>
          <p className="page__subtitle">Accounts are grouped by their Plaid connection so it is clear which institution owns each balance.</p>
        </Box>
        <Button variant="contained" startIcon={<RefreshRounded />} disabled={refreshing || connections.length === 0} onClick={() => void refreshBalances()}>
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
          <Typography variant="h6" fontWeight={750}>Connections</Typography>
          <Typography variant="body2" color="text.secondary">{connections.length} institution connection{connections.length === 1 ? "" : "s"}</Typography>
        </Box>
        <TextField select label="Account type" value={filter} onChange={(event) => setFilter(event.target.value as AccountKind | "all")} sx={{ minWidth: 210 }}>
          {kinds.map((kind) => <MenuItem key={kind} value={kind}>{kind === "all" ? "All account types" : accountKindLabel(kind)}</MenuItem>)}
        </TextField>
      </Stack>
      {visibleConnections.length === 0 && !loading ? (
        <Card><CardContent className="empty-state"><Box><Typography variant="h6">No accounts to show</Typography><Typography color="text.secondary" mt={1}>Connect a bank or choose another account type.</Typography></Box></CardContent></Card>
      ) : (
        <Stack spacing={2}>
          {visibleConnections.map(({ connection, accounts: connectionAccounts }) => {
            const connectionTotals = summarizeAccounts(connectionAccounts);
            return (
              <Paper key={connection.bankConnectionId} variant="outlined" className="accounts__connection">
                <Box className="accounts__connection-header">
                  <Stack direction="row" alignItems="center" spacing={1.5} minWidth={0}>
                    <Box className="accounts__institution-icon"><AccountBalanceRounded /></Box>
                    <Box minWidth={0}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography variant="h6" fontWeight={750} noWrap>{connection.institutionName ?? "Connected institution"}</Typography>
                        <Chip size="small" color={connection.status === "Active" ? "success" : "warning"} variant="outlined" label={connection.status} />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {connectionAccounts.length} account{connectionAccounts.length === 1 ? "" : "s"} · {formatCurrency(connectionTotals.netWorth)} net
                      </Typography>
                    </Box>
                  </Stack>
                  <Button color="error" size="small" startIcon={<DeleteOutlineRounded />} onClick={() => setConnectionToRemove(connection)}>
                    Disconnect
                  </Button>
                </Box>
                <Box className="accounts__grid">
                  {connectionAccounts.map((account) => {
                    const kind = accountKind(account);
                    return (
                      <Card key={account.accountId} className="accounts__card" variant="outlined">
                        <CardContent>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
                            <Box className={`accounts__icon accounts__icon--${kind}`}>{kindIcon(kind)}</Box>
                            <Chip size="small" variant="outlined" label={accountDisplayType(account)} />
                          </Stack>
                          <Typography variant="h6" fontWeight={750} mt={2}>{account.name}</Typography>
                          <Typography variant="body2" color="text.secondary">{account.mask ? `••${account.mask}` : account.officialName ?? "Account"}</Typography>
                          <Typography className="accounts__balance" variant="h4" mt={2}>{formatCurrency(accountBalance(account))}</Typography>
                          <Stack direction="row" justifyContent="space-between" gap={2} mt={1.5}>
                            <Typography variant="caption" color="text.secondary">Current balance</Typography>
                            <Typography variant="caption" color="text.secondary" textAlign="right">
                              {account.availableBalance === null ? "Available unavailable" : `${formatCurrency(account.availableBalance)} available`}
                            </Typography>
                          </Stack>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              </Paper>
            );
          })}
        </Stack>
      )}

      <Dialog open={connectionToRemove !== null} onClose={disconnecting ? undefined : () => setConnectionToRemove(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Disconnect {connectionToRemove?.institutionName ?? "this institution"}?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>This action cannot be undone.</Alert>
          <Typography>
            Plaid access will be revoked and this connection’s local accounts and transactions will be permanently deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button disabled={disconnecting} onClick={() => setConnectionToRemove(null)}>Cancel</Button>
          <Button color="error" variant="contained" disabled={disconnecting} onClick={() => void disconnect()}>
            {disconnecting ? "Disconnecting…" : "Disconnect and delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
