import RefreshRounded from "@mui/icons-material/RefreshRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import {
  Alert,
  Box,
  Button,
  Chip,
  InputAdornment,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useMemo, useState } from "react";
import { useAppData } from "../../app/AppDataProvider";
import type { FinanceTransaction } from "../../shared/api/apiTypes";
import { useNotification } from "../../shared/notifications/NotificationProvider";
import { bankingApi } from "../banking/bankingApi";
import { loadCategoryMappings } from "../budgets/budgetStorage";
import { formatCurrency, resolveBudgetCategory } from "../budgets/budgetUtils";
import { transactionApi } from "./transactionApi";
import "./TransactionsPage.scss";

export default function TransactionsPage() {
  const { transactions, accounts, loading, error, refresh } = useAppData();
  const { notify } = useNotification();
  const [search, setSearch] = useState("");
  const [accountId, setAccountId] = useState("");
  const [pending, setPending] = useState("all");
  const [syncing, setSyncing] = useState(false);
  const mappings = loadCategoryMappings();

  const rows = useMemo(() => transactions.filter((transaction) => {
    const haystack = [transaction.name, transaction.merchantName, transaction.plaidPrimaryCategory, transaction.plaidDetailedCategory]
      .filter(Boolean).join(" ").toLowerCase();
    return (!search || haystack.includes(search.toLowerCase()))
      && (!accountId || transaction.accountId === accountId)
      && (pending === "all" || transaction.pending === (pending === "pending"));
  }), [accountId, pending, search, transactions]);

  const toggleReviewed = async (transaction: FinanceTransaction) => {
    try {
      await transactionApi.update(transaction.transactionId, { isReviewed: !transaction.isReviewed });
      await refresh();
    } catch (requestError) {
      notify(requestError instanceof Error ? requestError.message : "Unable to update the transaction.", "error");
    }
  };

  const columns: GridColDef<FinanceTransaction>[] = [
    { field: "date", headerName: "Date", width: 112, sortComparator: (left, right) => String(left).localeCompare(String(right)) },
    { field: "merchantName", headerName: "Merchant", flex: 1, minWidth: 170, valueGetter: (_value, row) => row.merchantName ?? row.name },
    { field: "plaidPrimaryCategory", headerName: "Plaid Category", flex: 1, minWidth: 175, valueFormatter: (value) => String(value ?? "Uncategorized").replaceAll("_", " ") },
    { field: "budgetBucket", headerName: "Budget Bucket", flex: 1, minWidth: 190, valueGetter: (_value, row) => resolveBudgetCategory(row, mappings) },
    { field: "pending", headerName: "Status", width: 105, renderCell: ({ value }) => <Chip size="small" variant="outlined" color={value ? "warning" : "success"} label={value ? "Pending" : "Posted"} /> },
    { field: "amount", headerName: "Amount", width: 125, align: "right", headerAlign: "right", renderCell: ({ value }) => <span className={Number(value) < 0 ? "transactions__amount--income" : "transactions__amount--expense"}>{formatCurrency(Number(value), Number(value) < 0)}</span> },
    { field: "isReviewed", headerName: "Review", width: 110, sortable: false, renderCell: ({ row }) => <Button size="small" color={row.isReviewed ? "success" : "inherit"} onClick={() => void toggleReviewed(row)}>{row.isReviewed ? "Reviewed" : "Mark"}</Button> },
  ];

  const syncAll = async () => {
    setSyncing(true);
    try {
      const result = await bankingApi.syncAll();
      const added = result.results.reduce((total, item) => total + (item.statistics?.added ?? 0), 0);
      notify(added > 0 ? `${added} new transactions synced.` : "Everything is up to date.", "success");
      await refresh();
    } catch (requestError) {
      notify(requestError instanceof Error ? requestError.message : "Unable to synchronize transactions.", "error");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="page transactions">
      <header className="page__header">
        <Box><span className="page__eyebrow">Your money, itemized</span><Typography component="h1" className="page__title">Transactions</Typography>
          <p className="page__subtitle">Plaid categories arrive automatically. Review the exceptions, then let your budget update itself.</p>
        </Box>
        <Button variant="contained" startIcon={<RefreshRounded />} disabled={syncing} onClick={() => void syncAll()}>{syncing ? "Syncing…" : "Sync all"}</Button>
      </header>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper variant="outlined" className="transactions__filters">
        <TextField label="Search" value={search} onChange={(event) => setSearch(event.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded /></InputAdornment> }} />
        <TextField select label="Account" value={accountId} onChange={(event) => setAccountId(event.target.value)}>
          <MenuItem value="">All accounts</MenuItem>{accounts.map((account) => <MenuItem key={account.accountId} value={account.accountId}>{account.name} {account.mask ? `••${account.mask}` : ""}</MenuItem>)}
        </TextField>
        <TextField select label="Status" value={pending} onChange={(event) => setPending(event.target.value)}>
          <MenuItem value="all">All transactions</MenuItem><MenuItem value="posted">Posted</MenuItem><MenuItem value="pending">Pending</MenuItem>
        </TextField>
        <Typography variant="body2" color="text.secondary" ml="auto">Showing {rows.length} of {transactions.length}</Typography>
      </Paper>
      <Paper variant="outlined" className="transactions__grid">
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.transactionId}
          loading={loading}
          initialState={{ sorting: { sortModel: [{ field: "date", sort: "desc" }] }, pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          sx={{ border: 0, minHeight: 570 }}
        />
      </Paper>
    </div>
  );
}
